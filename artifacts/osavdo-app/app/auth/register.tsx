import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Platform, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useRegister, useGetRegions, useGetDistricts, useGetCountries } from '@workspace/api-client-react';
import { useAuth, type UserProfile } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { useI18n } from '@/context/I18nContext';
import { useLocation } from '@/context/LocationContext';
import { PHONE_FORMATS, formatPhoneDigits, buildFullPhone, type LangCode } from '@/constants/i18n';

type Role = 'buyer' | 'seller' | 'driver';

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const router = useRouter();
  const { t, setLangByCountry } = useI18n();
  const { setLocation, countryId } = useLocation();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const selectedCountryId = countryId ?? 'uz';
  const fmt = PHONE_FORMATS[selectedCountryId as LangCode] ?? PHONE_FORMATS.uz;

  const [name, setName] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>('buyer');
  const [regionId, setRegionId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const { data: countries } = useGetCountries();
  const { data: regions } = useGetRegions({ countryId: selectedCountryId });
  const { data: districts } = useGetDistricts(
    { regionId: regionId || undefined },
    { query: { enabled: !!regionId } },
  );

  const selectedCountry = countries?.find(c => c.id === selectedCountryId);

  const ROLES: { id: Role; label: string; icon: keyof typeof Feather.glyphMap; desc: string }[] = [
    { id: 'buyer',  label: t('buyer'),  icon: 'shopping-bag', desc: t('buyerDesc')  },
    { id: 'seller', label: t('seller'), icon: 'tag',          desc: t('sellerDesc') },
    { id: 'driver', label: t('driver'), icon: 'truck',        desc: t('driverDesc') },
  ];

  const registerMutation = useRegister({
    mutation: {
      onSuccess: async (data) => {
        await signIn(data.token, data.user as UserProfile);
        router.replace('/(tabs)');
      },
      onError: (err: unknown) => {
        const message = (err as { data?: { message?: string } })?.data?.message ?? 'Xato yuz berdi';
        Alert.alert('Xato', message);
      },
    },
  });

  function handlePhoneChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, fmt.maxDigits);
    setPhoneDigits(digits);
  }

  function handleNext() {
    if (!name.trim())          { Alert.alert('Xato', t('enterName'));        return; }
    if (!phoneDigits.trim())   { Alert.alert('Xato', t('enterPhone'));       return; }
    if (password.length < 6)   { Alert.alert('Xato', t('passwordTooShort')); return; }
    setStep(2);
  }

  function handleRegister() {
    if (!regionId || !districtId) {
      Alert.alert('Xato', t('selectRegion'));
      return;
    }
    const fullPhone = buildFullPhone(fmt.dialCode, phoneDigits);
    registerMutation.mutate({
      data: { name: name.trim(), phone: fullPhone, password, role, regionId, districtId },
    });
  }

  function handleSelectCountry(c: { id: string; name: string; flag: string; currency: string; dialCode: string }) {
    setLocation({ countryId: c.id, countryName: c.name, countryFlag: c.flag, currency: c.currency });
    setLangByCountry(c.id);
    setPhoneDigits('');
    setRegionId('');
    setDistrictId('');
    setShowCountryPicker(false);
  }

  const formattedDisplay = formatPhoneDigits(phoneDigits, fmt.mask);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={step === 2 ? () => setStep(1) : () => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {step === 1 ? t('register') : t('locationStep')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Step indicator */}
      <View style={[styles.stepBar, { backgroundColor: colors.card }]}>
        <View style={[styles.stepDot, { backgroundColor: colors.primary }]} />
        <View style={[styles.stepLine, { backgroundColor: step === 2 ? colors.primary : colors.border }]} />
        <View style={[styles.stepDot, { backgroundColor: step === 2 ? colors.primary : colors.border }]} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 30 }]}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 ? (
          <>
            {/* Country selector */}
            <TouchableOpacity
              style={[styles.countrySelector, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowCountryPicker(!showCountryPicker)}
            >
              <Text style={{ fontSize: 22 }}>{selectedCountry?.flag ?? '🌍'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.countrySelectorLabel, { color: colors.mutedForeground }]}>{t('country')}</Text>
                <Text style={[styles.countrySelectorName, { color: colors.text }]}>{selectedCountry?.name ?? "O'zbekiston"}</Text>
              </View>
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{fmt.dialCode}</Text>
              <Feather name={showCountryPicker ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mutedForeground} />
            </TouchableOpacity>

            {showCountryPicker && (
              <View style={[styles.pickerDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {(countries ?? []).map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.pickerRow, { borderBottomColor: colors.border }]}
                    onPress={() => handleSelectCountry(c as { id: string; name: string; flag: string; currency: string; dialCode: string })}
                  >
                    <Text style={{ fontSize: 22 }}>{c.flag}</Text>
                    <Text style={[styles.pickerName, { color: colors.text }]}>{c.name}</Text>
                    <Text style={[styles.pickerCode, { color: colors.mutedForeground }]}>{c.dialCode}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>{t('name')}</Text>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                <Feather name="user" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t('enterName')}
                  placeholderTextColor={colors.mutedForeground}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            {/* Phone with dial code */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>{t('phone')}</Text>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                <View style={[styles.dialCodeBadge, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.dialCodeText, { color: colors.primary }]}>{fmt.dialCode}</Text>
                </View>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={fmt.placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  value={formattedDisplay}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  maxLength={fmt.mask.length}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>{t('password')}</Text>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                <Feather name="lock" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="••••••"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Role */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>{t('role')}</Text>
              <View style={styles.rolesGrid}>
                {ROLES.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[
                      styles.roleCard,
                      {
                        backgroundColor: role === r.id ? colors.secondary : colors.card,
                        borderColor: role === r.id ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setRole(r.id)}
                  >
                    <Feather name={r.icon} size={20} color={role === r.id ? colors.primary : colors.mutedForeground} />
                    <Text style={[styles.roleLabel, { color: role === r.id ? colors.primary : colors.text }]}>{r.label}</Text>
                    <Text style={[styles.roleDesc, { color: colors.mutedForeground }]}>{r.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: colors.primary }]}
              onPress={handleNext}
            >
              <Text style={styles.nextBtnText}>{t('nextBtn')}</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[styles.stepTitle, { color: colors.text }]}>{t('locationStep')}</Text>
            <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>
              Bu sizga eng yaqin e'lonlarni ko'rsatish uchun kerak
            </Text>

            {/* Region */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>{t('region')} *</Text>
              <View style={styles.chipsGrid}>
                {(regions ?? []).map((reg) => (
                  <TouchableOpacity
                    key={reg.id}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: regionId === reg.id ? colors.primary : colors.card,
                        borderColor: regionId === reg.id ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => { setRegionId(reg.id); setDistrictId(''); }}
                  >
                    <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: regionId === reg.id ? '#fff' : colors.text }}>
                      {reg.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* District — only for Uzbekistan */}
            {regionId && selectedCountryId === 'uz' && (districts ?? []).length > 0 && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>{t('district')} *</Text>
                <View style={styles.chipsGrid}>
                  {(districts ?? []).map((dist) => (
                    <TouchableOpacity
                      key={dist.id}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: districtId === dist.id ? colors.primary : colors.card,
                          borderColor: districtId === dist.id ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setDistrictId(dist.id)}
                    >
                      <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: districtId === dist.id ? '#fff' : colors.text }}>
                        {dist.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* For non-Uzbekistan: auto-set districtId = regionId as fallback */}
            {regionId && selectedCountryId !== 'uz' && !districtId && (
              <View style={{ display: 'none' }}>
                {/* auto-set */}
                {(() => { if (!districtId) setDistrictId(regionId); return null; })()}
              </View>
            )}

            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: colors.primary, opacity: registerMutation.isPending ? 0.7 : 1 }]}
              onPress={handleRegister}
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.nextBtnText}>{t('registerBtn')}</Text>
                  <Feather name="check" size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        <View style={styles.loginRow}>
          <Text style={[styles.loginText, { color: colors.mutedForeground }]}>{t('haveAccount')}</Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={[styles.loginLink, { color: colors.primary }]}>{t('login')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  backBtn: { width: 40 },
  stepBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 12,
  },
  stepDot: { width: 12, height: 12, borderRadius: 6 },
  stepLine: { flex: 1, height: 2 },
  content: { padding: 20, gap: 16 },
  stepTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  stepSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: -8 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  countrySelector: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
  },
  countrySelectorLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  countrySelectorName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  pickerDropdown: { borderWidth: 1, borderRadius: 14, overflow: 'hidden', marginTop: -8 },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerName: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  pickerCode: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12,
  },
  dialCodeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  dialCodeText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  input: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
  rolesGrid: { gap: 10 },
  roleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  roleLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  roleDesc: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular' },
  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100, borderWidth: 1 },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: 14, marginTop: 4,
  },
  nextBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  loginText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  loginLink: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
