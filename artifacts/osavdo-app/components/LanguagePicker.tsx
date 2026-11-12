import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LANGUAGE_OPTIONS } from '../constants/i18n';
import { useI18n } from '../context/I18nContext';
import { useColors } from '../hooks/useColors';

export function LanguagePicker() {
  const colors = useColors();
  const { lang, setLang } = useI18n();
  return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold' }}>🌐 Til:</Text>
    <View style={styles.options}>
      {LANGUAGE_OPTIONS.map(option => <TouchableOpacity key={option.code}
        testID={`language-switch-${option.code}`} accessibilityRole="button"
        accessibilityState={{ selected: option.code === lang }} onPress={() => setLang(option.code)}
        style={[styles.option, { borderColor: lang === option.code ? colors.primary : colors.border,
          backgroundColor: lang === option.code ? colors.secondary : colors.background }]}>
        <Text style={{ color: colors.text }}>{option.flag} {option.label}</Text>
      </TouchableOpacity>)}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { borderWidth: 1, borderRadius: 12, padding: 10 },
});
