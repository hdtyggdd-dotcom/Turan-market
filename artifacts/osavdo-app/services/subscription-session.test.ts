import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertSandboxKey, createSubscriptionQueue } from './subscription-session';

test('sandbox never accepts live credentials or implicit activation', () => {
  assert.doesNotThrow(() => assertSandboxKey('test', 'test_public'));
  for (const [mode, key] of [[undefined, undefined], ['live', 'test_public'], ['test', 'goog_public'], ['test', 'appl_public'], ['test', '']]) {
    assert.throws(() => assertSandboxKey(mode, key));
  }
});
test('SDK identity operations remain serialized', async () => {
  const queue = createSubscriptionQueue();
  let finish!: () => void;
  const order: string[] = [];
  const first = queue(() => true, async () => {
    order.push('first-start');
    await new Promise<void>((resolve) => { finish = resolve; });
    order.push('first-end');
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  const second = queue(() => true, async () => { order.push('second'); });
  assert.deepEqual(order, ['first-start']);
  finish();
  await Promise.all([first, second]);
  assert.deepEqual(order, ['first-start', 'first-end', 'second']);
});
test('a queued operation from a departed owner cannot run and does not block the new owner', async () => {
  const queue = createSubscriptionQueue();
  let owner = 'old';
  let called = false;
  const stale = queue(() => owner === 'old', async () => { called = true; });
  owner = 'new';
  await assert.rejects(stale, /Akkaunt/);
  assert.equal(called, false);
  assert.equal(await queue(() => owner === 'new', async () => 'new-owner-only'), 'new-owner-only');
});
