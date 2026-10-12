import assert from 'node:assert/strict';
import test from 'node:test';
import { formatPriceInput, normalizePriceInput } from './price-input';

test('price groups thousands while retaining the original numeric amount', () => {
  for (const [raw, display] of [
    ['', ''], ['0', '0'], ['999', '999'], ['1000', '1 000'],
    ['10000', '10 000'], ['100000', '100 000'], ['1000000', '1 000 000'],
    ['12345678', '12 345 678'], ['10000.50', '10 000.50'], ['10000.', '10 000.'],
  ]) {
    assert.equal(formatPriceInput(raw), display);
    assert.equal(normalizePriceInput(display), raw);
    if (raw !== '') assert.equal(Number(normalizePriceInput(display)), Number(raw));
  }
});

test('pasted grouping, clearing and invalid amounts are handled without changing their meaning', () => {
  assert.equal(normalizePriceInput('100\u00a0000'), '100000');
  assert.equal(normalizePriceInput('1\u202f000\u202f000'), '1000000');
  assert.equal(normalizePriceInput(''), '');
  for (const value of ['-10000', '10000 so‘m', '1.2.3', 'Infinity', '1e5']) {
    assert.equal(normalizePriceInput(value), null);
  }
});
