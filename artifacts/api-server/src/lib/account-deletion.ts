import { createHmac } from "node:crypto";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import { appRecords, db } from "@workspace/db";
import { verifyPassword, type StoredUser } from "../data/store.js";
import { buildDeletionPlan, CORE_COLLECTIONS, DeletionConflict } from "./account-deletion-plan.js";
import { ACCOUNT_LOCK, synchronizeDeletedAccounts, type DeletionEvent } from "./account-lifecycle.js";
import { driverDocumentStorage } from "./driver-documents.js";
import { logger } from "./logger.js";

export class DeletionUnauthorized extends Error {}
type Input = { phone: string; password: string; confirmation: true; requestId: string };
let cleanupRunning = false;

export async function runDeletionFileCleanup() {
  if (cleanupRunning) return;
  cleanupRunning = true;
  try {
    const jobs = await db.select().from(appRecords).where(eq(appRecords.collection, "account_deletion_files"));
    for (const job of jobs) {
      const paths = job.payload.paths as string[];
      try {
        for (const path of paths) await driverDocumentStorage.remove(path);
        await db.delete(appRecords).where(and(eq(appRecords.collection, job.collection), eq(appRecords.id, job.id)));
      } catch {
        logger.error({ deletionJobId: job.id }, "Private-file deletion will retry; account remains closed");
      }
    }
    await db.delete(appRecords).where(and(
      eq(appRecords.collection, "account_deletion_receipts"),
      sql`${appRecords.updatedAt} < NOW() - INTERVAL '7 days'`,
    ));
  } catch {
    logger.error("Account deletion cleanup storage unavailable; will retry");
  } finally { cleanupRunning = false; }
}

export function startDeletionFileCleanup() {
  void runDeletionFileCleanup();
  const timer = setInterval(() => { void runDeletionFileCleanup(); }, 60_000);
  timer.unref();
}

export async function eraseAccount(input: Input, expectedUserId?: string) {
  if (input.confirmation !== true) throw new DeletionConflict("O‘chirishni aniq tasdiqlang.");
  const receiptSecret = process.env.SESSION_SECRET;
  if (!receiptSecret) throw new Error("Account deletion retry protection is not configured");
  const receiptId = createHmac("sha256", receiptSecret).update(JSON.stringify([input.phone, input.password, input.requestId])).digest("hex");
  const result = await db.transaction(async tx => {
    await tx.execute(sql`SET LOCAL lock_timeout = '40s'`);
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${ACCOUNT_LOCK})`);
    const core = await tx.select().from(appRecords).where(inArray(appRecords.collection, CORE_COLLECTIONS));
    const owner = core.find(row => row.collection === "users" && row.payload.phone === input.phone && !row.payload.deleted)?.payload as unknown as StoredUser | undefined;
    const [receipt] = await tx.select().from(appRecords).where(and(
      eq(appRecords.collection, "account_deletion_receipts"), eq(appRecords.id, receiptId),
      sql`${appRecords.updatedAt} > NOW() - INTERVAL '7 days'`,
    ));
    if (!owner) {
      if (receipt) {
        if (expectedUserId) {
          const [event] = await tx.select().from(appRecords).where(and(eq(appRecords.collection, "account_deletion_events"), eq(appRecords.id, receipt.payload.jobId as string)));
          if (event?.payload.userId !== expectedUserId) throw new DeletionUnauthorized("Bu so‘rov boshqa akkauntga tegishli.");
        }
        return { jobId: receipt.payload.jobId as string };
      }
      throw new DeletionUnauthorized("Telefon yoki parol noto‘g‘ri.");
    }
    if (expectedUserId && owner.id !== expectedUserId) throw new DeletionUnauthorized("Bu telefon kirilgan akkauntga tegishli emas.");
    if (!verifyPassword(input.password, owner.password)) throw new DeletionUnauthorized("Telefon yoki parol noto‘g‘ri.");
    if (receipt) throw new DeletionConflict("Bu so‘rov eski akkauntga tegishli. Sahifani qayta ochib yangi so‘rov yuboring.");
    const plan = buildDeletionPlan(owner, core);
    const ownListingIds = new Set(core.filter(r => r.collection === "listings" && r.payload.userId === owner.id).map(r => r.id));
    if (ownListingIds.size) await tx.delete(appRecords).where(and(
      eq(appRecords.collection, 'listing_translations'),
      inArray(sql<string>`${appRecords.payload}->>'listingId'`, [...ownListingIds]),
    ));
    const relatedImages = await tx.select({ id: appRecords.id }).from(appRecords).where(and(eq(appRecords.collection, "images"), or(
      sql`${appRecords.payload}->>'userId' = ${owner.id}`,
      plan.imageIds.length ? inArray(appRecords.id, plan.imageIds) : sql`false`,
    )));
    plan.imageIds = [...new Set([...plan.imageIds, ...relatedImages.map(r => r.id)])];
    for (const id of plan.imageIds) plan.deleted.push({ collection: "images", id });
    const carts = await tx.select().from(appRecords).where(eq(appRecords.collection, "carts"));
    for (const cart of carts) {
      if (cart.id === owner.id) continue;
      const oldItems = cart.payload.items as Array<{ listing: { id: string; userId?: string } }>;
      if (!Array.isArray(oldItems)) continue;
      const items = oldItems.filter(item => !ownListingIds.has(item.listing.id) && item.listing.userId !== owner.id);
      if (items.length !== oldItems.length) await tx.update(appRecords).set({
        payload: { ...cart.payload, items, revision: Number(cart.payload.revision ?? 0) + 1 }, updatedAt: new Date(),
      }).where(and(eq(appRecords.collection, "carts"), eq(appRecords.id, cart.id)));
    }
    for (const { collection, id } of plan.deleted) await tx.delete(appRecords).where(and(eq(appRecords.collection, collection), eq(appRecords.id, id)));
    for (const row of plan.updated) await tx.insert(appRecords).values({ ...row, updatedAt: new Date() }).onConflictDoUpdate({
      target: [appRecords.collection, appRecords.id], set: { payload: row.payload, updatedAt: new Date() },
    });
    const ownerPrefix = `${owner.id}:`;
    const budgetPrefix = `account:${owner.id}:`;
    await tx.delete(appRecords).where(or(
      and(eq(appRecords.collection, "carts"), eq(appRecords.id, owner.id)),
      and(inArray(appRecords.collection, ["cart_operations", "photo_search_requests"]), sql`starts_with(${appRecords.id}, ${ownerPrefix})`),
      and(eq(appRecords.collection, "ai_advice_usage"), sql`starts_with(${appRecords.id}, ${budgetPrefix})`),
      and(eq(appRecords.collection, "product_demand_notifications"), sql`${appRecords.payload}->>'userId' = ${owner.id}`),
      and(eq(appRecords.collection, "cargo_notifications"), sql`${appRecords.payload}->>'userId' = ${owner.id}`),
    ));
    const event: DeletionEvent = {
      userId: owner.id, deleted: plan.deleted, updated: plan.updated.map(({ collection, id }) => ({ collection, id })),
      imageIds: plan.imageIds, trackingLoadIds: plan.trackingLoadIds,
    };
    await tx.insert(appRecords).values({
      collection: "account_deletion_events", id: input.requestId, payload: event as unknown as Record<string, unknown>,
    });
    if (plan.objectPaths.length) await tx.insert(appRecords).values({
      collection: "account_deletion_files", id: input.requestId, payload: { paths: plan.objectPaths },
    });
    // Password/phone themselves never enter the receipt: the random operation
    // identity salts the credential fingerprint used for uncertain retries.
    await tx.insert(appRecords).values({
      collection: "account_deletion_receipts", id: receiptId, payload: { jobId: input.requestId },
    });
    return { jobId: input.requestId };
  });
  await synchronizeDeletedAccounts();
  const [pending] = await db.select({ id: appRecords.id }).from(appRecords).where(and(
    eq(appRecords.collection, "account_deletion_files"), eq(appRecords.id, result.jobId),
  ));
  void runDeletionFileCleanup();
  return { status: "deleted" as const, filesPending: Boolean(pending) };
}
