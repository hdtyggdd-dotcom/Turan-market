import assert from 'node:assert/strict';
import { test as nodeTest } from 'node:test';
import { harness, account, keys, product, item, httpError } from './test-support/cart-harness.mjs';

const test = (name, work) => nodeTest(name, { timeout: 5000 }, work);
const alice = keys('alice');
const pendingAdd = {
  action: 'add',
  data: { listingId: 'product-one', quantity: 2, requestId: 'saved-request-one', operationId: 'saved-operation-one' },
};
const legacy = () => JSON.stringify([{ listing: product(), quantity: 2 }]);
const noMutations = h => assert.equal(h.effects.length, 0);
const allIdentity = (calls, expected) => {
  assert(calls.length >= 2, 'must actually retry');
  for (const call of calls) assert.deepEqual(call.body, expected);
};

test('existing add, quantity, listing refresh, remove and clear behavior stays intact', async t => {
  const h = await harness(t);
  await h.mount();
  assert.equal(h.value.ready, true);
  await h.run(() => h.value.addItem(product(), 2));
  assert.equal(h.value.count, 2);
  const requestId = h.value.items[0].requestId;
  await h.run(() => h.value.setQuantity('product-one', 4, requestId));
  assert.equal(h.value.count, 4);
  await h.run(() => h.value.refreshItem(product(), h.value.items[0]));
  assert.equal(h.calls('updateCartItem').at(-1).body.refreshListing, true);
  await h.run(() => h.value.removeItem('product-one', h.value.items[0]));
  assert.equal(h.value.count, 0);
  await h.run(() => h.value.addItem(product('product-two'), 3));
  await h.run(() => h.value.clear());
  assert.equal(h.value.count, 0);
  assert.equal(h.value.error, null);
  assert.equal(h.disk.has(alice.pending), false);
  for (const call of h.effects) {
    const index = h.trace.indexOf(call);
    const write = h.trace.slice(0, index).findLast(entry =>
      entry.boundary === 'storage' && entry.method === 'setItem' && entry.key === alice.pending);
    assert(write, 'every mutation must be journaled before sending');
    assert.deepEqual(JSON.parse(write.data).data, call.body);
    assert.equal(call.token, 'token-alice');
  }
});

test('migration identities are durably saved before any network call', async t => {
  const h = await harness(t);
  h.disk.set(alice.legacy, legacy());
  const writing = h.storage.hold(`setItem:${alice.migration}`);
  await h.mount();
  await writing.entered;
  assert.equal(h.trace.some(entry => entry.boundary === 'api'), false);
  assert.equal(h.disk.has(alice.migration), false);
  await h.run(() => writing.release());
  assert.equal(h.calls('mergeCart').length, 1);
  const body = h.calls('mergeCart')[0].body;
  assert.match(body.operationId, /^cart_/);
  assert.match(body.items[0].requestId, /^cart_/);
  const saved = h.trace.find(entry => entry.method === 'setItem' && entry.key === alice.migration);
  assert.deepEqual(JSON.parse(saved.data), body);
  assert(h.trace.indexOf(saved) < h.trace.indexOf(h.calls('mergeCart')[0]));
  assert.equal(h.value.count, 2);
});

for (const failure of ['multiGet', 'setItem']) {
  test(`migration ${failure} failure sends nothing and preserves the legacy cart`, async t => {
    const h = await harness(t);
    h.disk.set(alice.legacy, legacy());
    h.storage.fail(`${failure}:${failure === 'multiGet' ? alice.legacy : alice.migration}`);
    await h.mount();
    assert.equal(h.trace.some(entry => entry.boundary === 'api'), false);
    assert.equal(h.disk.get(alice.legacy), legacy());
    assert.equal(h.value.ready, false);
    assert.match(h.value.error, /storage unavailable/);
    await h.run(() => h.value.refresh());
    assert.equal(h.value.count, 2);
    assert.equal(h.effects.length, 1);
  });
}

test('lost migration response reuses both generated identities after provider remount', async t => {
  const h = await harness(t);
  h.disk.set(alice.legacy, legacy());
  h.api.fail('mergeCart:response', new Error('response lost'));
  await h.mount();
  const saved = JSON.parse(h.disk.get(alice.migration));
  assert.equal(h.disk.get(alice.legacy), legacy());
  assert.equal(h.effects.length, 1, 'server already accepted the import');
  await h.unmount();
  await h.mount();
  allIdentity(h.calls('mergeCart'), saved);
  assert.equal(h.effects.length, 1, 'replay must use the same receipt, not import again');
  assert.equal(h.value.count, 2);
  assert.equal(h.disk.has(alice.migration), false);
  assert.equal(h.disk.has(alice.legacy), false);
});

for (const cleanupKey of ['legacy', 'migration']) {
  test(`successful import with ${cleanupKey} remove failure keeps its receipt on remount`, async t => {
    const h = await harness(t);
    h.disk.set(alice.legacy, legacy());
    h.storage.fail(`removeItem:${alice[cleanupKey]}`);
    await h.mount();
    const saved = JSON.parse(h.disk.get(alice.migration));
    assert.equal(h.effects.length, 1);
    assert.equal(h.disk.has(alice.legacy), cleanupKey === 'legacy');
    assert.equal(h.value.ready, false);
    await h.unmount();
    await h.mount();
    allIdentity(h.calls('mergeCart'), saved);
    assert.equal(h.effects.length, 1);
    assert.equal(h.value.count, 2);
    assert.equal(h.disk.has(alice.migration), false);
  });
}

test('lost POST response replays the original operationId and requestId after remount', async t => {
  const h = await harness(t);
  await h.mount();
  h.api.fail('addCartItem:response', new Error('connection lost after commit'));
  await h.run(() => assert.rejects(h.value.addItem(product(), 2), /connection lost/));
  const original = JSON.parse(h.disk.get(alice.pending));
  assert.deepEqual(h.calls('addCartItem')[0].body, original.data);
  assert.equal(h.carts.get('alice').items[0].quantity, 2);
  assert.equal(h.value.ready, false);
  await h.unmount();
  await h.mount();
  allIdentity(h.calls('addCartItem'), original.data);
  assert.equal(h.effects.length, 1);
  assert.equal(h.value.count, 2);
  assert.equal(h.disk.has(alice.pending), false);
});

test('a different user action cannot overwrite an uncertain POST journal', async t => {
  const h = await harness(t);
  await h.mount();
  h.api.fail('addCartItem:response', new Error('offline'));
  await h.run(() => assert.rejects(h.value.addItem(product(), 2), /offline/));
  const original = JSON.parse(h.disk.get(alice.pending));
  h.api.fail('addCartItem', new Error('still offline'));
  await h.run(() => assert.rejects(h.value.addItem(product('product-two'), 3), /still offline/));
  assert.deepEqual(JSON.parse(h.disk.get(alice.pending)), original);
  allIdentity(h.calls('addCartItem'), original.data);
  await h.run(() => assert.rejects(h.value.addItem(product('product-two'), 3), /Oldingi savatcha/));
  assert.equal(h.value.count, 2);
  assert.equal(h.effects.length, 1, 'the second product must not be silently submitted');
});

for (const method of ['getItem', 'setItem']) {
  test(`mutation ${method} error does not submit an unjournaled change`, async t => {
    const h = await harness(t);
    await h.mount();
    h.storage.fail(`${method}:${alice.pending}`);
    await h.run(() => assert.rejects(h.value.addItem(product()), /storage unavailable/));
    noMutations(h);
    assert.equal(h.disk.has(alice.pending), false);
    await h.run(() => h.value.addItem(product()));
    assert.equal(h.value.count, 1);
  });
}

test('successful mutation with failed storage cleanup replays its existing receipt', async t => {
  const h = await harness(t);
  await h.mount();
  h.storage.fail(`removeItem:${alice.pending}`);
  await h.run(() => assert.rejects(h.value.addItem(product(), 2), /storage unavailable/));
  const saved = JSON.parse(h.disk.get(alice.pending));
  await h.run(() => h.value.refresh());
  allIdentity(h.calls('addCartItem'), saved.data);
  assert.equal(h.effects.length, 1);
  assert.equal(h.value.count, 2);
  assert.equal(h.disk.has(alice.pending), false);
});

test('pending journal read failure leaves the saved action untouched', async t => {
  const h = await harness(t);
  h.disk.set(alice.pending, JSON.stringify(pendingAdd));
  h.storage.fail(`getItem:${alice.pending}`);
  await h.mount();
  assert.deepEqual(JSON.parse(h.disk.get(alice.pending)), pendingAdd);
  noMutations(h);
  await h.run(() => h.value.refresh());
  assert.deepEqual(h.calls('addCartItem')[0].body, pendingAdd.data);
  assert.equal(h.value.count, 2);
});

for (const status of [401, 429]) {
  test(`HTTP ${status} during POST and replay preserves the journal through reauthentication`, async t => {
    const h = await harness(t);
    await h.mount();
    h.api.fail('addCartItem', httpError(status));
    await h.run(() => assert.rejects(h.value.addItem(product(), 2), { status }));
    const saved = JSON.parse(h.disk.get(alice.pending));
    assert.equal(h.value.ready, false);
    h.api.fail('addCartItem', httpError(status));
    await h.run(() => assert.rejects(h.value.refresh(), { status }));
    assert.deepEqual(JSON.parse(h.disk.get(alice.pending)), saved);
    assert.deepEqual(h.expired, status === 401 ? ['token-alice', 'token-alice'] : []);
    await h.login({ user: null, token: null });
    assert.equal(h.value.items.length, 0);
    assert.deepEqual(JSON.parse(h.disk.get(alice.pending)), saved);
    await h.login(account('alice', 'renewed-alice'));
    allIdentity(h.calls('addCartItem'), saved.data);
    assert.equal(h.calls('addCartItem').at(-1).token, 'renewed-alice');
    assert.equal(h.value.count, 2);
    assert.equal(h.disk.has(alice.pending), false);
  });
  test(`HTTP ${status} during migration preserves legacy data and migration identities`, async t => {
    const h = await harness(t);
    h.disk.set(alice.legacy, legacy());
    h.api.fail('mergeCart', httpError(status));
    await h.mount();
    const saved = JSON.parse(h.disk.get(alice.migration));
    assert.equal(h.disk.get(alice.legacy), legacy());
    assert.deepEqual(h.expired, status === 401 ? ['token-alice'] : []);
    await h.run(() => h.value.refresh());
    allIdentity(h.calls('mergeCart'), saved);
    assert.equal(h.value.count, 2);
  });
}

test('definitive rejection whose cleanup fails still preserves the uncertain journal', async t => {
  const h = await harness(t);
  await h.mount();
  h.api.fail('addCartItem', httpError(409));
  h.storage.fail(`removeItem:${alice.pending}`);
  await h.run(() => assert.rejects(h.value.addItem(product()), { status: 409 }));
  assert(h.disk.has(alice.pending));
  assert.equal(h.value.ready, false);
  await h.run(() => h.value.refresh());
  assert.equal(h.value.count, 1);
});

for (const method of ['getCart', 'addCartItem', 'mergeCart']) {
  test(`late ${method} success across rapid logout/login never appears in the new account`, async t => {
    const h = await harness(t);
    h.carts.set('alice', { items: [item('alice-only')], revision: 3 });
    h.carts.set('bob', { items: [item('bob-only', 7)], revision: 9 });
    await h.mount();
    if (method === 'mergeCart') h.disk.set(alice.legacy, legacy());
    const gate = h.api.hold(`${method}:response`);
    const old = await h.start(() => method === 'addCartItem'
      ? h.value.addItem(product(), 2) : h.value.refresh());
    await gate.entered;
    const from = h.snapshots.length;
    await h.login({ user: null, token: null });
    await h.login(account('bob'));
    assert.equal(h.value.count, 0, 'old cart must disappear before the new request finishes');
    await h.run(() => gate.release());
    assert.equal((await old.result).error, undefined);
    assert.equal(h.value.count, 7);
    for (const snapshot of h.snapshots.slice(from)) {
      assert(snapshot.items.every(entry => entry.listing.id === 'bob-only'),
        `leaked old items to ${snapshot.owner}`);
    }
    const oldCall = h.calls(method).findLast(call => call.owner === 'alice');
    assert.equal(oldCall.token, 'token-alice');
    assert.equal(h.calls('getCart').at(-1).token, 'token-bob');
  });
}

for (const renewed of [account('bob'), account('alice', 'renewed-alice')]) {
  test(`late 401 cannot expire newer session ${renewed.token}`, async t => {
    const h = await harness(t);
    await h.mount();
    const gate = h.api.hold('addCartItem:response');
    const old = await h.start(() => h.value.addItem(product(), 2));
    await gate.entered;
    const original = h.disk.get(alice.pending);
    await h.login({ user: null, token: null });
    await h.login(renewed);
    await h.run(() => gate.reject(httpError(401)));
    assert.equal((await old.result).error.status, 401);
    assert.deepEqual(h.expired, []);
    assert.equal(h.value.error, null);
    assert.equal(h.value.ready, true);
    if (renewed.user.id === 'bob') {
      assert.equal(h.disk.get(alice.pending), original);
      assert.equal(h.value.count, 0);
      await h.login(account('alice', 'renewed-alice'));
    }
    allIdentity(h.calls('addCartItem'), JSON.parse(original).data);
    assert.equal(h.value.count, 2);
    assert.equal(h.effects.length, 1);
  });
}

test('account switch while persisting a mutation journals only the old account and sends nothing', async t => {
  const h = await harness(t);
  await h.mount();
  const gate = h.storage.hold(`setItem:${alice.pending}`);
  const old = await h.start(() => h.value.addItem(product(), 2));
  await gate.entered;
  await h.login(account('bob'));
  await h.run(() => gate.release());
  assert.equal((await old.result).error, undefined);
  assert.equal(h.calls('addCartItem').length, 0);
  assert(h.disk.has(alice.pending));
  assert.equal(h.disk.has(keys('bob').pending), false);
  assert.equal(h.value.count, 0);
  const saved = JSON.parse(h.disk.get(alice.pending));
  await h.login(account('alice'));
  assert.deepEqual(h.calls('addCartItem')[0].body, saved.data);
  assert.equal(h.value.count, 2);
});

test('account switch while persisting migration cannot import into the new account', async t => {
  const h = await harness(t);
  h.disk.set(alice.legacy, legacy());
  const gate = h.storage.hold(`setItem:${alice.migration}`);
  await h.mount();
  await gate.entered;
  await h.login(account('bob'));
  await h.run(() => gate.release());
  assert.equal(h.calls('mergeCart').length, 0);
  assert(h.disk.has(alice.migration));
  assert.equal(h.value.count, 0);
  const saved = JSON.parse(h.disk.get(alice.migration));
  await h.login(account('alice'));
  assert.deepEqual(h.calls('mergeCart')[0].body, saved);
  assert.equal(h.calls('mergeCart')[0].token, 'token-alice');
  assert.equal(h.value.count, 2);
});

test('stale account callbacks cannot mutate or overwrite the new account journal', async t => {
  const h = await harness(t);
  await h.mount();
  const oldAdd = h.value.addItem;
  await h.login(account('bob'));
  const traceLength = h.trace.length;
  await h.run(() => assert.rejects(oldAdd(product()), /qayta kiring/i));
  assert.equal(h.trace.length, traceLength);
  noMutations(h);
  assert.equal(h.disk.has(keys('bob').pending), false);
});

test('returning rapidly to the same account and token still discards the old generation', async t => {
  const h = await harness(t);
  h.carts.set('alice', { items: [item('old-snapshot')], revision: 1 });
  await h.mount();
  const gate = h.api.hold('getCart:response');
  const old = await h.start(() => h.value.refresh());
  await gate.entered;
  const from = h.snapshots.length;
  await h.login(account('bob'));
  await h.login(account('alice'));
  h.carts.set('alice', { items: [item('new-snapshot', 5)], revision: 2 });
  await h.run(() => gate.release());
  assert.equal((await old.result).error, undefined);
  assert.equal(h.value.count, 5);
  for (const snapshot of h.snapshots.slice(from)) {
    assert(snapshot.items.every(entry => entry.listing.id === 'new-snapshot'),
      'owner and token equality alone must not authorize an older generation');
  }
});

test('logout and unmount stop polling and foreground work for the previous account', async t => {
  const h = await harness(t);
  await h.mount();
  await h.login({ user: null, token: null });
  const before = h.trace.length;
  await h.tick();
  await h.foreground();
  assert.equal(h.trace.length, before);
  assert.equal(h.value.count, 0);
  await h.login(account('alice'));
  await h.unmount();
  const afterUnmount = h.trace.length;
  await h.tick();
  await h.foreground();
  assert.equal(h.trace.length, afterUnmount);
});

test('foreground and polling replay the same offline journal without multiplying intent', async t => {
  const h = await harness(t);
  await h.mount();
  h.api.fail('addCartItem', new Error('offline'));
  await h.run(() => assert.rejects(h.value.addItem(product(), 2), /offline/));
  const saved = JSON.parse(h.disk.get(alice.pending));
  h.api.fail('addCartItem', new Error('offline'));
  await h.foreground();
  assert.deepEqual(JSON.parse(h.disk.get(alice.pending)), saved);
  await h.tick();
  allIdentity(h.calls('addCartItem'), saved.data);
  assert.equal(h.value.count, 2);
  assert.equal(h.effects.length, 1);
  assert.equal(h.disk.has(alice.pending), false);
});
