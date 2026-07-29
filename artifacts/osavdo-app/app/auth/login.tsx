import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Platform, ScrollView, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useLogin, useGetCountries } from '@workspace/api-client-react';
import { useAuth, type UserProfile } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { useI18n } from '@/context/I18nContext';
import { useLocation } from '@/context/LocationContext';
import { PHONE_FORMATS, buildFullPhone, type LangCode } from '@/constants/i18n';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const router = useRouter();
  const { t, lang, setLangByCountry, phoneFormat } = useI18n();
  const { setLocation, countryFlag, countryId } = useLocation();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [phoneDigits, setPhoneDigits] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const { data: countries } = useGetCountries();

  // Current country info from i18n (lang = countryId for 1:1 mapping)
  const selectedCountryId = countryId ?? 'uz';
  const fmt = PHONE_FORMATS[selectedCountryId as LangCode] ?? PHONE_FORMATS.uz;
  const selectedCountry = countries?.find(c => c.id === selectedCountryId);

  const loginMutation = useLogin({
    mutation: {
      onSuccess: async (data) => {
        await signIn(data.token, data.user as UserProfile);
        router.replace('/(tabs)');
      },
      onError: () => {
        Alert.alert(t('login'), t('wrongCredentials'));
      },
    },
  });

  function handlePhoneChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, fmt.maxDigits);
    setPhoneDigits(digits);
  }

  function handleLogin() {
    if (!phoneDigits.trim() || !password) {
      Alert.alert(t('login'), t('fillAllFields'));
      return;
    }
    const fullPhone = buildFullPhone(fmt.dialCode, phoneDigits);
    loginMutation.mutate({ data: { phone: fullPhone, password } });
  }

  function handleSelectCountry(c: { id: string; name: string; flag: string; currency: string; dialCode: string }) {
    setLocation({ countryId: c.id, countryName: c.name, countryFlag: c.flag, currency: c.currency });
    setLangByCountry(c.id);
    setPhoneDigits('');
    setShowCountryPicker(false);
  }

  // formattedDisplay faqat placeholder ko'rinishi uchun (input value = raw digits)
  const formattedPlaceholder = fmt.placeholder;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 40, paddingBottom: botPad + 30 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <Image source={require('@/assets/images/turan-logo.png')} style={styles.logoImage} resizeMode="contain" />
          <Text style={[styles.appName, { color: colors.primary }]}>Turan Market</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>{t('appTagline')}</Text>
        </View>

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

        {/* Country picker dropdown */}
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

        {/* Form card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('welcomeBack')}</Text>

          {/* Phone with dial code prefix */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>{t('phone')}</Text>
            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
              <View style={[styles.dialCodeBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.dialCodeText, { color: colors.primary }]}>{fmt.dialCode}</Text>
              </View>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={formattedPlaceholder}
                placeholderTextColor={colors.mutedForeground}
                value={phoneDigits}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                autoCapitalize="none"
                maxLength={fmt.maxDigits}
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
                placeholder="••••••••"
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

          {/* Login button */}
          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: colors.primary, opacity: loginMutation.isPending ? 0.7 : 1 }]}
            onPress={handleLogin}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.loginBtnText}>{t('loginBtn')}</Text>
            }
          </TouchableOpacity>

          {/* Demo hint */}
          <View style={[styles.demoHint, { backgroundColor: colors.secondary }]}>
            <Feather name="info" size={13} color={colors.primary} />
            <Text style={[styles.demoText, { color: colors.primary }]}>{t('demoHint')}</Text>
          </View>
        </View>

        {/* Register link */}
        <View style={styles.registerRow}>
          <Text style={[styles.registerText, { color: colors.mutedForeground }]}>{t('dontHaveAccount')}</Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={[styles.registerLink, { color: colors.primary }]}>{t('register')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 14 },
  logoSection: { alignItems: 'center', gap: 6, marginBottom: 6 },
  logoImage: { width: 100, height: 100 },
  appName: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  tagline: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  countrySelector: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
  },
  countrySelectorLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  countrySelectorName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  pickerDropdown: {
    borderWidth: 1, borderRadius: 14, overflow: 'hidden', marginTop: -8,
  },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerName: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  pickerCode: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  card: { borderWidth: 1, borderRadius: 16, padding: 20, gap: 14 },
  cardTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12,
  },
  dialCodeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  dialCodeText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  input: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
  loginBtn: {
    paddingVertical: 15, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  loginBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  demoHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    padding: 10, borderRadius: 10,
  },
  demoText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  registerText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  registerLink: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
