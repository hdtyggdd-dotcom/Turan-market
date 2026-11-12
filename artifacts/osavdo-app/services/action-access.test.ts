import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasActionIdentity, hasActionLocation, safeActionReturn } from './action-access';
import type { UserProfile } from '@/context/AuthContext';

const profile = (fields: Partial<UserProfile>) => fields as UserProfile;
test('guest browsing never creates a pretend account identity', () => {
  assert.equal(hasActionIdentity(null), false);
  assert.equal(hasActionLocation(null), false);
  assert.equal(hasActionIdentity(profile({ name: ' ', phone: '+998991234567' })), false);
  assert.equal(hasActionIdentity(profile({ name: 'Test', phone: '' })), false);
});
test('transactions require actual identity and both location identifiers', () => {
  const user = profile({ name: 'Test', phone: '+998991234567', regionId: 'region', districtId: 'district' });
  assert.equal(hasActionIdentity(user), true);
  assert.equal(hasActionLocation(user), true);
  assert.equal(hasActionLocation({ ...user, districtId: null }), false);
  assert.equal(hasActionLocation({ ...user, regionId: null }), false);
});
test('return navigation keeps supported transaction destinations only', () => {
  for (const route of ['/listing/item-1', '/cargo/load-2', '/(tabs)/cart', '/(tabs)/create', '/(tabs)/profile']) {
    assert.equal(safeActionReturn(route), route);
  }
  assert.equal(safeActionReturn('/cargo/create?orderId=order_123'), '/cargo/create?orderId=order_123');
  assert.equal(safeActionReturn('/listing/item-1?redirect=https://other.test'), '/listing/item-1');
});
test('untrusted return URLs cannot leave the app or enter administrative routes', () => {
  for (const route of [undefined, ['multiple'], 'https://other.test', '//other.test', 'javascript:alert(1)',
    '/admin/ai-budget', '/auth/complete', '/listing/../admin', '/listing/%2f%2fother.test']) {
    assert.equal(safeActionReturn(route), '/(tabs)');
  }
  assert.equal(safeActionReturn('/cargo/create?orderId=https://other.test'), '/cargo/create');
});
