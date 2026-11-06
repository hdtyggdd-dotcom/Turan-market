// Generate the source catalog from application code, never from customer data.
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const messages = new Set();
const normalize = value => value.replace(/\s+/g, ' ').trim();
function visitFile(file) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  function visit(node) {
    if (ts.isJsxText(node) || ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const value = normalize(node.text);
      // Human-facing text, excluding paths, identifiers, colours and font names.
      if (value.length > 1 && /[A-Za-zА-Яа-я\u0400-\u04ff]/u.test(value) &&
        !/^(https?:|\/|@|#|Inter_|osavdo_|EXPO_|GPS_|ERR_|[a-z][a-z0-9]*(?:[-_.:/][a-z0-9]+)+$)/.test(value) &&
        (/\s/.test(value) || /^[A-ZА-Я]/u.test(value) || /[‘’ʻʼ']/.test(value)) &&
        value.length < 7000) messages.add(value);
    }
    if (ts.isTemplateExpression(node)) {
      const template = normalize(node.head.text + node.templateSpans.map((span, i) => `{{${i}}}` + span.literal.text).join(''));
      if (/[A-Za-zА-Яа-я]/u.test(template.replace(/\{\{\d+\}\}/g, '')) &&
        !/^(https?:|\/|@|Inter_|osavdo_|GPS_)/.test(template)) messages.add(template);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(tsx?|jsx?)$/.test(entry.name) && !/\.(test|spec)\./.test(entry.name) &&
      entry.name !== 'i18n.ts') visitFile(file);
  }
}
for (const folder of ['app', 'components', 'hooks', 'constants', 'context', 'services']) walk(path.join(root, folder));
// Only public reference-data labels from source code; never export records or user data.
const dataFile = path.resolve(root, '../api-server/src/data/store.ts');
const data = ts.createSourceFile(dataFile, fs.readFileSync(dataFile, 'utf8'), ts.ScriptTarget.Latest, true);
function collectNames(node) {
  if (ts.isPropertyAssignment(node) && node.name.getText(data) === 'name' && ts.isStringLiteral(node.initializer)) {
    messages.add(normalize(node.initializer.text));
  }
  ts.forEachChild(node, collectNames);
}
function visitData(node) {
  if (ts.isVariableDeclaration(node) && ['countries', 'categories', 'vehicleTypes'].includes(node.name.getText(data))) {
    if (node.initializer) collectNames(node.initializer);
    return;
  }
  if (ts.isCallExpression(node) && node.expression.getText(data) === 'categories.push') {
    node.arguments.forEach(collectNames);
    return;
  }
  ts.forEachChild(node, visitData);
}
visitData(data);
console.log(JSON.stringify([...messages].sort(), null, 2));
