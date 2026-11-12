import test from 'node:test';
import assert from 'node:assert/strict';
import { manualPaymentContact, contactTelephone } from './manual-payment';

test('only the buyer and seller see their own opposite order contact', () => {
  const order = { buyerId: 'b', sellerId: 's', buyer: { name: 'Buyer', phone: '+998000000001' }, seller: { name: 'Seller', phone: '+998000000002' } };
  assert.equal(manualPaymentContact(order, 'b'), order.seller);
  assert.equal(manualPaymentContact(order, 's'), order.buyer);
  assert.equal(manualPaymentContact(order, 'outsider'), null);
  assert.equal(manualPaymentContact(order), null);
  assert.equal(manualPaymentContact({ ...order, seller: null }, 'b'), null);
});

test('telephone links accept phone numbers only, never arbitrary URLs or dial commands', () => {
  assert.equal(contactTelephone('+998 (00) 000-00-01'), 'tel:+998000000001');
  for (const phone of [undefined, '', 'https://example.com', 'tel:12345678', '*123#', '+998123;456789', '000']) {
    assert.equal(contactTelephone(phone), null);
  }
});
