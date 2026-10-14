// A single import boundary covers existing screens without rewriting business logic.
module.exports = function ({ types: t }) {
  function eligible(state) {
    const file = (state.filename || '').replace(/\\/g, '/');
    return file.includes('/osavdo-app/') && !/\/(LocalizedPrimitives\.tsx|ui-language\.ts)$/.test(file);
  }
  function helper(path, name, module = '@/services/ui-language') {
    const program = path.findParent(parent => parent.isProgram());
    const key = `cosmis-${name}`;
    let id = program.getData(key);
    if (!id) {
      id = program.scope.generateUidIdentifier(name);
      program.setData(key, id);
      program.unshiftContainer('body', t.importDeclaration(
        [t.importSpecifier(id, t.identifier(name))], t.stringLiteral(module)));
    }
    return t.cloneNode(id);
  }
  return {
    name: 'cosmis-localized-native-copy',
    visitor: {
      ImportDeclaration(path, state) {
        const file = (state.filename || '').replace(/\\/g, '/');
        if (!file.includes('/osavdo-app/') || file.endsWith('/LocalizedPrimitives.tsx') || path.node.importKind === 'type' ||
          path.node.source.value !== 'react-native') return;
        const names = { Text: 'LocalizedText', TextInput: 'LocalizedTextInput', Alert: 'LocalizedAlert' };
        const localized = [];
        path.node.specifiers = path.node.specifiers.filter(specifier => {
          if (!t.isImportSpecifier(specifier) || specifier.importKind === 'type') return true;
          const replacement = names[specifier.imported.name];
          if (!replacement) return true;
          localized.push(t.importSpecifier(specifier.local, t.identifier(replacement)));
          return false;
        });
        if (localized.length) path.insertAfter(t.importDeclaration(localized, t.stringLiteral('@/components/LocalizedPrimitives')));
        if (!path.node.specifiers.length) path.remove();
      },
      JSXOpeningElement(path, state) {
        if (!eligible(state)) return;
        if (!t.isJSXIdentifier(path.node.name, { name: 'Text' })) return;
        const children = path.parentPath.node.children.filter(child =>
          !t.isJSXText(child) || child.value.trim());
        // Exact user-authored values must not accidentally match application copy.
        function isCustomerValue(child) {
          if (!t.isJSXExpressionContainer(child)) return false;
          let customer = false;
          t.traverseFast(child.expression, node => {
            if ((!t.isMemberExpression(node) && !t.isOptionalMemberExpression(node)) ||
              !t.isIdentifier(node.property) ||
              !['title', 'description', 'comment', 'content', 'message', 'name', 'bio'].includes(node.property.name)) return;
            let root = node.object;
            while (t.isMemberExpression(root) || t.isOptionalMemberExpression(root)) root = root.object;
            if (t.isIdentifier(root) && ['listing', 'load', 'purchase', 'user', 'driver', 'review', 'message', 'msg', 'offer', 'r'].includes(root.name)) customer = true;
          });
          return customer;
        }
        const customerValue = children.some(isCustomerValue);
        if (children.length === 1 && customerValue && !path.node.attributes.some(attr => t.isJSXAttribute(attr) && attr.name.name === 'localize')) {
          path.node.attributes.push(t.jsxAttribute(t.jsxIdentifier('localize'), t.jsxExpressionContainer(t.booleanLiteral(false))));
        } else if (customerValue) {
          for (const child of children.filter(isCustomerValue)) {
            const index = path.parentPath.node.children.indexOf(child);
            const id = helper(path, 'UntranslatedCopy', '@/components/LocalizedPrimitives');
            const tag = t.jsxIdentifier(id.name);
            path.parentPath.node.children[index] = t.jsxElement(
              t.jsxOpeningElement(tag, [], false), t.jsxClosingElement(t.cloneNode(tag)), [child], false);
          }
        }
      },
      JSXAttribute(path, state) {
        if (!eligible(state) || path.node.name.name !== 'accessibilityLabel' || !path.node.value) return;
        const expression = t.isStringLiteral(path.node.value) ? path.node.value :
          t.isJSXExpressionContainer(path.node.value) ? path.node.value.expression : null;
        if (!expression) return;
        path.node.value = t.jsxExpressionContainer(t.callExpression(helper(path, 'translateUi'), [expression]));
      },
      CallExpression(path, state) {
        if (!eligible(state) || !t.isMemberExpression(path.node.callee)) return;
        const { object, property } = path.node.callee;
        if (t.isIdentifier(object, { name: 'window' }) &&
          t.isIdentifier(property) && ['confirm', 'alert'].includes(property.name) && path.node.arguments.length) {
          path.node.arguments[0] = t.callExpression(helper(path, 'translateUi'), [path.node.arguments[0]]);
        } else if (t.isIdentifier(property) &&
          ['toLocaleDateString', 'toLocaleString', 'toLocaleTimeString'].includes(property.name)) {
          // Formatting follows interface language, not the device/browser default.
          path.node.arguments[0] = t.callExpression(helper(path, 'getUiLocale'), []);
        }
      },
    },
  };
};
