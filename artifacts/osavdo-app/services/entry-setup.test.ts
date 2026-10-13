import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENTRY_SETUP_VERSION, needsEntrySetup } from './entry-setup';

test('old completion markers cannot hide the updated country/language/GPS screen', () => {
  const saved = JSON.stringify({ countryId: 'uz', regionId: 'r1', districtId: 'd1' });
  assert.equal(needsEntrySetup('1', saved, 'uz'), true);
  assert.equal(needsEntrySetup(null, saved, 'uz'), true);
});
test('a confirmed selection persists without forcing another account login', () => {
  assert.equal(needsEntrySetup(ENTRY_SETUP_VERSION, JSON.stringify({ countryId: 'uz' }), 'en'), false);
});
test('missing or corrupt country/language data reopens setup', () => {
  for (const location of [null, 'null', '{invalid', '{}', '{"countryId":""}']) {
    assert.equal(needsEntrySetup(ENTRY_SETUP_VERSION, location, 'uz'), true);
  }
  for (const language of [null, '', 'invalid']) {
    assert.equal(needsEntrySetup(ENTRY_SETUP_VERSION, '{"countryId":"uz"}', language), true);
  }
});
