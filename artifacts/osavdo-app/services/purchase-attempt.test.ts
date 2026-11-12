import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Order } from '@workspace/api-client-react';
import { submitPurchase } from './purchase-attempt';

function storage() {
  const data = new Map<string, string>();
  return { data, getItem: async (key: string) => data.get(key) ?? null,
    setItem: async (key: string, value: string) => { data.set(key, value); },
    removeItem: async (key: string) => { data.delete(key); } };
}
const input = { listingId: 'product', quantity: 2 };
test('lost responses preserve the exact direct-purchase identity across reloads', async () => {
  const store = storage();
  let first = '';
  await assert.rejects(submitPurchase(store, 'buyer', input, async body => {
    first = body.clientRequestId!;
    throw new Error('response lost');
  }, () => true));
  const result = await submitPurchase(store, 'buyer', input, async body => {
    assert.equal(body.clientRequestId, first);
    return { id: 'original', status: 'pending', quantity: 2 } as Order;
  }, () => true);
  assert.equal(result.order.id, 'original');
  assert.equal(store.data.size, 0);
});
test('changed quantities and another product cannot replace an uncertain purchase', async () => {
  const store = storage();
  await assert.rejects(submitPurchase(store, 'buyer', input, async () => { throw new Error('timeout'); }, () => true));
  for (const changed of [{ ...input, quantity: 3 }, { ...input, listingId: 'other' }]) {
    await assert.rejects(submitPurchase(store, 'buyer', changed, async () => { assert.fail('must not send'); }, () => true), /Oldingi xarid/);
  }
});
test('expiry keeps the journal and a changed account sends no purchase', async () => {
  const store = storage();
  await assert.rejects(submitPurchase(store, 'buyer', input, async () => { throw Object.assign(new Error('unauthorized'), { status: 401 }); }, () => true));
  assert(store.data.has('turan_purchase:buyer'));
  await assert.rejects(submitPurchase(store, 'buyer', input, async () => { assert.fail('must not send'); }, () => false));
});
test('a failed local cleanup does not turn a confirmed purchase into a failure', async () => {
  const store = storage();
  const result = await submitPurchase({ ...store, removeItem: async () => { throw new Error('storage unavailable'); } },
    'buyer', input, async () => ({ id: 'saved', status: 'pending' }) as Order, () => true);
  assert.equal(result.order.id, 'saved');
  assert.equal(result.cleanupPending, true);
  assert(store.data.has('turan_purchase:buyer'));
});
