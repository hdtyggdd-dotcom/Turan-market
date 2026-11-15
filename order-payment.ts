import { and, eq } from "drizzle-orm";
import { appRecords, db } from "@workspace/db";
import type { StoredOrder } from "../data/store.js";
import { OrderError } from "./orders.js";

export type PaymentStatus = "unpaid" | "paid_claimed" | "paid_confirmed" | "cash";
export type PaymentAction = "claim_paid" | "choose_cash" | "confirm_paid" | "reject_paid";
type PaidOrder = StoredOrder & { paymentStatus?: PaymentStatus; paymentUpdatedAt?: string };

export async function changeOrderPayment(id: string, actor: string, action: PaymentAction) {
  return db.transaction(async tx => {
    const key = and(eq(appRecords.collection, "orders"), eq(appRecords.id, id));
    const [row] = await tx.select().from(appRecords).where(key).for("update");
    if (!row) throw new OrderError(404, "not_found", "Buyurtma topilmadi.");
    const current = row.payload as unknown as PaidOrder;
    const isBuyer = current.buyerId === actor;
    const isSeller = current.sellerId === actor;
    if (!isBuyer && !isSeller) throw new OrderError(403, "forbidden", "Access denied");
    if (current.status === "cancelled") throw new OrderError(409, "cancelled", "Buyurtma bekor qilingan.");

    const state: PaymentStatus = current.paymentStatus ?? "unpaid";
    let next: PaymentStatus;

    if (action === "claim_paid" || action === "choose_cash") {
      if (!isBuyer) throw new OrderError(403, "forbidden", "Bu amalni faqat xaridor bajara oladi.");
      if (state !== "unpaid") throw new OrderError(409, "invalid_state", "To‘lov holati allaqachon o‘zgargan.");
      next = action === "claim_paid" ? "paid_claimed" : "cash";
    } else {
      if (!isSeller) throw new OrderError(403, "forbidden", "Bu amalni faqat sotuvchi bajara oladi.");
      if (state !== "paid_claimed") throw new OrderError(409, "invalid_state", "Xaridor hali “to‘ladim” demagan.");
      next = action === "confirm_paid" ? "paid_confirmed" : "unpaid";
    }

    const updated: PaidOrder = { ...current, paymentStatus: next, paymentUpdatedAt: new Date().toISOString() };
    await tx.update(appRecords)
      .set({ payload: updated as unknown as Record<string, unknown>, updatedAt: new Date() })
      .where(key);
    return updated as StoredOrder;
  });
}
