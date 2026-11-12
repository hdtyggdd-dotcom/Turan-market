import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetAdviceBudget, getGetAdviceBudgetQueryKey, useAcknowledgeAdviceBudgetAlert,
  type AdviceBudgetCounter,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { Btn, ErrorBox, errMessage, errStatus } from '@/components/driver/ui';

function Counter({ title, d, pct }: { title: string; d: AdviceBudgetCounter; pct: number }) {
  const c = useColors();
  const ratio = d.limit > 0 ? Math.min(100, (d.used / d.limit) * 100) : 100;
  const warn = ratio >= pct;
  const tone = warn ? c.statusPending : c.primary;
  return (
    <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
      <Text style={{ color: c.text, fontFamily: 'Inter_700Bold', fontSize: 16 }}>{title}</Text>
      <View style={[s.bar, { backgroundColor: c.secondary }]}>
        <View style={{ width: `${ratio}%`, height: 8, borderRadius: 4, backgroundColor: tone }} />
      </View>
      <View style={s.stats}>
        {([['Ishlatilgan', d.used], ['Limit', d.limit], ['Qoldi', d.remaining]] as const).map(([l, v]) => (
          <View key={l} style={{ flex: 1 }}>
            <Text style={{ color: tone, fontFamily: 'Inter_700Bold', fontSize: 20 }}>{v}</Text>
            <Text style={{ color: c.mutedForeground, fontSize: 12 }}>{l}</Text>
          </View>
        ))}
      </View>
      <Text style={{ color: c.mutedForeground, fontSize: 12 }}>{d.limit === 0 ? 'AI maslahat o‘chirilgan (limit 0).' : `${ratio.toFixed(1)}% band qilingan`}</Text>
    </View>
  );
}

export default function AdminAiBudget() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [focused, setFocused] = useState(false);
  const q = useGetAdviceBudget({ query: { queryKey: getGetAdviceBudgetQueryKey(), enabled: isAdmin, staleTime: 15000, refetchInterval: isAdmin && focused ? 30000 : false } });
  const ack = useAcknowledgeAdviceBudgetAlert();
  const [err, setErr] = useState<string | null>(null);
  const refetch = q.refetch;
  useFocusEffect(useCallback(() => {
    setFocused(true);
    if (isAdmin) void refetch();
    return () => setFocused(false);
  }, [isAdmin, refetch]));
  const top = Platform.OS === 'web' ? 67 : 0;
  const header = <Stack.Screen options={{ title: 'AI maslahat budjeti', headerStyle: { backgroundColor: c.card }, headerTintColor: c.text }} />;

  if (!isAdmin) {
    return <View style={{ flex: 1, backgroundColor: c.background }}>{header}
      <Text style={{ padding: 24, marginTop: top, color: c.mutedForeground }}>Bu sahifa faqat administratorlar uchun.</Text></View>;
  }
  if (q.isLoading) {
    return <View style={{ flex: 1, backgroundColor: c.background }}>{header}<ActivityIndicator style={{ marginTop: 60 }} color={c.primary} size="large" /></View>;
  }
  if (q.isError || !q.data) {
    const forbidden = errStatus(q.error) === 403;
    return <View style={{ flex: 1, backgroundColor: c.background }}>{header}
      <View style={{ padding: 16, marginTop: top }}>
        <ErrorBox message={forbidden ? 'Ruxsat yo\'q (403): bu ma\'lumot faqat administratorlar uchun.' : errMessage(q.error)} onRetry={forbidden ? undefined : () => q.refetch()} />
      </View></View>;
  }
  const d = q.data;
  const unread = d.alerts.filter((a) => !a.readAt);
  const read = d.alerts.filter((a) => a.readAt);

  function acknowledge(id: string) {
    setErr(null);
    ack.mutate({ id }, {
      onSuccess: () => { void qc.invalidateQueries({ queryKey: getGetAdviceBudgetQueryKey() }); },
      onError: (e) => setErr(errMessage(e)),
    });
  }
  const label = (a: typeof d.alerts[number]) => `${a.scope === 'daily' ? `Kunlik ${a.day ?? ''}` : 'Umumiy'}: ${a.used} / ${a.limit}`;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {header}
      <ScrollView
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} />}
        contentContainerStyle={{ padding: 16, gap: 12, paddingTop: 16 + top, paddingBottom: insets.bottom + 40 }}>
        <Counter title={`Kunlik (UTC ${d.day})`} d={d.daily} pct={d.warningThresholdPercent} />
        <Counter title="Umumiy (butun davr)" d={d.total} pct={d.warningThresholdPercent} />
        <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={{ color: c.text, fontSize: 13 }}>Kunlik hisob yangilanishi: {new Date(d.resetsAt).toUTCString()}</Text>
          <Text style={{ color: c.text, fontSize: 13 }}>Ogohlantirish chegarasi: {d.warningThresholdPercent}%</Text>
          <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
            Sonlar band qilingan urinishlar soni, pul miqdori emas. Muvaffaqiyatsiz urinishlar ham hisobda qoladi.
          </Text>
        </View>
        <Text style={{ color: c.text, fontFamily: 'Inter_700Bold', fontSize: 16 }}>Ogohlantirishlar</Text>
        {err && <ErrorBox message={err} />}
        {d.alerts.length === 0 && <Text style={{ color: c.mutedForeground }}>Ogohlantirishlar yo'q.</Text>}
        {unread.map((a) => (
          <View key={a.id} style={[s.card, { backgroundColor: c.card, borderColor: c.statusPending }]}>
            <Text style={{ color: c.text, fontFamily: 'Inter_600SemiBold' }}>{label(a)}</Text>
            <Text style={{ color: c.mutedForeground, fontSize: 12 }}>{new Date(a.createdAt).toLocaleString()}</Text>
            <Btn label={ack.isPending ? 'Yuborilmoqda...' : 'Tushundim'} onPress={() => acknowledge(a.id)} disabled={ack.isPending} />
          </View>
        ))}
        {read.map((a) => (
          <View key={a.id} style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={{ color: c.mutedForeground }}>{label(a)}</Text>
            <Text style={{ color: c.mutedForeground, fontSize: 12 }}>O'qilgan: {new Date(a.readAt as string).toLocaleString()}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  card: { padding: 14, borderRadius: 16, borderWidth: 1, gap: 8 },
  bar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  stats: { flexDirection: 'row', gap: 8 },
});
