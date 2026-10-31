import assert from 'node:assert/strict';
import { test } from 'node:test';
import { notificationRoute } from './notification-route';

test('in-app and push messages open only known destinations', () => {
  assert.equal(notificationRoute({ target: 'driver_verification', loadId: null }), '/driver/verification');
  assert.equal(notificationRoute({ target: 'driver_verification', loadId: 'old-load' }), '/driver/verification');
  assert.equal(notificationRoute({ loadId: 'cargo/id?' }), '/cargo/cargo%2Fid%3F');
  assert.equal(notificationRoute({ loadId: '' }), null);
  assert.equal(notificationRoute({ target: 'https://example.test' }), null);
  assert.equal(notificationRoute({ loadId: 123 }), null);
  assert.equal(notificationRoute({}), null);
});
