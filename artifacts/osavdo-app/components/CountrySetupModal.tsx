import React, { useState, useRef, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import * as ExpoLocation from 'expo-location';
import { useGetCountries, useDetectLocation } from '@workspace/api-client-react';
import { useLocation } from '@/context/LocationContext';
import { useI18n } from '@/context/I18nContext';
import { LANGUAGE_OPTIONS, type LangCode } from '@/constants/i18n';
import { useColors } from '@/hooks/useColors';

export function CountrySetupModal({ visible, onDone }: { visible: boolean; onDone: () => void | Promise<void> }) {
  const colors = useColors();
  const { setLocation, countryId: savedCountryId } = useLocation();
  const { setLang } = useI18n();
  const { data: countries, isLoading, isError, refetch } = useGetCountries();
  const [country, setCountry] = useState<string | null>(null);
  const [language, setLanguage] = useState<LangCode | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const request = useRef(0);
  const { mutateAsync: detectLocation } = useDetectLocation();
  useEffect(() => () => { request.current++; }, []);
  const selected = countries?.find(c => c.id === country);

  function chooseCountry(id: string) {
    request.current++;
    setBusy(false);
    setNotice('');
    setCountry(id);
  }

  async function detectCountry() {
    const id = ++request.current;
    setBusy(true);
    setNotice('');
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const locate = async () => {
        let coords: { latitude: number; longitude: number };
        if (Platform.OS === 'web') {
          coords = await new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
            if (typeof navigator === 'undefined' || !navigator.geolocation) {
              reject(new Error('GPS_UNAVAILABLE')); return;
            }
            navigator.geolocation.getCurrentPosition(
              position => resolve(position.coords),
              error => reject(new Error(error.code === 1 ? 'GPS_PERMISSION_DENIED' : 'GPS_UNAVAILABLE')),
              { timeout: 15000, maximumAge: 60000, enableHighAccuracy: false },
            );
          });
        } else {
          const permission = await ExpoLocation.requestForegroundPermissionsAsync();
          if (!permission.granted) throw new Error('GPS_PERMISSION_DENIED');
          if (request.current !== id) return null;
          coords = (await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced })).coords;
        }
        if (request.current !== id) return null;
        return detectLocation({ data: { lat: coords.latitude, lng: coords.longitude } });
      };
      const detected = await Promise.race([
        locate(),
        new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('GPS_TIMEOUT')), 20000); }),
      ]);
      if (request.current !== id || !detected) return;
      const match = countries?.find(c => c.id === detected.countryId);
      if (!match) throw new Error('GPS_UNSUPPORTED_COUNTRY');
      setCountry(match.id);
      setNotice(`GPS orqali: ${match.name}. Davlatni tekshiring va tilni tanlang.`);
    } catch (error) {
      if (request.current !== id) return;
      setNotice(error instanceof Error && error.message === 'GPS_PERMISSION_DENIED'
        ? 'GPS ruxsati berilmadi. Davlatni quyida qo‘lda tanlang.'
        : 'GPS orqali davlat aniqlanmadi. Davlatni qo‘lda tanlang yoki qayta urining.');
    } finally {
      if (timer) clearTimeout(timer);
      if (request.current === id) {
        request.current++; // Ignore late fixes after timeout.
        setBusy(false);
      }
    }
  }

  async function continueBrowsing() {
    if (!selected || !language || saving || busy) return;
    request.current++;
    setSaving(true);
    setNotice('');
    try {
    setLocation({
      countryId: selected.id, countryName: selected.name, countryFlag: selected.flag,
      currency: selected.currency,
      ...(savedCountryId !== selected.id ? { regionId: null, regionName: null,
        districtId: null, districtName: null, lat: null, lng: null } : {}),
    });
    setLang(language);
    await onDone();
    } catch {
      setNotice('Tanlov saqlanmadi. Qayta urinib ko‘ring.');
    } finally { setSaving(false); }
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
            <TouchableOpacity testID="entry-gps" accessibilityRole="button"
              disabled={busy || saving || !countries?.length} onPress={() => { void detectCountry(); }}
              style={[styles.choice, { borderColor: colors.primary, opacity: busy || !countries?.length ? 0.5 : 1 }]}>
              {busy ? <ActivityIndicator color={colors.primary} /> :
                <Text style={{ color: colors.text }}>GPS orqali davlatni aniqlash</Text>}
            </TouchableOpacity>
            <Text style={[styles.help, { color: colors.mutedForeground }]}>
              GPS ixtiyoriy. Ruxsat faqat tugmani bossangiz so‘raladi. Yoki davlatni qo‘lda tanlang.
            </Text>
            {!!notice && <Text accessibilityLiveRegion="polite" style={{ color: colors.text }}>{notice}</Text>}
            {isLoading && <ActivityIndicator color={colors.primary} />}
            {isError && <TouchableOpacity onPress={() => { void refetch(); }}>
              <Text style={{ color: colors.destructive }}>Davlatlar yuklanmadi. Qayta urinish</Text>
            </TouchableOpacity>}
            <View style={styles.grid}>
              {(countries ?? []).map(c => (
                <TouchableOpacity key={c.id} testID={`entry-country-${c.id}`}
                  accessibilityRole="button" accessibilityState={{ selected: country === c.id }}
                  disabled={saving} onPress={() => chooseCountry(c.id)}
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
                  disabled={saving} onPress={() => { setLanguage(option.code as LangCode); setLang(option.code); }}
                  style={[styles.choice, { borderColor: language === option.code ? colors.primary : colors.border,
                    backgroundColor: language === option.code ? colors.secondary : colors.background }]}>
                  <Text style={{ color: colors.text }}>{option.flag} {option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity testID="entry-continue" accessibilityRole="button"
            disabled={!selected || !language || busy || saving} onPress={() => { void continueBrowsing(); }}
            style={[styles.button, { backgroundColor: colors.primary, opacity: selected && language && !busy && !saving ? 1 : 0.4 }]}>
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
