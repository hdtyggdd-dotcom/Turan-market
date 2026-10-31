import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categories } from '../data/store.js';
import { findBestCategory } from './autoCategory.js';

test('food and clothing have unique identifiers and correctly scoped children', () => {
  assert.equal(new Set(categories.map(c => c.id)).size, categories.length);
  const all = categories.flatMap(c => c.subcategories);
  assert.equal(new Set(all.map(s => s.id)).size, all.length);
  for (const id of ['cat20', 'cat21']) {
    const category = categories.find(c => c.id === id)!;
    assert.ok(category.subcategories.length >= 10);
    assert.ok(category.subcategories.every(s => s.categoryId === id && s.name && s.nameRu));
  }
  assert.ok(categories.find(c => c.id === 'cat21')!.subcategories.some(s => s.name === 'Maxsus va ish kiyimlari'));
});

test('historical special-goods alias is not reused for a new category', () => {
  assert.equal(categories.some(c => c.id === 'cat19'), false);
  assert.equal(findBestCategory('Aksiyadagi kiyim'), 'cat18');
  assert.equal(findBestCategory('Shikastlangan kiyim'), 'cat18');
});

test('new retail products can be classified without moving existing listings', () => {
  assert.equal(findBestCategory('Pishloq qatiq'), 'cat20');
  assert.equal(findBestCategory('Ayollar kiyimlari'), 'cat21');
  assert.equal(findBestCategory('спецодежда'), 'cat21');
  assert.equal(findBestCategory('sement armatura'), 'cat2');
});
