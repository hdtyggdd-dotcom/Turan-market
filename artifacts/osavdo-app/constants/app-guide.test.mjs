import assert from 'node:assert/strict';
import test from 'node:test';
import { APP_GUIDE, APP_GUIDE_SECTIONS, APP_GUIDE_QUICK_QUESTIONS, getAppGuideReply } from './app-guide.ts';

test('the overview includes all twenty distinct customer-help topics', () => {
  assert.equal(APP_GUIDE_SECTIONS.length, 20);
  assert.equal(new Set(APP_GUIDE_SECTIONS.map(section => section.id)).size, 20);
  for (const section of APP_GUIDE_SECTIONS) {
    assert.ok(APP_GUIDE.includes(section.title));
    assert.ok(section.text.length > 80);
  }
  assert.match(APP_GUIDE, /Cosmis/);
  assert.doesNotMatch(APP_GUIDE, /turanmarket\.net|cosmicmarket\.net/);
});

test('guide questions return public information locally, including normalized aliases', () => {
  for (const question of APP_GUIDE_QUICK_QUESTIONS) {
    assert.ok(getAppGuideReply(question));
  }
  assert.equal(getAppGuideReply('  ILOVA NIMALAR QILA OLADI?!  '), APP_GUIDE);
  assert.equal(getAppGuideReply('Barcha funksiyalar'), APP_GUIDE);
  assert.equal(getAppGuideReply('To\'lov va xavfsizlik'), getAppGuideReply('To‘lov va xavfsizlik'));
  assert.equal(getAppGuideReply('Sigirni qanday tez sotaman?'), null);
});

test('translation and two-way rating are explicitly not advertised as ready', () => {
  assert.match(getAppGuideReply('Reyting qanday ishlaydi?'), /to‘liq foydalanuvchi oqimi hali tayyor emas/);
  const translation = getAppGuideReply('Davlatlar va AI tarjima');
  assert.match(translation, /avtomatik tarjima qilmaydi/);
  assert.match(translation, /hali alohida tayyor funksiya emas/);
  for (const country of ['O‘zbekiston', 'Rossiya', 'Xitoy', 'Eron', 'Qozog‘iston', 'Qirg‘iziston', 'Tojikiston', 'Turkmaniston']) {
    assert.ok(translation.includes(country));
  }
});

test('payment, AI actions and location guidance keep existing safety boundaries', () => {
  assert.match(APP_GUIDE, /bank o‘tkazmasini avtomatik tasdiqlamaydi/);
  assert.match(APP_GUIDE, /avtomatik komissiya undirish yoqilmagan/);
  assert.match(APP_GUIDE, /2–20%/);
  assert.match(APP_GUIDE, /AI sizning nomingizdan e’lon joylamaydi/);
  assert.match(APP_GUIDE, /aniq manzillari taklif qabul qilingach/);
  assert.match(APP_GUIDE, /alohida rozilik/);
});
