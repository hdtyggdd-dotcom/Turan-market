import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useRegister, useGetRegions, useGetDistricts } from '@workspace/api-client-react';
import { useAuth, type UserProfile } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { KeyboardAwareScrollViewCompat } from 'react-native-keyboard-controller';

type Role = 'buyer' | 'seller' | 'driver';

const ROLES: { id: Role; label: string; icon: keyof typeof Feather.glyphMap; desc: string }[] = [
  { id: 'buyer', label: 'Xaridor', icon: 'shopping-bag', desc: 'Mahsulot sotib olaman' },
  { id: 'seller', label: 'Sotuvchi', icon: 'tag', desc: "E'lon joylayman va sotaman" },
  { id: 'driver', label: 'Haydovchi', icon: 'truck', desc: 'Yetkazib beraman' },
];

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const router = useRouter();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>('buyer');
  const [regionId, setRegionId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  const { data: regions } = useGetRegions();
  const { data: districts } = useGetDistricts(
    { regionId: regionId || undefined },
    { query: { enabled: !!regionId } },
  );

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

  function handleNext() {
    if (!name.trim()) { Alert.alert('Xato', 'Ismingizni kiriting'); return; }
    if (!phone.trim()) { Alert.alert('Xato', 'Telefon raqamni kiriting'); return; }
    if (password.length < 6) { Alert.alert('Xato', 'Parol kamida 6 ta belgi bo\'lishi kerak'); return; }
    setStep(2);
  }

  function handleRegister() {
    if (!regionId || !districtId) {
      Alert.alert('Xato', 'Viloyat va tumanni tanlang');
      return;
    }
    registerMutation.mutate({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        password,
        role,
        regionId,
        districtId,
      },
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={step === 2 ? () => setStep(1) : () => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {step === 1 ? "Ro'yxatdan o'tish" : 'Joylashuv'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Step indicator */}
      <View style={[styles.stepBar, { backgroundColor: colors.card }]}>
        <View style={[styles.stepDot, { backgroundColor: colors.primary }]} />
        <View style={[styles.stepLine, { backgroundColor: step === 2 ? colors.primary : colors.border }]} />
        <View style={[styles.stepDot, { backgroundColor: step === 2 ? colors.primary : colors.border }]} />
      </View>

      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 30 }]}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 ? (
          <>
            {/* Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>To'liq ism</Text>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                <Feather name="user" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Aziz Karimov"
                  placeholderTextColor={colors.mutedForeground}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Telefon raqam</Text>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                <Feather name="phone" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="+998 90 000 00 00"
                  placeholderTextColor={colors.mutedForeground}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Parol</Text>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                <Feather name="lock" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Kamida 6 belgi"
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
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Siz kim sifatida kirasiz?</Text>
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
                    <Text style={[styles.roleLabel, { color: role === r.id ? colors.primary : colors.text }]}>
                      {r.label}
                    </Text>
                    <Text style={[styles.roleDesc, { color: colors.mutedForeground }]}>{r.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: colors.primary }]}
              onPress={handleNext}
            >
              <Text style={styles.nextBtnText}>Davom etish</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Joylashuvingizni tanlang</Text>
            <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>
              Bu sizga eng yaqin e'lonlarni ko'rsatish uchun kerak
            </Text>

            {/* Region */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Viloyat *</Text>
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

            {/* District */}
            {regionId && (districts ?? []).length > 0 && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Tuman *</Text>
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

            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: colors.primary, opacity: registerMutation.isPending ? 0.7 : 1 }]}
              onPress={handleRegister}
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.nextBtnText}>Ro'yxatdan o'tish</Text>
                  <Feather name="check" size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Login link */}
        <View style={styles.loginRow}>
          <Text style={[styles.loginText, { color: colors.mutedForeground }]}>
            Hisobingiz bormi?
          </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={[styles.loginLink, { color: colors.primary }]}>Kirish</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  backBtn: { width: 40 },
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 0,
  },
  stepDot: { width: 12, height: 12, borderRadius: 6 },
  stepLine: { flex: 1, height: 2 },
  content: { padding: 20, gap: 18 },
  stepTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  stepSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: -10 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
  rolesGrid: { gap: 10 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  roleLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  roleDesc: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular' },
  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 4,
  },
  nextBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  loginText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  loginLink: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
