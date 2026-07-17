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
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useLogin } from '@workspace/api-client-react';
import { useAuth, type UserProfile } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { KeyboardAwareScrollViewCompat } from 'react-native-keyboard-controller';
import { Feather } from '@expo/vector-icons';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const router = useRouter();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useLogin({
    mutation: {
      onSuccess: async (data) => {
        await signIn(data.token, data.user as UserProfile);
        router.replace('/(tabs)');
      },
      onError: () => {
        Alert.alert('Xato', 'Telefon raqam yoki parol noto\'g\'ri');
      },
    },
  });

  function handleLogin() {
    if (!phone.trim() || !password) {
      Alert.alert('Xato', 'Barcha maydonlarni to\'ldiring');
      return;
    }
    loginMutation.mutate({ data: { phone: phone.trim(), password } });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 40, paddingBottom: botPad + 30 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo & Title */}
        <View style={styles.logoSection}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>O</Text>
          </View>
          <Text style={[styles.appName, { color: colors.primary }]}>O'Savdo</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Mahalliy bozor — tumandagi eng yaxshi narxlar
          </Text>
        </View>

        {/* Form card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Kirish</Text>

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Telefon raqam</Text>
            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
              <Feather name="phone" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="+998 90 123 45 67"
                placeholderTextColor={colors.mutedForeground}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCapitalize="none"
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
            {loginMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Kirish</Text>
            )}
          </TouchableOpacity>

          {/* Demo hint */}
          <View style={[styles.demoHint, { backgroundColor: colors.secondary }]}>
            <Feather name="info" size={13} color={colors.primary} />
            <Text style={[styles.demoText, { color: colors.primary }]}>
              Demo: +998901234567 / test123
            </Text>
          </View>
        </View>

        {/* Register link */}
        <View style={styles.registerRow}>
          <Text style={[styles.registerText, { color: colors.mutedForeground }]}>
            Hisobingiz yo'qmi?
          </Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={[styles.registerLink, { color: colors.primary }]}>
              Ro'yxatdan o'ting
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    gap: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  logoSection: {
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoText: {
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  appName: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  fieldGroup: { gap: 6 },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  loginBtn: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  loginBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  demoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
  },
  demoText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  registerText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  registerLink: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
