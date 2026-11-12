import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { appRecords, db } from "@workspace/db";
import { GetCartResponse, type Cart, type CartItem } from "@workspace/api-zod";
import { listings, users, regions, districts, neighborhoods, sanitizeUser } from "../data/store.js";

export class CartError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function listingSnapshot(listingId: string): CartItem["listing"] {
  const listing = listings.find(item => item.id === listingId);
  if (!listing) throw new CartError(404, "Mahsulot topilmadi.");
  const user = users.find(item => item.id === listing.userId);
  return GetCartResponse.shape.items.element.shape.listing.parse({
    ...listing,
    user: user ? sanitizeUser(user) : null,
    region: regions.find(item => item.id === listing.regionId) ?? null,
    district: districts.find(item => item.id === listing.districtId) ?? null,
    neighborhood: neighborhoods.find(item => item.id === listing.neighborhoodId) ?? null,
    distanceKm: null, distanceColor: null,
  });
}

/** Read from PostgreSQL on every request, never from a process-local cart cache. */
export async function readCart(owner: string): Promise<Cart> {
  const [record] = await db.select().from(appRecords).where(
    and(eq(appRecords.collection, "carts"), eq(appRecords.id, owner)),
  );
  return record ? GetCartResponse.parse(record.payload) : { items: [], revision: 0 };
}

/**
 * The cart row lock serializes different phones AND different server processes.
 * Durable receipts prevent lost responses from applying additions/imports twice.
 */
export async function changeCart(
  owner: string, operationId: string, input: unknown,
  update: (cart: Cart, hasOrder: (requestId: string) => Promise<boolean>) => Promise<void> | void,
): Promise<Cart> {
  const fingerprint = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  return db.transaction(async tx => {
    await tx.insert(appRecords).values({
      collection: "carts", id: owner, payload: { items: [], revision: 0 },
    }).onConflictDoNothing();
    const [record] = await tx.select().from(appRecords).where(
      and(eq(appRecords.collection, "carts"), eq(appRecords.id, owner)),
    ).for("update");
    const cart = GetCartResponse.parse(record!.payload);
    const receiptId = `${owner}:${operationId}`;
    const [receipt] = await tx.select().from(appRecords).where(
      and(eq(appRecords.collection, "cart_operations"), eq(appRecords.id, receiptId)),
    );
    if (receipt) {
      if (receipt.payload.fingerprint !== fingerprint) {
        throw new CartError(409, "Bu savatcha so‘rovi boshqa ma’lumot bilan yuborilgan.");
      }
      return cart;
    }
    const hasOrder = async (requestId: string) => {
      const orderId = `cart_${createHash("sha256").update(`${owner}:${requestId}`).digest("hex")}`;
      const [order] = await tx.select().from(appRecords).where(
        and(eq(appRecords.collection, "orders"), eq(appRecords.id, orderId)),
      );
      return Boolean(order);
    };
    await update(cart, hasOrder);
    cart.revision += 1;
    await tx.update(appRecords).set({
      payload: cart as unknown as Record<string, unknown>, updatedAt: new Date(),
    }).where(and(eq(appRecords.collection, "carts"), eq(appRecords.id, owner)));
    await tx.insert(appRecords).values({
      collection: "cart_operations", id: receiptId, payload: { fingerprint },
    });
    return cart;
  });
}

export function sameRevision(cart: Cart, revision: number) {
  if (cart.revision !== revision) throw new CartError(409, "Savatcha boshqa telefonda o‘zgardi. Yangilab, qayta urinib ko‘ring.");
}

export function matchingItem(cart: Cart, listingId: string, requestId: string) {
  const item = cart.items.find(item => item.listing.id === listingId && item.requestId === requestId);
  if (!item) {
    throw new CartError(409, "Savatchadagi mahsulot o‘zgardi. Savatchani yangilang.");
  }
  return item;
}
