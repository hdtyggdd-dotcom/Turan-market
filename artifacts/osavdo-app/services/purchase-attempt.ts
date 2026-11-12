import type { CreateOrderRequest, Order } from '@workspace/api-client-react';

type Storage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};
const fingerprint = (input: CreateOrderRequest) => JSON.stringify({
  listingId: input.listingId, quantity: input.quantity, deliveryOption: input.deliveryOption ?? null,
  deliveryPrice: input.deliveryPrice ?? null, notes: input.notes ?? null,
});
/** Save identity before sending; a lost response must never become a new purchase. */
export async function submitPurchase(storage: Storage, owner: string, input: CreateOrderRequest,
  send: (input: CreateOrderRequest) => Promise<Order>, isCurrent: () => boolean) {
  const key = `turan_purchase:${owner}`;
  const saved = await storage.getItem(key);
  let attempt: CreateOrderRequest;
  if (saved) {
    attempt = JSON.parse(saved) as CreateOrderRequest;
    if (!attempt.clientRequestId || fingerprint(attempt) !== fingerprint(input)) {
      throw new Error('Oldingi xarid holati noaniq. Buyurtmalarimni tekshiring; oldingi so‘rov miqdorini o‘zgartirmang.');
    }
  } else {
    attempt = { ...input, clientRequestId: `buy_${Date.now()}_${Math.random().toString(36).slice(2, 12)}` };
    if (!isCurrent()) throw new Error('Akkaunt o‘zgargan. Qayta kiring.');
    await storage.setItem(key, JSON.stringify(attempt));
  }
  if (!isCurrent()) throw new Error('Akkaunt o‘zgargan. Xarid yuborilmadi.');
  let order: Order;
  try { order = await send(attempt); }
  catch (error) {
    // Only a definitive rejection of a new intent can clear it. Conflicts may
    // already have a purchase; authentication/network failures remain retryable.
    if ([400, 403, 404, 422].includes((error as { status?: number }).status ?? 0)) await storage.removeItem(key);
    throw error;
  }
  let cleanupPending = false;
  try { await storage.removeItem(key); } catch { cleanupPending = true; }
  return { order, cleanupPending };
}
