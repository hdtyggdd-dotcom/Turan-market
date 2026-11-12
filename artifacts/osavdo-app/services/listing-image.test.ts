import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveListingImageUrl } from './listing-image';

test('own images use the current API host, not a saved preview or old domain', () => {
  const base = 'https://market.example/';
  for (const value of ['/api/images/img_123_1', 'api/images/img_123_1', 'https://old.example/api/images/img_123_1']) {
    assert.equal(resolveListingImageUrl(value, base), 'https://market.example/api/images/img_123_1');
  }
});

test('external image URLs remain intact; invalid and non-image protocols are rejected', () => {
  assert.equal(resolveListingImageUrl('https://photos.example/photo.jpg?size=large', 'https://market.example'), 'https://photos.example/photo.jpg?size=large');
  for (const value of ['', 'javascript:alert(1)', 'file:///private.jpg', '/unknown-path']) {
    assert.equal(resolveListingImageUrl(value, 'https://market.example'), null);
  }
});
