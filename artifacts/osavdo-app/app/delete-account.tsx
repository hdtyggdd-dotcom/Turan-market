import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useDeleteAccount, getBaseUrl } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

function makeRequestId(): string {
  const h = () => Math.floor(Math.random() * 16).toString(16);
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) =>
    c === 'x' ? h() : ((Math.floor(Math.random() * 4) + 8).toString(16)),
  );
}

function apiMessage(e: unknown): string {
  const x = e as { status?: number; data?: { message?: string; error?: string }; message?: string };
  const m = x?.data?.message ?? x?.data?.error;
  if (m) return m;
  if (x?.status === 401) return "Parol noto'g'ri.";
  if (x?.status === 409) return "Hisobni hozir o'chirib bo'lmaydi. Faol buyurtma yoki transportni yakunlang.";
  if (x?.status === 429) return "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring.";
  if (x?.status === 503) return "Xizmat vaqtincha ishlamayapti. Keyinroq qayta urinib ko'ring.";
  return "Ulanishda xatolik. Hisob o'chirilgan bo'lishi mumkin; shu tugma bilan qayta urinish xavfsiz.";
}

const ITEMS = [
  "Profil, aloqa ma'lumotlari va rasmlaringiz o'chiriladi.",
  "Shaxsiy hujjatlar (masalan, haydovchi hujjatlari) o'chiriladi.",
  "Uchinchi tomonlar bilan yakunlangan tarix saqlanadi, lekin sizning aloqa ma'lumotlaringizsiz.",
  "Faol buyurtmalar va qabul qilingan transport avval yakunlanishi yoki bekor qilinishi kerak.",
  "Oxirgi adminni o'chirib bo'lmaydi.",
];

export default function DeleteAccountScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, finishAccountDeletion } = useAuth();
  const del = useDeleteAccount();
  const [password, setPassword] = useState<string>('');
  const [ack, setAck] = useState<boolean>(false);
  const [armed, setArmed] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ filesPending: boolean; warning?: string } | null>(null);
  const requestId = useRef<string>(makeRequestId());
  const lastStatus = useRef<number | undefined>(undefined);
  const busy = useRef<boolean>(false);
  const replaceOperation = useRef<boolean>(false);
  const userIdRef = useRef<string | undefined>(user?.id);
  userIdRef.current = user?.id;

  useEffect(() => {
    // Different account: drop all form state and operation id.
    setPassword(''); setAck(false); setArmed(false); setError(null);
    requestId.current = makeRequestId(); lastStatus.current = undefined;
  }, [user?.id]);

  const top = Platform.OS === 'web' ? 24 : 0;
  const goLogin = () => router.replace('/auth/login');

  if (done) {
    return (
      <View style={[s.fill, { backgroundColor: c.background, padding: 24, paddingTop: insets.top + 48, gap: 14 }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Feather name="check-circle" size={40} color={c.primary} />
        <Text style={[s.h, { color: c.text }]}>Hisob o'chirildi</Text>
        <Text style={[s.p, { color: c.mutedForeground }]}>
          Hisobingiz va shaxsiy ma'lumotlaringiz o'chirildi.
          {done.filesPending ? " Fayllarni tozalash hali yakunlanmagan; u avtomatik tarzda davom etadi." : ''}
        </Text>
        {done.warning ? <Text style={[s.p, { color: c.destructive }]}>{done.warning}</Text> : null}
        <TouchableOpacity testID="deletion-done" onPress={goLogin} style={[s.btn, { backgroundColor: c.primary }]}>
          <Text style={s.btnText}>Kirish oynasiga qaytish</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[s.fill, { backgroundColor: c.background, padding: 24, paddingTop: insets.top + 48, gap: 14 }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={[s.h, { color: c.text }]}>Hisobga kiring</Text>
        <Text style={[s.p, { color: c.mutedForeground }]}>Hisobni o'chirish uchun avval tizimga kiring.</Text>
        <TouchableOpacity onPress={goLogin} style={[s.btn, { backgroundColor: c.primary }]}>
          <Text style={s.btnText}>Kirish</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { void Linking.openURL(`${getBaseUrl()}/api/account-deletion`); }}>
          <Text style={{ color: c.primary, fontFamily: 'Inter_600SemiBold' }}>Veb orqali o'chirish</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const submit = async () => {
    if (busy.current || del.isPending || !ack || !armed || !password) return;
    busy.current = true;
    setError(null);
    const forId = user.id;
    try {
      const key = `turan_account_deletion:${forId}`;
      const saved = await AsyncStorage.getItem(key);
      if (saved && !replaceOperation.current) requestId.current = saved;
      else await AsyncStorage.setItem(key, requestId.current);
      replaceOperation.current = false;
    } catch {
      busy.current = false;
      setError("Xavfsiz qayta urinish identifikatorini saqlab bo‘lmadi. Qayta urinib ko‘ring.");
      return;
    }
    if (userIdRef.current !== forId) { busy.current = false; return; }
    del.mutate(
      { data: { phone: user.phone, password, confirmation: true, requestId: requestId.current } },
      {
        onSuccess: async (res) => {
          if (userIdRef.current !== forId) return; // stale response for another account
          setPassword('');
          let warning: string | undefined;
          try { await finishAccountDeletion(); }
          catch (error) { warning = error instanceof Error ? error.message : "Hisob serverda yopildi, ammo telefon xotirasini tozalash yakunlanmadi. Ilovani yopib qayta oching."; }
          if (userIdRef.current && userIdRef.current !== forId) return;
          setDone({ filesPending: res.filesPending, warning });
        },
        onError: (e) => {
          if (userIdRef.current !== forId) return;
          lastStatus.current = (e as { status?: number })?.status;
          setError(apiMessage(e));
          setArmed(false);
        },
        onSettled: () => { busy.current = false; },
      },
    );
  };

  const onPassword = (v: string) => {
    setPassword(v); setArmed(false);
    // Definite rejection: a corrected password is a new operation.
    if (lastStatus.current === 401) { requestId.current = makeRequestId(); replaceOperation.current = true; lastStatus.current = undefined; }
  };

  const canArm = ack && password.length > 0 && !del.isPending;

  return (
    <View style={[s.fill, { backgroundColor: c.background }]}>
      <Stack.Screen options={{ headerShown: true, title: "Hisobni o'chirish", headerStyle: { backgroundColor: c.card }, headerTintColor: c.text }} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 14, paddingTop: 16 + top, paddingBottom: insets.bottom + 48 }}>
        <View style={[s.card, { backgroundColor: c.card, borderColor: c.destructive }]}>
          <View style={s.row}>
            <Feather name="alert-triangle" size={18} color={c.destructive} />
            <Text style={[s.h2, { color: c.destructive }]}>Bu amalni qaytarib bo'lmaydi</Text>
          </View>
          {ITEMS.map((t) => (
            <View key={t} style={s.row}>
              <Feather name="minus" size={14} color={c.mutedForeground} style={{ marginTop: 3 }} />
              <Text style={[s.p, { color: c.text, flex: 1 }]}>{t}</Text>
            </View>
          ))}
        </View>

        <Text style={[s.label, { color: c.mutedForeground }]}>Telefon raqami</Text>
        <TextInput value={user.phone} editable={false} style={[s.input, { borderColor: c.border, color: c.mutedForeground, backgroundColor: c.secondary }]} />

        <Text style={[s.label, { color: c.mutedForeground }]}>Joriy parol</Text>
        <TextInput
          testID="deletion-password"
          value={password}
          onChangeText={onPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!del.isPending}
          textContentType="password"
          placeholder="Parolingiz"
          placeholderTextColor={c.mutedForeground}
          maxLength={256}
          style={[s.input, { borderColor: c.input, color: c.text, backgroundColor: c.card }]}
        />

        <TouchableOpacity
          testID="deletion-ack"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: ack }}
          disabled={del.isPending}
          onPress={() => { setAck(!ack); setArmed(false); }}
          style={s.row}
        >
          <Feather name={ack ? 'check-square' : 'square'} size={22} color={ack ? c.destructive : c.mutedForeground} />
          <Text style={[s.p, { color: c.text, flex: 1 }]}>Hisobim va ma'lumotlarim butunlay o'chirilishini tushundim.</Text>
        </TouchableOpacity>

        {!!error && (
          <View style={[s.card, { backgroundColor: c.card, borderColor: c.destructive }]}>
            <Text style={[s.p, { color: c.destructive }]}>{error}</Text>
          </View>
        )}

        {!armed ? (
          <TouchableOpacity
            testID="deletion-continue"
            disabled={!canArm}
            onPress={() => setArmed(true)}
            style={[s.btn, { backgroundColor: c.destructive, opacity: canArm ? 1 : 0.4 }]}
          >
            <Text style={s.btnText}>Davom etish</Text>
          </TouchableOpacity>
        ) : (
          <View style={[s.card, { backgroundColor: c.card, borderColor: c.destructive }]}>
            <Text style={[s.h2, { color: c.text }]}>Oxirgi tasdiq</Text>
            <Text style={[s.p, { color: c.mutedForeground }]}>{user.phone} raqamli hisob hozir o'chiriladi.</Text>
            <TouchableOpacity testID="deletion-confirm" disabled={del.isPending} onPress={submit} style={[s.btn, { backgroundColor: c.destructive, opacity: del.isPending ? 0.6 : 1 }]}>
              {del.isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Hisobni butunlay o'chirish</Text>}
            </TouchableOpacity>
            <TouchableOpacity disabled={del.isPending} onPress={() => setArmed(false)} style={s.btn}>
              <Text style={{ color: c.text, fontFamily: 'Inter_600SemiBold' }}>Bekor qilish</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity onPress={() => { void Linking.openURL(`${getBaseUrl()}/api/account-deletion`); }}>
          <Text style={{ color: c.primary, fontFamily: 'Inter_500Medium', fontSize: 13 }}>Ommaviy o'chirish sahifasi</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  card: { padding: 14, borderRadius: 14, borderWidth: 1, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  h: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  h2: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  p: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_400Regular' },
  label: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15, fontFamily: 'Inter_400Regular' },
  btn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12 },
  btnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
