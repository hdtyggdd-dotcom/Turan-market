import { and, eq } from "drizzle-orm";
import { accountCoordinationPool, appRecords, db } from "@workspace/db";
import type { RequestHandler } from "express";
import { users, listings, orders, driverProfiles, cargoLoads, cargoOffers, cargoTrackingUpdates, cargoNotifications } from "../data/store.js";
import { imageStore } from "./image-store.js";
import { forgetAccountNotifications } from "./cargo-notifications.js";
import type { CoreRecord } from "./account-deletion-plan.js";

export const ACCOUNT_LOCK = 73924511;
const arrays: Record<string, { id: string }[]> = {
  users, listings, orders, driver_profiles: driverProfiles, cargo_loads: cargoLoads, cargo_offers: cargoOffers,
};
export interface DeletionEvent {
  userId: string;
  deleted: { collection: string; id: string }[];
  updated: { collection: string; id: string }[];
  imageIds: string[];
  trackingLoadIds: string[];
}
const processed = new Set<string>();
let syncTail = Promise.resolve();

async function applyEvent(event: DeletionEvent) {
  for (const { collection, id } of event.deleted) {
    const target = arrays[collection];
    const index = target?.findIndex(item => item.id === id) ?? -1;
    if (target && index >= 0) target.splice(index, 1);
  }
  for (const { collection, id } of event.updated) {
    const target = arrays[collection];
    if (!target) continue;
    const [row] = await db.select().from(appRecords).where(and(eq(appRecords.collection, collection), eq(appRecords.id, id)));
    if (!row) continue;
    const index = target.findIndex(item => item.id === id);
    const item = row.payload as unknown as CoreRecord["payload"] & { id: string };
    if (index < 0) target.push(item); else target[index] = item;
  }
  for (const id of event.imageIds) imageStore.delete(id);
  for (let i = cargoTrackingUpdates.length - 1; i >= 0; i--) {
    if (event.trackingLoadIds.includes(cargoTrackingUpdates[i]!.loadId)) cargoTrackingUpdates.splice(i, 1);
  }
  forgetAccountNotifications(event.userId);
  for (let i = cargoNotifications.length - 1; i >= 0; i--) {
    if (cargoNotifications[i]!.loadId && event.trackingLoadIds.includes(cargoNotifications[i]!.loadId!)) cargoNotifications.splice(i, 1);
  }
}

/** Fresh durable events prevent another autoscale worker serving old PII. */
export function synchronizeDeletedAccounts(): Promise<void> {
  const work = syncTail.then(async () => {
    const events = await db.select().from(appRecords).where(eq(appRecords.collection, "account_deletion_events"));
    for (const row of events) {
      if (processed.has(row.id)) continue;
      await applyEvent(row.payload as unknown as DeletionEvent);
      processed.add(row.id);
    }
  });
  syncTail = work.catch(() => {});
  return work;
}

/** Shared request locks exclude deletion until an in-flight write settles. */
export const accountLifecycleGuard: RequestHandler = async (req, res, next) => {
  let release: (() => Promise<void>) | undefined;
  try {
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && !(req.method === "POST" && req.path === "/account-deletion")) {
      const connection = await accountCoordinationPool.connect();
      let released = false;
      release = async () => {
        if (released) return;
        released = true;
        try { await connection.query("SELECT pg_advisory_unlock_shared($1)", [ACCOUNT_LOCK]); connection.release(); }
        catch { connection.release(true); }
      };
      await connection.query("SELECT pg_advisory_lock_shared($1)", [ACCOUNT_LOCK]);
      // A disconnected browser does not cancel the server handler. Unlock only
      // when it actually ends its response, not on the socket's close event.
      res.end = new Proxy(res.end, {
        apply(target, receiver, args) {
          try { return Reflect.apply(target, receiver, args); }
          finally { void release?.(); }
        },
      });
      res.once("finish", () => { void release?.(); });
    }
    await synchronizeDeletedAccounts();
    if (res.destroyed) { await release?.(); return; }
    next();
  } catch {
    await release?.();
    if (!res.headersSent) res.status(503).json({ error: "account_storage_unavailable", message: "Server vaqtincha band. So‘rovni qayta urinib ko‘ring." });
  }
};
