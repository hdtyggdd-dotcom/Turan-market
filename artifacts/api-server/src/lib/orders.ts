import { createHash } from "node:crypto";
import { and, eq, or, sql } from "drizzle-orm";
import { appRecords, db } from "@workspace/db";
import { generateId, orders, type StoredListing, type StoredOrder, type StoredUser } from "../data/store.js";
import { insertOrReadRecord } from "./persistence.js";

export class OrderError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export interface OrderInput {
  listingId: string;
  quantity: number;
  clientRequestId?: string;
  deliveryOption?: string | null;
  deliveryPrice?: number | null;
  notes?: string | null;
}
export function orderRequestId(buyerId: string, requestId: string) {
  return `cart_${createHash("sha256").update(`${buyerId}:${requestId}`).digest("hex")}`;
}
function remember(order: StoredOrder) {
  const index = orders.findIndex(item => item.id === order.id);
  if (index < 0) orders.push(order); else orders[index] = order;
  return order;
}
function matches(order: StoredOrder, buyer: string, input: OrderInput) {
  return order.buyerId === buyer && order.listingId === input.listingId && order.quantity === input.quantity &&
    (order.deliveryOption ?? null) === (input.deliveryOption ?? null) &&
    (order.deliveryPrice ?? null) === (input.deliveryPrice ?? null) && (order.notes ?? null) === (input.notes ?? null);
}
const conflict = () => new OrderError(409, "request_conflict", "Bu so‘rov oldin boshqa ma’lumot bilan yuborilgan. Mavjud buyurtmalaringizni tekshiring.");

/** The cart lock also excludes quantity edits while a checkout is committed. */
export async function createOrReplayOrder(buyerId: string, input: OrderInput) {
  const id = input.clientRequestId ? orderRequestId(buyerId, input.clientRequestId) : generateId();
  const result = await db.transaction(async tx => {
    await tx.insert(appRecords).values({ collection: "carts", id: buyerId, payload: { items: [], revision: 0 } }).onConflictDoNothing();
    const [cart] = await tx.select().from(appRecords).where(and(eq(appRecords.collection, "carts"), eq(appRecords.id, buyerId))).for("update");
    const key = and(eq(appRecords.collection, "orders"), eq(appRecords.id, id));
    const [record] = await tx.select().from(appRecords).where(key).for("update");
    if (record) {
      const existing = record.payload as unknown as StoredOrder;
      if (!matches(existing, buyerId, input)) throw conflict();
      return { order: existing, created: false };
    }
    if (input.clientRequestId) {
      const item = (cart!.payload.items as { requestId: string; quantity: number; listing: { id: string } }[])
        .find(item => item.requestId === input.clientRequestId);
      if (item && (item.listing.id !== input.listingId || item.quantity !== input.quantity)) throw conflict();
    }
    const [listingRow] = await tx.select().from(appRecords).where(and(eq(appRecords.collection, "listings"), eq(appRecords.id, input.listingId)));
    if (!listingRow) throw new OrderError(404, "not_found", "Mahsulot topilmadi.");
    const listing = listingRow.payload as unknown as StoredListing;
    if (listing.userId === buyerId) throw new OrderError(403, "forbidden", "O‘z mahsulotingizga buyurtma bera olmaysiz.");
    const [sellerRow] = await tx.select().from(appRecords).where(and(eq(appRecords.collection, "users"), eq(appRecords.id, listing.userId)));
    const seller = sellerRow?.payload as unknown as StoredUser | undefined;
    if (!seller || seller.deleted || listing.status !== "active") throw new OrderError(409, "unavailable", "Mahsulot hozir sotuvda emas.");
    const totalPrice = listing.price * input.quantity;
    if (!Number.isFinite(listing.price) || listing.price < 0 || !Number.isFinite(totalPrice)) throw new OrderError(409, "unavailable", "Mahsulot narxi noto‘g‘ri.");
    const order: StoredOrder = {
      id, listingId: listing.id, buyerId, sellerId: listing.userId, quantity: input.quantity,
      totalPrice, deliveryOption: input.deliveryOption ?? null, deliveryPrice: input.deliveryPrice ?? null,
      notes: input.notes ?? null, status: "pending", createdAt: new Date().toISOString(),
    };
    // Never upsert a purchase: another process's accepted quantity is immutable.
    const result = await insertOrReadRecord(tx, "orders", id, order as unknown as Record<string, unknown>);
    const existing = result.record.payload as unknown as StoredOrder;
    if (!matches(existing, buyerId, input)) throw conflict();
    return { order: existing, created: result.created };
  });
  return { ...result, order: remember(result.order) };
}

export async function readOrders(owner: string) {
  const rows = await db.select().from(appRecords).where(and(eq(appRecords.collection, "orders"),
    or(sql`${appRecords.payload}->>'buyerId' = ${owner}`, sql`${appRecords.payload}->>'sellerId' = ${owner}`)));
  return rows.map(row => remember(row.payload as unknown as StoredOrder));
}
export async function readOrder(id: string) {
  const [row] = await db.select().from(appRecords).where(and(eq(appRecords.collection, "orders"), eq(appRecords.id, id)));
  return row ? remember(row.payload as unknown as StoredOrder) : undefined;
}
export async function changeOrderStatus(id: string, actor: string, status: StoredOrder["status"]) {
  const order = await db.transaction(async tx => {
    const key = and(eq(appRecords.collection, "orders"), eq(appRecords.id, id));
    const [row] = await tx.select().from(appRecords).where(key).for("update");
    if (!row) throw new OrderError(404, "not_found", "Buyurtma topilmadi.");
    const current = row.payload as unknown as StoredOrder;
    if (current.buyerId !== actor && current.sellerId !== actor) throw new OrderError(403, "forbidden", "Access denied");
    const next = { ...current, status };
    await tx.update(appRecords).set({ payload: next as unknown as Record<string, unknown>, updatedAt: new Date() }).where(key);
    return next;
  });
  return remember(order);
}
