import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetMyDriverVerification, useSubmitDriverVerification, useUploadDriverDocument,
  useGetVehicleTypes, useGetRegions, getGetMyDriverVerificationQueryKey,
  getListDriverVerificationsQueryKey, getGetDriversQueryKey, getGetDriverQueryKey, getGetCargoLoadsQueryKey,
  getDriverDocumentUrl, type DriverVerification, type DriverDocumentInputMimeType,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { Btn, ErrorBox, StatusPill, KINDS, KIND_LABEL, STATUS_LABEL, errMessage, errStatus } from '@/components/driver/ui';

type Form = {
  vehicleTypeId: string; vehiclePlate: string; capacityKg: string; capacityM3: string;
  sharedKg: string; sharedM3: string; availableFrom: string; regionId: string; bio: string;
};
function localTime(value: string) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16).replace('T', ' ');
}
const toForm = (v: DriverVerification | null | undefined): Form => ({
  vehicleTypeId: v?.vehicleTypeId ?? '', vehiclePlate: v?.vehiclePlate ?? '',
  capacityKg: v ? String(v.capacityKg) : '', capacityM3: v ? String(v.capacityM3) : '',
  sharedKg: v ? String(v.sharedLoadAvailableKg) : '0', sharedM3: v ? String(v.sharedLoadAvailableM3) : '0',
  availableFrom: localTime(v?.availableFrom ?? new Date().toISOString()),
  regionId: v?.currentRegionId ?? '', bio: v?.bio ?? '',
});
const MAX_BYTES = 5 * 1024 * 1024;

export default function DriverVerificationScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const q = useGetMyDriverVerification({ query: { queryKey: getGetMyDriverVerificationQueryKey(), enabled: user?.role === 'driver', refetchInterval: 15000 } });
  const types = useGetVehicleTypes();
  const regions = useGetRegions();
  const submit = useSubmitDriverVerification();
  const upload = useUploadDriverDocument();

  const [form, setForm] = useState<Form>(toForm(null));
  const [base, setBase] = useState<{ rev: number; form: Form } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [stale, setStale] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [upKind, setUpKind] = useState<string | null>(null);
  const server = q.data as DriverVerification | null | undefined;
  const hasApp = !!server && server.status !== 'none';
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  useEffect(() => {
    if (!q.isSuccess) return;
    const rev = server?.revision ?? 0;
    if (!base) {
      const f = toForm(hasApp ? server : null);
      setForm(f); setBase({ rev, form: f });
    } else if (rev !== base.rev) {
      if (dirtyRef.current) setStale(true);
      else { const f = toForm(server); setForm(f); setBase({ rev, form: f }); }
    }
  }, [q.isSuccess, server, hasApp, base]);

  useFocusEffect(useCallback(() => { q.refetch(); }, [])); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: keyof Form) => (v: string) => { setForm((f) => ({ ...f, [k]: v })); setDirty(true); };
  const reload = () => { const f = toForm(hasApp ? server : null); setForm(f); setBase({ rev: server?.revision ?? 0, form: f }); setDirty(false); setStale(false); setErr(null); };

  function invalidate() {
    qc.invalidateQueries({ queryKey: getListDriverVerificationsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetDriversQueryKey() });
    qc.invalidateQueries({ queryKey: getGetCargoLoadsQueryKey() });
    if (server?.id) qc.invalidateQueries({ queryKey: getGetDriverQueryKey(server.id) });
  }

  function onSubmit() {
    setErr(null); setMsg(null);
    const kg = Number(form.capacityKg), m3 = Number(form.capacityM3), skg = Number(form.sharedKg), sm3 = Number(form.sharedM3);
    const when = new Date(form.availableFrom.replace(' ', 'T'));
    if (!form.vehicleTypeId || !form.regionId) return setErr('Transport turi va hududni tanlang');
    if (form.vehiclePlate.trim().length < 3) return setErr('Davlat raqamini kiriting');
    if (!(kg > 0) || !(m3 > 0) || skg < 0 || sm3 < 0 || [skg, sm3].some(isNaN)) return setErr('Sig\'im qiymatlari noto\'g\'ri');
    if (isNaN(when.getTime())) return setErr('Vaqt formati: 2025-01-31 09:00');
    submit.mutate({ data: {
      revision: base?.rev ?? 0, vehicleTypeId: form.vehicleTypeId, vehiclePlate: form.vehiclePlate.trim(),
      capacityKg: kg, capacityM3: m3, sharedLoadAvailableKg: skg, sharedLoadAvailableM3: sm3,
      availableFrom: when.toISOString(), currentRegionId: form.regionId, bio: form.bio.trim() || null,
    } }, {
      onSuccess: (res) => {
        qc.setQueryData(getGetMyDriverVerificationQueryKey(), res);
        const f = toForm(res); setForm(f); setBase({ rev: res.revision, form: f }); setDirty(false); setStale(false);
        setMsg('Ariza yuborildi. Tekshiruv kutilmoqda.'); invalidate();
      },
      onError: (e) => { if (errStatus(e) === 409) setStale(true); else setErr(errMessage(e)); },
    });
  }

  async function pick(kind: (typeof KINDS)[number], camera: boolean) {
    setErr(null); setMsg(null);
    if (dirty || stale) return setErr('Hujjat yuklashdan oldin transport o‘zgarishlarini saqlang yoki arizani qayta yuklang.');
    try {
      if (camera && Platform.OS !== 'web') {
        const p = await ImagePicker.requestCameraPermissionsAsync();
        if (!p.granted) return setErr('Kamera ruxsati berilmadi');
      }
      const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], base64: true, quality: 0.7 };
      const r = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (r.canceled || !r.assets?.[0]) return;
      const a = r.assets[0];
      const mime = (a.mimeType ?? (a.uri.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg')) as string;
      if (mime !== 'image/jpeg' && mime !== 'image/png') return setErr('Faqat JPEG yoki PNG qabul qilinadi');
      if (!a.base64) return setErr('Rasmni o\'qib bo\'lmadi');
      if (Math.floor((a.base64.length * 3) / 4) > MAX_BYTES) return setErr('Rasm 5 MB dan oshmasligi kerak');
      setUpKind(kind);
      upload.mutate({ data: { kind, data: a.base64, mimeType: mime as DriverDocumentInputMimeType } }, {
        onSuccess: (res) => {
          qc.setQueryData(getGetMyDriverVerificationQueryKey(), res);
          setBase((b) => (b ? { ...b, rev: res.revision } : b));
          setMsg('Hujjat yuklandi. Ariza qayta tekshiruvga yuborildi.'); invalidate();
        },
        onError: (e) => setErr(errMessage(e)),
        onSettled: () => setUpKind(null),
      });
    } catch (e) { setErr(errMessage(e)); }
  }

  async function openDoc(docId: string) {
    if (!server) return;
    try {
      const { url } = await getDriverDocumentUrl(server.id, docId);
      const L = await import('expo-linking'); L.openURL(url);
    } catch (e) { setErr(errMessage(e)); }
  }

  const top = Platform.OS === 'web' ? 67 : 0;
  const Field = ({ label, k, kb, multiline }: { label: string; k: keyof Form; kb?: 'numeric'; multiline?: boolean }) => (
    <View style={{ gap: 4 }}>
      <Text style={[s.label, { color: c.mutedForeground }]}>{label}</Text>
      <TextInput value={form[k]} onChangeText={set(k)} keyboardType={kb} multiline={multiline}
        placeholderTextColor={c.mutedForeground} style={[s.input, { borderColor: c.input, color: c.text, backgroundColor: c.card, minHeight: multiline ? 72 : undefined }]} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Stack.Screen options={{ headerShown: true, title: 'Tekshiruv', headerStyle: { backgroundColor: c.card }, headerTintColor: c.text }} />
      {q.isLoading ? <ActivityIndicator style={{ marginTop: 60 }} color={c.primary} size="large" /> : q.isError ? (
        <View style={{ padding: 16, marginTop: top }}><ErrorBox message={errMessage(q.error)} onRetry={() => q.refetch()} /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingTop: 16 + top, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
          <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[s.h, { color: c.text }]}>Ariza holati</Text>
              <StatusPill status={server?.status ?? 'none'} />
            </View>
            {server?.status === 'rejected' && !!server.reason && <Text style={{ color: c.destructive, fontFamily: 'Inter_500Medium' }}>Sabab: {server.reason}</Text>}
            {server?.status === 'approved' && <Text style={{ color: c.mutedForeground, fontFamily: 'Inter_400Regular' }}>Transportingiz tasdiqlangan. Ma'lumot o'zgartirilsa, ariza qayta tekshiriladi.</Text>}
            {(!server || server.status === 'none') && <Text style={{ color: c.mutedForeground, fontFamily: 'Inter_400Regular' }}>Real transport va hujjatlar tasdiqlangach, yuklarga taklif bera olasiz.</Text>}
            {!!server?.reviewHistory?.length && server.reviewHistory.slice(-3).reverse().map((h, i) => (
              <Text key={i} style={{ color: c.mutedForeground, fontSize: 12, fontFamily: 'Inter_400Regular' }}>
                Oldingi tekshiruv: {new Date(h.createdAt).toLocaleDateString()} · {STATUS_LABEL[h.status]}{h.reason ? ` · ${h.reason}` : ''}
              </Text>
            ))}
            {hasApp && <Btn tone="ghost" label="Ommaviy profilni ko'rish" icon="eye" onPress={() => router.push(`/driver/${server!.id}` as never)} />}
          </View>

          {stale && (
            <ErrorBox message="Ariza boshqa joyda o'zgargan. Davom etish uchun yangi holatni yuklang (kiritganlaringiz yo'qoladi)." onRetry={reload} />
          )}

          <Text style={[s.h, { color: c.text }]}>Transport</Text>
          <Text style={[s.label, { color: c.mutedForeground }]}>Transport turi</Text>
          <View style={s.chips}>
            {(types.data ?? []).map((t) => (
              <TouchableOpacity key={t.id} onPress={() => { set('vehicleTypeId')(t.id); }}
                style={[s.chip, { borderColor: form.vehicleTypeId === t.id ? c.primary : c.input, backgroundColor: form.vehicleTypeId === t.id ? c.accent : c.card }]}>
                <Text style={{ color: c.text, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>{t.name}</Text>
                <Text style={{ color: c.mutedForeground, fontSize: 11 }}>{t.capacityKg} kg · {t.capacityM3} m³</Text>
              </TouchableOpacity>
            ))}
          </View>
          {types.isError && <ErrorBox message="Transport turlari yuklanmadi" onRetry={() => types.refetch()} />}
          {Field({ label: 'Davlat raqami', k: 'vehiclePlate' })}
          {Field({ label: 'Haqiqiy yuk sig\'imi (kg)', k: 'capacityKg', kb: 'numeric' })}
          {Field({ label: 'Haqiqiy hajm (m³)', k: 'capacityM3', kb: 'numeric' })}
          {Field({ label: 'Hamroh yuk uchun bo\'sh (kg)', k: 'sharedKg', kb: 'numeric' })}
          {Field({ label: 'Hamroh yuk uchun bo\'sh (m³)', k: 'sharedM3', kb: 'numeric' })}
          {Field({ label: 'Bo\'sh bo\'ladigan vaqt (YYYY-MM-DD HH:MM)', k: 'availableFrom' })}
          <Text style={[s.label, { color: c.mutedForeground }]}>Hozirgi hudud</Text>
          <View style={s.chips}>
            {(regions.data ?? []).map((r) => (
              <TouchableOpacity key={r.id} onPress={() => set('regionId')(r.id)}
                style={[s.chip, { borderColor: form.regionId === r.id ? c.primary : c.input, backgroundColor: form.regionId === r.id ? c.accent : c.card }]}>
                <Text style={{ color: c.text, fontFamily: 'Inter_500Medium', fontSize: 13 }}>{r.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {Field({ label: 'Qo\'shimcha ma\'lumot', k: 'bio', multiline: true })}

          {err && <ErrorBox message={err} />}
          {msg && <Text style={{ color: c.statusDelivered, fontFamily: 'Inter_600SemiBold' }}>{msg}</Text>}
          <Btn label={submit.isPending ? 'Yuborilmoqda...' : 'Arizani yuborish'} onPress={onSubmit} disabled={submit.isPending || stale} icon="send" />

          <Text style={[s.h, { color: c.text, marginTop: 8 }]}>Hujjatlar</Text>
          <Text style={{ color: c.mutedForeground, fontSize: 12 }}>Rasmlar shaxsiy saqlanadi va faqat tekshiruvchilarga ko'rinadi. JPEG/PNG, 5 MB gacha.</Text>
          {!hasApp && <Text style={{ color: c.mutedForeground, fontSize: 12 }}>Hujjat yuklashdan oldin arizani yuboring.</Text>}
          {(dirty || stale) && <Text style={{ color: c.mutedForeground, fontSize: 12 }}>Hujjat yuklashdan oldin transport o‘zgarishlarini saqlang yoki arizani qayta yuklang.</Text>}
          {KINDS.map((k) => {
            const d = server?.documents?.find((x) => x.kind === k);
            const busy = upKind === k && upload.isPending;
            return (
              <View key={k} style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <Text style={{ flex: 1, color: c.text, fontFamily: 'Inter_600SemiBold' }}>{KIND_LABEL[k]}</Text>
                  {d ? <StatusPill status={d.status} /> : <Text style={{ color: c.mutedForeground, fontSize: 12 }}>Yuklanmagan</Text>}
                </View>
                {d && <Text style={{ color: c.mutedForeground, fontSize: 12 }}>Yuborilgan: {new Date(d.submittedAt).toLocaleDateString()}</Text>}
                {busy ? <ActivityIndicator color={c.primary} /> : (
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    <Btn tone="ghost" icon="image" label={d ? 'Almashtirish' : 'Galereya'} onPress={() => pick(k, false)} disabled={!hasApp || upload.isPending || dirty || stale || submit.isPending} />
                    {Platform.OS !== 'web' && <Btn tone="ghost" icon="camera" label="Kamera" onPress={() => pick(k, true)} disabled={!hasApp || upload.isPending || dirty || stale || submit.isPending} />}
                    {d && <Btn tone="ghost" icon="external-link" label="Ko'rish" onPress={() => openDoc(d.id)} />}
                  </View>
                )}
              </View>
            );
          })}
          {user?.role !== 'driver' && <Text style={{ color: c.mutedForeground, fontSize: 12 }}>Bu bo'lim haydovchilar uchun.</Text>}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { padding: 14, borderRadius: 16, borderWidth: 1, gap: 10 },
  h: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  label: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontFamily: 'Inter_400Regular', fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
});
