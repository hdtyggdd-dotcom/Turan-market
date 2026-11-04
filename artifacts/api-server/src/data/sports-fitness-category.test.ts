import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categories } from '../data/store.js';
import { registerSportsFitnessCategory } from '../data/sports-fitness-category.js';

test('sports and fitness category has unique identifiers and correctly scoped subcategories', () => {
  registerSportsFitnessCategory();
  const category = categories.find((item) => item.id === 'cat22');
  assert.ok(category);
  assert.ok(category.subcategories.length >= 15);
  assert.ok(category.subcategories.every((subcategory) =>
    subcategory.categoryId === category.id && subcategory.name.length > 0 && subcategory.nameRu.length > 0,
  ));
  assert.equal(new Set(categories.map((item) => item.id)).size, categories.length);
  const allSubcategories = categories.flatMap((item) => item.subcategories);
  assert.equal(new Set(allSubcategories.map((item) => item.id)).size, allSubcategories.length);
});

test('sports category registration is idempotent', () => {
  registerSportsFitnessCategory();
  registerSportsFitnessCategory();
  assert.equal(categories.filter((item) => item.id === 'cat22').length, 1);
});
