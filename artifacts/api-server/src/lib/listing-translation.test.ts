import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import { appRecords, db, pool, adviceCoordinationPool } from '@workspace/db';
import { persistRecord } from './persistence.js';
import { createListingTranslator, decodeTranslation, maskListingText, translationKey,
  listingTranslationCache, deleteListingWithTranslations, TRANSLATION_COLLECTION } from './listing-translation.js';

const ids: string[] = [];
after(async () => {
  for (const id of ids) await deleteListingWithTranslations(id);
  await pool.end();
  await adviceCoordinationPool.end();
});
async function fixture(title = 'Olma 10 kg', description = 'Narx 100 000. +998 90 123 45 67') {
  const source = { id: `translation-test-${randomUUID()}`, title, description };
  ids.push(source.id);
  await persistRecord('listings', source.id, { ...source, status: 'active', userId: 'translation-test' });
  return source;
}
function generator() {
  let calls = 0;
  return {
    count: () => calls,
    async generate(prompt: string) {
      calls++;
      return JSON.stringify({ items: JSON.parse(prompt).map((item: { id: string; title: string; description: string }) =>
        ({ ...item, title: 'Translated ' + item.title, translated: true })) });
    },
  };
}
test('number/contact placeholders survive translation and cannot be changed or invented', () => {
  const source = { id: 'x', title: 'iPhone 13', description: '100 000 UZS. +998901234567 test@example.com https://example.com/a' };
  const masked = maskListingText(source);
  assert.ok(!masked.description.includes('998901234567'));
  assert.ok(!masked.description.includes('test@example.com'));
  assert.doesNotThrow(() => decodeTranslation({ ...masked, title: masked.title, translated: true }, masked));
  assert.throws(() => decodeTranslation({ title: 'iPhone 14', description: masked.description, translated: true }, masked));
  assert.throws(() => decodeTranslation({ title: masked.title, description: '', translated: true }, masked));
  assert.throws(() => decodeTranslation({ title: 'changed', description: '', translated: false },
    maskListingText({ id: 'x', title: 'original' })));
});
test('one budgeted batch is cached durably; language and edited content have different identities', async () => {
  const first = await fixture();
  const second = await fixture('Nok', '');
  const fake = generator();
  let reservations = 0;
  const translate = createListingTranslator({ cache: listingTranslationCache, enabled: () => true,
    reserve: async () => { reservations++; }, generate: fake.generate });
  const result = await translate([first, second], 'en');
  assert.equal(result[0]?.status, 'ready');
  assert.equal(result[0]?.description, first.description);
  assert.equal(result[0]?.sourceTitle, first.title);
  assert.equal(result[1]?.description, '');
  const cached = await translate([first, second], 'en');
  assert.deepEqual(cached, result);
  assert.equal(fake.count(), 1);
  assert.equal(reservations, 1);
  assert.notEqual(translationKey(first, 'en'), translationKey(first, 'ru'));
  assert.notEqual(translationKey(first, 'en'), translationKey({ ...first, title: 'Changed' }, 'en'));
});
test('concurrent public readers share a durable lease and failures cannot cause retry storms', async () => {
  const source = await fixture();
  let calls = 0;
  const translate = createListingTranslator({ cache: listingTranslationCache, enabled: () => true,
    reserve: async () => {}, generate: async () => {
      calls++; await new Promise(resolve => setTimeout(resolve, 30)); throw new Error('uncertain failure');
    } });
  const results = await Promise.all([translate([source], 'ru'), translate([source], 'ru')]);
  assert.equal(calls, 1);
  assert.ok(results.every(rows => rows[0]?.status === 'unavailable'));
  await translate([source], 'ru');
  assert.equal(calls, 1);
});
test('budget refusal makes no provider call and explicitly returns original content', async () => {
  const source = await fixture();
  let calls = 0;
  const translate = createListingTranslator({ cache: listingTranslationCache, enabled: () => true,
    reserve: async () => { throw new Error('limit'); }, generate: async () => { calls++; return ''; } });
  const [result] = await translate([source], 'cn');
  assert.equal(result?.status, 'unavailable');
  assert.equal(result?.title, source.title);
  assert.equal(calls, 0);
});
test('deleting a listing erases translations and a late response cannot recreate them', async () => {
  const source = await fixture();
  const key = translationKey(source, 'en');
  const lease = await listingTranslationCache.claim(key, source.id);
  assert.equal(lease.state, 'owned');
  if (lease.state !== 'owned') throw new Error('No lease');
  await deleteListingWithTranslations(source.id);
  await listingTranslationCache.finish(key, lease.token, { title: 'Deleted title', description: '', translated: true });
  const rows = await db.select().from(appRecords).where(and(eq(appRecords.collection, TRANSLATION_COLLECTION),
    sql`${appRecords.payload}->>'listingId' = ${source.id}`));
  assert.equal(rows.length, 0);
  assert.equal((await listingTranslationCache.claim(key, source.id)).state, 'busy');
});
