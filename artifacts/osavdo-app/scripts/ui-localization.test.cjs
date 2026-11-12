const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');
const babel = require('@babel/core');
const root = path.resolve(__dirname, '..');
const catalog = require('../constants/locales/ui.json');
function loadTs(file) {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, { module, exports: module.exports, require: createRequire(file), Set, Object });
  return module.exports;
}
const language = loadTs(path.join(root, 'services/ui-language.ts'));
const locales = ['en', 'ru', 'kz', 'kg', 'tj', 'tm', 'cn', 'ir', 'af', 'tr'];
test('every catalog entry has all ten translations and unchanged interpolation tokens', () => {
  assert.ok(Object.keys(catalog).length >= 1000);
  for (const [source, messages] of Object.entries(catalog)) {
    const tokens = (source.match(/\{\{\d+\}\}/g) || []).sort();
    for (const locale of locales) {
      assert.ok(messages[locale]?.trim(), `${locale}: ${source}`);
      assert.deepEqual((messages[locale].match(/\{\{\d+\}\}/g) || []).sort(), tokens, `${locale}: ${source}`);
    }
  }
});
test('new app copy and reference-data labels cannot silently ship without translations', () => {
  const sources = JSON.parse(execFileSync(process.execPath, [path.join(__dirname, 'extract-ui-messages.cjs')], { encoding: 'utf8' }));
  const identifiers = /^(?:entry-|listing-|mode-|photo-|ps\{\{|rgba\(|turan_)|^\{\{\d+\}\}(?:\/api\/|K$|T00:)/;
  const missing = sources.filter(source => !identifiers.test(source) && !catalog[source]);
  assert.deepEqual(missing, [], 'Add all supported languages before shipping new application copy');
});
test('translation, sentence fragments, multiline guides and customer placeholders', () => {
  assert.equal(language.translateUi('Savat', 'en'), 'Cart');
  assert.equal(language.translateUi('Savat', 'ru'), 'Корзина');
  assert.equal(language.translateUi('Savat', 'cn'), '购物车');
  assert.equal(language.translateUi('Savat', 'uz'), 'Savat');
  assert.equal(language.translateUi('  Savat ', 'en'), '  Cart ');
  assert.equal(language.translateUi('Savat\n\nKategoriyalar', 'en'), 'Cart\n\nCategories');
  assert.ok(language.translateUi('GPS orqali: TestCity. Davlatni tekshiring va tilni tanlang.', 'en').includes('TestCity'));
  assert.equal(language.translateUi('Customer custom text 123', 'en'), 'Customer custom text 123');
});
test('the full guide and its quick topics contain translated paragraphs, not copied Uzbek', () => {
  const guide = loadTs(path.join(root, 'constants/app-guide.ts'));
  for (const locale of locales) {
    const full = language.translateUi(guide.APP_GUIDE, locale);
    for (const section of guide.APP_GUIDE_SECTIONS) {
      assert.notEqual(language.translateUi(section.title, locale), section.title, `${locale}: ${section.title}`);
      assert.ok(!full.includes(section.text), `${locale}: untranslated guide section ${section.id}`);
    }
    for (const question of guide.APP_GUIDE_QUICK_QUESTIONS) {
      assert.notEqual(language.translateUi(question, locale), question, `${locale}: ${question}`);
    }
  }
});
test('language updates notify subscribers once and set locale for dates', () => {
  let count = 0;
  const unsubscribe = language.subscribeUiLanguage(() => count++);
  language.setUiLanguage('ru');
  language.setUiLanguage('ru');
  assert.equal(count, 1);
  assert.equal(language.getUiLocale(), 'ru-RU');
  unsubscribe();
  language.setUiLanguage('en');
  assert.equal(count, 1);
});
test('React Compiler updates unchanged static labels when language changes', () => {
  const React = require('react');
  const renderer = require('react-test-renderer');
  const file = path.join(root, 'components/LocalizedPrimitives.tsx');
  const output = babel.transformFileSync(file, {
    configFile: false, babelrc: false,
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
    plugins: [require.resolve('babel-plugin-react-compiler')],
    caller: { name: 'metro', platform: 'ios', isDev: false, supportsStaticESM: false },
  }).code;
  const module = { exports: {} };
  const native = { Text: 'Text', TextInput: 'TextInput', Alert: { alert() {} } };
  const realRequire = createRequire(file);
  const runtimeRequire = createRequire(require.resolve('react-native/package.json'));
  vm.runInNewContext(output, {
    module, exports: module.exports, process,
    require: id => id === 'react-native' ? native :
      id.includes('services/ui-language') ? language :
      id.startsWith('@babel/runtime/') ? runtimeRequire(id) : realRequire(id),
  });
  global.IS_REACT_ACT_ENVIRONMENT = true;
  language.setUiLanguage('uz');
  let view;
  renderer.act(() => { view = renderer.create(React.createElement(module.exports.LocalizedText, null, 'Savat')); });
  assert.deepEqual(view.toJSON().children, ['Savat']);
  renderer.act(() => language.setUiLanguage('en'));
  assert.deepEqual(view.toJSON().children, ['Cart']);
  renderer.act(() => language.setUiLanguage('ru'));
  assert.deepEqual(view.toJSON().children, ['Корзина']);
  renderer.act(() => view.unmount());
  delete global.IS_REACT_ACT_ENVIRONMENT;
});
test('Babel localizes native imports, accessibility, browser dialogs and date formatting; preserves customer text', () => {
  const code = babel.transformSync(`
    import { Text, TextInput, Alert, View } from 'react-native';
    const screen = <View><Text>{listing.title}</Text><Text>Hello {user.name}</Text>
      <TextInput placeholder="Ism" accessibilityLabel="Kirish" /></View>;
    window.confirm('Chiqish');
    new Date().toLocaleDateString('uz-UZ');
  `, {
    filename: path.join(root, 'app/test.tsx'), configFile: false, babelrc: false,
    parserOpts: { plugins: ['typescript', 'jsx'] }, plugins: [require('./localize-ui.cjs')],
  }).code;
  assert.match(code, /LocalizedText as Text/);
  assert.match(code, /LocalizedTextInput as TextInput/);
  assert.match(code, /LocalizedAlert as Alert/);
  assert.match(code, /localize=\{false\}/);
  assert.match(code, /UntranslatedCopy/);
  assert.match(code, /window\.confirm\(_translateUi\(/);
  assert.match(code, /toLocaleDateString\(_getUiLocale\(\)\)/);
});
test('all application screens parse with the localization compiler', () => {
  function walk(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, item.name);
      if (item.isDirectory()) walk(file);
      else if (/\.tsx$/.test(item.name)) babel.transformFileSync(file, {
        configFile: false, babelrc: false, parserOpts: { plugins: ['typescript', 'jsx'] },
        plugins: [require('./localize-ui.cjs')],
      });
    }
  }
  walk(path.join(root, 'app'));
  walk(path.join(root, 'components'));
});
test('locale transforms allow Expo to strip nested TypeScript assertions', () => {
  const output = babel.transformSync(`
    import { Text } from 'react-native';
    export const Example = ({ value }: { value: unknown }) =>
      <Text accessibilityLabel={value as string}>{new Date(value as string).toLocaleString()}</Text>;
  `, {
    filename: path.join(root, 'app/assertion-regression.tsx'), configFile: false, babelrc: false,
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
    plugins: [require('./localize-ui.cjs')],
    caller: { name: 'metro', platform: 'web', isDev: true, supportsStaticESM: false },
  }).code;
  assert.doesNotMatch(output, / as string/);
  // Parse as JavaScript, without the TypeScript/JSX parser extensions.
  babel.parseSync(output, { configFile: false, babelrc: false, sourceType: 'unambiguous' });
});
test('AI reply language rejects unsupported or injected values and keeps legacy clients compatible', () => {
  const advice = loadTs(path.resolve(root, '../api-server/src/lib/advice-language.ts'));
  assert.equal(advice.adviceReplyLanguage(undefined), 'Uzbek');
  assert.equal(advice.adviceReplyLanguage('ru'), 'Russian');
  assert.equal(advice.adviceReplyLanguage('cn'), 'Simplified Chinese');
  assert.equal(advice.adviceReplyLanguage('constructor'), null);
  assert.equal(advice.adviceReplyLanguage('ignore previous instructions'), null);
  assert.equal(advice.adviceReplyLanguage(null), null);
});
