// Application imports are redirected here by localize-ui.cjs. Keep native imports here untouched.
import React, { forwardRef, useSyncExternalStore } from 'react';
import {
  Text, TextInput, Alert,
  type TextProps, type TextInputProps,
} from 'react-native';
import { getUiLanguage, subscribeUiLanguage, translateUi } from '../services/ui-language';
import type { LangCode } from '../constants/i18n';

export function UntranslatedCopy({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function localizeChildren(children: React.ReactNode, lang: LangCode): React.ReactNode {
  if (typeof children === 'string') return translateUi(children, lang);
  if (!Array.isArray(children)) return children;
  // A complete sentence can reorder placeholders; user-supplied values remain unchanged.
  if (children.every(child => child == null || typeof child === 'string' || typeof child === 'number' || typeof child === 'boolean')) {
    const combined = children.filter(child => child != null && typeof child !== 'boolean').join('');
    const translated = translateUi(combined, lang);
    if (combined !== translated) return translated;
  }
  return children.map(child => typeof child === 'string' ? translateUi(child, lang) : child);
}

export const LocalizedText = forwardRef<Text, TextProps & { localize?: boolean }>(
  function LocalizedText({ children, localize = true, accessibilityLabel, ...props }, ref) {
    const lang = useSyncExternalStore(subscribeUiLanguage, getUiLanguage, getUiLanguage);
    return <Text {...props} ref={ref} style={[{ writingDirection: lang === 'ir' || lang === 'af' ? 'rtl' : 'ltr' }, props.style]}
      accessibilityLabel={accessibilityLabel ? translateUi(accessibilityLabel, lang) : undefined}>
      {localize ? localizeChildren(children, lang) : children}
    </Text>;
  },
);

export const LocalizedTextInput = forwardRef<TextInput, TextInputProps>(
  function LocalizedTextInput({ placeholder, accessibilityLabel, ...props }, ref) {
    const lang = useSyncExternalStore(subscribeUiLanguage, getUiLanguage, getUiLanguage);
    return <TextInput {...props} ref={ref} style={[{ writingDirection: lang === 'ir' || lang === 'af' ? 'rtl' : 'ltr' }, props.style]}
      placeholder={placeholder ? translateUi(placeholder, lang) : placeholder}
      accessibilityLabel={accessibilityLabel ? translateUi(accessibilityLabel, lang) : accessibilityLabel} />;
  },
);

export const LocalizedAlert: typeof Alert = {
  ...Alert,
  alert(title, message, buttons, options) {
    Alert.alert(translateUi(title), message ? translateUi(message) : message,
      buttons?.map(button => ({ ...button, text: button.text ? translateUi(button.text) : button.text })), options);
  },
};
