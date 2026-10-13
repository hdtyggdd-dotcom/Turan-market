import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useGetCountries } from '@workspace/api-client-react';
import { useLocation } from '@/context/LocationContext';
import { useI18n } from '@/context/I18nContext';
import { LANGUAGE_OPTIONS, type LangCode } from '@/constants/i18n';
import { useColors } from '@/hooks/useColors';

export function CountrySetupModal({ visible, onDone }: { visible: boolean; onDone: () => void }) {
  const colors = useColors();
  const { setLocation } = useLocation();
  const { setLang } = useI18n();
  const { data: countries, isLoading, isError, refetch } = useGetCountries();
  const [country, setCountry] = useState<string | null>(null);
  const [language, setLanguage] = useState<LangCode | null>(null);
  const selected = countries?.find(c => c.id === country);

  function continueBrowsing() {
    if (!selected || !language) return;
    setLocation({
      countryId: selected.id, countryName: selected.name, countryFlag: selected.flag,
      currency: selected.currency, regionId: null, regionName: null,
      districtId: null, districtName: null, lat: null, lng: null,
    });
    setLang(language);
    onDone();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Davlat va tilni tanlang</Text>
          <Text style={[styles.help, { color: colors.mutedForeground }]}>
            Mahsulotlarni ko‘rish uchun shu ikki tanlov kifoya. Ism, telefon va joylashuv xarid, e’lon yoki yuk tashish vaqtida so‘raladi.
          </Text>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            <Text style={[styles.label, { color: colors.text }]}>Davlat *</Text>
            {isLoading && <ActivityIndicator color={colors.primary} />}
            {isError && <TouchableOpacity onPress={() => { void refetch(); }}>
              <Text style={{ color: colors.destructive }}>Davlatlar yuklanmadi. Qayta urinish</Text>
            </TouchableOpacity>}
            <View style={styles.grid}>
              {(countries ?? []).map(c => (
                <TouchableOpacity key={c.id} testID={`entry-country-${c.id}`}
                  accessibilityRole="button" accessibilityState={{ selected: country === c.id }}
                  onPress={() => setCountry(c.id)}
                  style={[styles.choice, { borderColor: country === c.id ? colors.primary : colors.border,
                    backgroundColor: country === c.id ? colors.secondary : colors.background }]}>
                  <Text style={{ color: colors.text }}>{c.flag} {c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.label, { color: colors.text }]}>Til / Language *</Text>
            <View style={styles.grid}>
              {LANGUAGE_OPTIONS.map(option => (
                <TouchableOpacity key={option.code} testID={`entry-language-${option.code}`}
                  accessibilityRole="button" accessibilityState={{ selected: language === option.code }}
                  onPress={() => setLanguage(option.code as LangCode)}
                  style={[styles.choice, { borderColor: language === option.code ? colors.primary : colors.border,
                    backgroundColor: language === option.code ? colors.secondary : colors.background }]}>
                  <Text style={{ color: colors.text }}>{option.flag} {option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity testID="entry-continue" accessibilityRole="button"
            disabled={!selected || !language} onPress={continueBrowsing}
            style={[styles.button, { backgroundColor: colors.primary, opacity: selected && language ? 1 : 0.4 }]}>
            <Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }}>Mahsulotlarni ko‘rish</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 },
  card: { maxHeight: '88%', borderWidth: 1, borderRadius: 24, padding: 20, gap: 14 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  help: { fontSize: 13, lineHeight: 20 },
  scroll: { flexShrink: 1 }, content: { gap: 12 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  button: { padding: 16, borderRadius: 14, alignItems: 'center' },
});
