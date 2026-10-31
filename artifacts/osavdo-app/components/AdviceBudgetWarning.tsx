import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetAdviceBudget, getGetAdviceBudgetQueryKey, useAcknowledgeAdviceBudgetAlert,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { errMessage, errStatus, ErrorBox } from '@/components/driver/ui';

export function AdviceBudgetWarning() {
  const c = useColors();
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [focused, setFocused] = useState(false);
  const q = useGetAdviceBudget({
    query: {
      queryKey: getGetAdviceBudgetQueryKey(),
      enabled: isAdmin,
      staleTime: 15000,
      refetchInterval: isAdmin && focused ? 30000 : false,
      refetchOnWindowFocus: true,
    },
  });
  const refetch = q.refetch;
  useFocusEffect(useCallback(() => {
    setFocused(true);
    if (isAdmin) void refetch();
    return () => setFocused(false);
  }, [isAdmin, refetch]));
  const ack = useAcknowledgeAdviceBudgetAlert();
  const [err, setErr] = useState<string | null>(null);
  if (!isAdmin) return null;
  if (q.isError) return (
    <ErrorBox
      message={errStatus(q.error) === 403 ? 'AI budjeti uchun ruxsat yo‘q.' : 'AI budjeti ogohlantirishlarini tekshirib bo‘lmadi.'}
      onRetry={errStatus(q.error) === 403 ? undefined : () => { void q.refetch(); }}
    />
  );
  if (!q.data) return null;
  const unread = q.data.alerts.filter((a) => !a.readAt);
  if (unread.length === 0) return null;

  function acknowledge(id: string) {
    setErr(null);
    ack.mutate({ id }, {
      onSuccess: () => { void qc.invalidateQueries({ queryKey: getGetAdviceBudgetQueryKey() }); },
      onError: (e) => setErr(errMessage(e)),
    });
  }

  return (
    <View style={[s.box, { backgroundColor: c.card, borderColor: c.statusPending }]} testID="advice-budget-warning">
      <View style={s.row}>
        <Feather name="alert-triangle" size={18} color={c.statusPending} />
        <Text style={[s.title, { color: c.text }]}>AI maslahat limiti yaqin</Text>
      </View>
      {unread.map((a) => (
        <View key={a.id} style={s.row}>
          <Text style={[s.txt, { color: c.mutedForeground }]}>
            {a.scope === 'daily' ? `Kunlik (${a.day ?? ''})` : 'Umumiy'}: {a.used} / {a.limit} so'rov band qilingan
          </Text>
          <TouchableOpacity disabled={ack.isPending} onPress={() => acknowledge(a.id)} accessibilityLabel="Ogohlantirishni tasdiqlash">
            <Text style={{ color: c.primary, fontFamily: 'Inter_700Bold', fontSize: 13 }}>Tushundim</Text>
          </TouchableOpacity>
        </View>
      ))}
      {err && <Text style={{ color: c.destructive, fontSize: 12 }}>{err}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  box: { padding: 12, borderRadius: 14, borderWidth: 1, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' },
  title: { fontSize: 14, fontFamily: 'Inter_700Bold', flex: 1 },
  txt: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1 },
});
