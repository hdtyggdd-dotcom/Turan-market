/**
 * CountrySetupModal
 * Birinchi ishga tushganda GPS orqali mamlakatni avtomatik aniqlab beradi.
 * Mamlakatni tanlagandan so'ng til avtomatik o'zgaradi.
 */
import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  ActivityIndicator, StyleSheet, Platform,
} from 'react-native';
import * as ExpoLocation from 'expo-location';
import { useDetectLocation, useGetCountries } from '@workspace/api-client-react';
import { useLocation } from '@/context/LocationContext';
import { useI18n } from '@/context/I18nContext';
import { useColors } from '@/hooks/useColors';

interface Props {
  visible: boolean;
  onDone: () => void;
}

type Step = 'idle' | 'requesting' | 'detecting' | 'confirm' | 'pick' | 'error';

interface Detected {
  countryId: string; countryName: string; countryFlag: string;
  currency: string; dialCode: string;
  regionId: string; regionName: string; distanceKm: number;
}

export function CountrySetupModal({ visible, onDone }: Props) {
  const colors = useColors();
  const { setLocation } = useLocation();
  const { t, setLangByCountry } = useI18n();
  const [step, setStep] = useState<Step>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [detected, setDetected] = useState<Detected | null>(null);

  const { data: allCountries } = useGetCountries();

  const detectMutation = useDetectLocation({
    mutation: {
      onSuccess: (data) => {
        setDetected(data as Detected);
        setStep('confirm');
      },
      onError: () => {
        setStep('error');
        setErrorMsg('Joylashuv aniqlanmadi. Davlatni qo\'lda tanlang.');
      },
    },
  });

  async function handleDetect() {
    setStep('requesting');
    setErrorMsg('');
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setStep('error');
        setErrorMsg(t('locationPermissionDenied'));
        return;
      }
      setStep('detecting');
      const pos = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });
      detectMutation.mutate({
        data: { lat: pos.coords.latitude, lng: pos.coords.longitude },
      });
    } catch {
      setStep('error');
      setErrorMsg('GPS xatosi yuz berdi.');
    }
  }

  function applyCountry(c: { id: string; name: string; flag: string; currency: string; dialCode: string }, regionId?: string, regionName?: string) {
    setLocation({
      countryId: c.id,
      countryName: c.name,
      countryFlag: c.flag,
      currency: c.currency,
      regionId: regionId ?? null,
      regionName: regionName ?? null,
    });
    setLangByCountry(c.id);
    onDone();
  }

  function handleConfirm() {
    if (!detected) return;
    applyCountry(
      { id: detected.countryId, name: detected.countryName, flag: detected.countryFlag, currency: detected.currency, dialCode: detected.dialCode },
      detected.regionId, detected.regionName,
    );
  }

  function handlePickCountry(c: { id: string; name: string; flag: string; currency: string; dialCode: string }) {
    applyCountry(c);
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>

          <Text style={styles.emoji}>🌍</Text>
          <Text style={[styles.title, { color: colors.text }]}>{t('selectCountry')}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            AI GPS orqali siz turgan davlat va shaharni avtomatik topadi
          </Text>

          {/* IDLE / ERROR */}
          {(step === 'idle' || step === 'error') && (
            <>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                onPress={handleDetect}
              >
                <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                  📍 {t('detectLocation')}
                </Text>
              </TouchableOpacity>

              {step === 'error' && (
                <View style={[styles.errorBox, { backgroundColor: '#ef444415', borderColor: '#ef4444' }]}>
                  <Text style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>{errorMsg}</Text>
                </View>
              )}

              <TouchableOpacity onPress={() => setStep('pick')} style={{ marginTop: 14 }}>
                <Text style={[styles.skipText, { color: colors.primary }]}>
                  🌐 Davlatni qo'lda tanlash
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => applyCountry({ id: 'uz', name: "O'zbekiston", flag: '🇺🇿', currency: 'UZS', dialCode: '+998' })}>
                <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
                  {t('skipUz')}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* LOADING */}
          {(step === 'requesting' || step === 'detecting') && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                {step === 'requesting' ? 'GPS ruxsati so\'ralyapti…' : t('detecting')}
              </Text>
            </View>
          )}

          {/* CONFIRM detected */}
          {step === 'confirm' && detected && (
            <View style={styles.confirmBox}>
              <Text style={styles.detectedFlag}>{detected.countryFlag}</Text>
              <Text style={[styles.detectedCountry, { color: colors.text }]}>{detected.countryName}</Text>
              <Text style={[styles.detectedRegion, { color: colors.mutedForeground }]}>
                📍 {detected.regionName}  (~{detected.distanceKm} km)
              </Text>
              <Text style={[styles.detectedMeta, { color: colors.mutedForeground }]}>
                💱 {detected.currency}  ·  📞 {detected.dialCode}
              </Text>

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 20, width: '100%' }]}
                onPress={handleConfirm}
              >
                <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                  ✅ {t('correctLocation')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep('idle')} style={{ marginTop: 12 }}>
                <Text style={[styles.skipText, { color: colors.mutedForeground }]}>{t('reDetect')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* MANUAL PICK */}
          {step === 'pick' && (
            <View style={{ width: '100%', marginTop: 8 }}>
              {(allCountries ?? []).map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.countryRow, { borderBottomColor: colors.border }]}
                  onPress={() => handlePickCountry(c as { id: string; name: string; flag: string; currency: string; dialCode: string })}
                >
                  <Text style={styles.countryFlag}>{c.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.countryName, { color: colors.text }]}>{c.name}</Text>
                    <Text style={[styles.countryMeta, { color: colors.mutedForeground }]}>
                      {c.dialCode} · {c.currency}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setStep('idle')} style={{ marginTop: 12, alignItems: 'center' }}>
                <Text style={[styles.skipText, { color: colors.mutedForeground }]}>← Orqaga</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  card: {
    width: '100%', maxWidth: 390, borderRadius: 20, borderWidth: 1,
    padding: 24, alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 8 },
    }),
  },
  emoji: { fontSize: 44, marginBottom: 6 },
  title: { fontSize: 19, fontFamily: 'Inter_700Bold', marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 19, marginBottom: 20 },
  primaryBtn: { width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  skipText: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 10, textDecorationLine: 'underline', textAlign: 'center' },
  loadingBox: { alignItems: 'center', paddingVertical: 20, gap: 14 },
  loadingText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  confirmBox: { alignItems: 'center', width: '100%' },
  detectedFlag: { fontSize: 52, marginBottom: 6 },
  detectedCountry: { fontSize: 21, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  detectedRegion: { fontSize: 14, fontFamily: 'Inter_500Medium', marginBottom: 4 },
  detectedMeta: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  errorBox: { width: '100%', borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 12 },
  countryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, width: '100%',
  },
  countryFlag: { fontSize: 28 },
  countryName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  countryMeta: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});
