import React, { useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import {
  useListDriverVerifications, useReviewDriverVerification, getListDriverVerificationsQueryKey,
  getDriverDocumentUrl, getGetDriversQueryKey, getGetDriverQueryKey, getGetCargoLoadsQueryKey,
  useGetVehicleTypes, useGetRegions,
  type DriverVerification,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { Btn, ErrorBox, StatusPill, KIND_LABEL, STATUS_LABEL, statusColor, errMessage, errStatus } from '@/components/driver/ui';

type St = 'pending' | 'approved' | 'rejected';
const OPTS: St[] = ['pending', 'approved', 'rejected'];

function Review({ app, onDone }: { app: DriverVerification; onDone: () => void }) {
  const c = useColors();
  const qc = useQueryClient();
  const review = useReviewDriverVerification();
  const vehicleTypes = useGetVehicleTypes();
  const regions = useGetRegions();
  const revision = useRef(app.revision);
  const init = () => Object.fromEntries(app.documents.map((d) => [d.id, d.status as St]));
  const [docs, setDocs] = useState<Record<string, St>>(init);
  const [status, setStatus] = useState<St>((app.status === 'none' ? 'pending' : app.status) as St);
  const [reason, setReason] = useState(app.reason ?? '');
  const [err, setErr] = useState<string | null>(null);
  const [conflict, setStale] = useState(false);
  const stale = conflict || app.revision !== revision.current;
  const kinds = new Set(app.documents.map((d) => d.kind));
  const allThree = ['identity', 'license', 'registration'].every((k) => kinds.has(k as never));

  async function open(id: string) {
    try { const { url } = await getDriverDocumentUrl(app.id, id); (await import('expo-linking')).openURL(url); }
    catch (e) { setErr(errMessage(e)); }
  }
  function save() {
    setErr(null);
    if (status === 'rejected' && !reason.trim()) return setErr('Rad etish sababini yozing');
    if (status === 'approved' && !(allThree && app.documents.every((d) => docs[d.id] === 'approved'))) return setErr('Tasdiqlash uchun uchala hujjat ham tasdiqlangan bo\'lishi kerak');
    if (stale) return setStale(true);
    review.mutate({ id: app.id, data: { status, revision: revision.current, reason: reason.trim(), documents: app.documents.map((d) => ({ id: d.id, status: docs[d.id] ?? d.status })) } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListDriverVerificationsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetDriversQueryKey() });
        qc.invalidateQueries({ queryKey: getGetDriverQueryKey(app.id) });
        qc.invalidateQueries({ queryKey: getGetCargoLoadsQueryKey() });
        onDone();
      },
      onError: (e) => { if (errStatus(e) === 409) setStale(true); else setErr(errMessage(e)); },
    });
  }
  const seg = (cur: St, set: (s: St) => void) => (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {OPTS.map((o) => (
        <TouchableOpacity key={o} onPress={() => set(o)} style={[s.seg, { borderColor: cur === o ? statusColor(c, o) : c.input, backgroundColor: cur === o ? statusColor(c, o) + '22' : 'transparent' }]}>
          <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: cur === o ? statusColor(c, o) : c.mutedForeground }}>{STATUS_LABEL[o]}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
  return (
    <View style={{ gap: 10, marginTop: 8 }}>
      <Text style={{ color: c.mutedForeground, fontSize: 13 }}>
        Raqam {app.vehiclePlate} · {app.capacityKg} kg · {app.capacityM3} m³ · hamroh {app.sharedLoadAvailableKg} kg / {app.sharedLoadAvailableM3} m³
      </Text>
      <Text style={{ color: c.text, fontSize: 13 }}>
        {vehicleTypes.data?.find(item => item.id === app.vehicleTypeId)?.name ?? app.vehicleTypeId}
        {' · '}{regions.data?.find(item => item.id === app.currentRegionId)?.name ?? app.currentRegionId}
      </Text>
      <Text style={{ color: c.mutedForeground, fontSize: 13 }}>Mavjudlik: {new Date(app.availableFrom).toLocaleString()}</Text>
      {!!app.bio && <Text style={{ color: c.text, fontSize: 13 }}>{app.bio}</Text>}
      {!allThree && <Text style={{ color: c.statusPending, fontSize: 12 }}>Hujjatlar to'liq emas: uchala turdagi hujjat kerak.</Text>}
      {app.documents.map((d) => (
        <View key={d.id} style={[s.doc, { borderColor: c.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: c.text, fontFamily: 'Inter_600SemiBold', flex: 1 }}>{KIND_LABEL[d.kind]}</Text>
            <TouchableOpacity onPress={() => open(d.id)}><Text style={{ color: c.primary, fontFamily: 'Inter_700Bold', fontSize: 13 }}>Ochish</Text></TouchableOpacity>
          </View>
          {seg(docs[d.id] ?? d.status, (v) => setDocs((p) => ({ ...p, [d.id]: v })))}
        </View>
      ))}
      <Text style={{ color: c.mutedForeground, fontSize: 12 }}>Umumiy qaror</Text>
      {seg(status, setStatus)}
      <TextInput value={reason} onChangeText={setReason} multiline maxLength={1000} placeholder="Sabab / izoh" placeholderTextColor={c.mutedForeground}
        style={[s.input, { borderColor: c.input, color: c.text }]} />
      {stale && <ErrorBox message="Ariza boshqa joyda o'zgargan. Yangi holatni yuklang." onRetry={onDone} />}
      {err && <ErrorBox message={err} />}
      <Btn label={review.isPending ? 'Saqlanmoqda...' : 'Qarorni saqlash'} onPress={save} disabled={review.isPending || stale} />
    </View>
  );
}

export default function AdminDrivers() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const q = useListDriverVerifications({ query: { queryKey: getListDriverVerificationsQueryKey(), enabled: isAdmin, refetchInterval: 20000 } });
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState<St | 'all'>('pending');
  useFocusEffect(React.useCallback(() => { if (isAdmin) q.refetch(); }, [isAdmin])); // eslint-disable-line react-hooks/exhaustive-deps
  const top = Platform.OS === 'web' ? 67 : 0;
  const list = (q.data ?? []).filter((a) => filter === 'all' || a.status === filter);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Stack.Screen options={{ headerShown: true, title: 'Haydovchi arizalari', headerStyle: { backgroundColor: c.card }, headerTintColor: c.text }} />
      {!isAdmin ? (
        <Text style={{ padding: 24, marginTop: top, color: c.mutedForeground }}>Bu sahifa faqat administratorlar uchun.</Text>
      ) : q.isLoading ? <ActivityIndicator style={{ marginTop: 60 }} color={c.primary} size="large" /> : q.isError ? (
        <View style={{ padding: 16, marginTop: top }}><ErrorBox message={errMessage(q.error)} onRetry={() => q.refetch()} /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingTop: 16 + top, paddingBottom: insets.bottom + 40 }}>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
              <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[s.seg, { borderColor: filter === f ? c.primary : c.input, backgroundColor: filter === f ? c.accent : 'transparent' }]}>
                <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: c.text }}>{f === 'all' ? 'Hammasi' : STATUS_LABEL[f]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {list.length === 0 && <Text style={{ color: c.mutedForeground, textAlign: 'center', marginTop: 40 }}>Bu holatda arizalar yo'q.</Text>}
          {list.map((a) => (
            <View key={a.id} style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
              <TouchableOpacity onPress={() => setOpen(open === a.id ? null : a.id)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontFamily: 'Inter_700Bold', fontSize: 16 }}>{a.name}</Text>
                  <Text style={{ color: c.mutedForeground, fontSize: 12 }}>{a.vehiclePlate} · {a.documents.length}/3 hujjat</Text>
                </View>
                <StatusPill status={a.status} />
              </TouchableOpacity>
              {open === a.id && <Review key={a.id} app={a} onDone={() => { setOpen(null); q.refetch(); }} />}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { padding: 14, borderRadius: 16, borderWidth: 1 },
  seg: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  doc: { borderWidth: 1, borderRadius: 12, padding: 10, gap: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 64, fontFamily: 'Inter_400Regular', textAlignVertical: 'top' },
});
