import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import {
  ApiError,
  searchProductByPhoto,
  useGetListing,
  type PhotoSearchResult,
} from '@workspace/api-client-react';
import { ListingCard } from '@/components/ListingCard';
import { usePathname } from 'expo-router';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
type Mime = 'image/jpeg' | 'image/png' | 'image/webp';
const ALLOWED: Mime[] = ['image/jpeg', 'image/png', 'image/webp'];

interface Photo { uri: string; data: string; mimeType: Mime }
interface Problem { title: string; text: string; kind: 'retry' | 'failed' | 'plain' | 'auth' }

const newKey = () => `ps${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;

function normalizeMime(raw: string | null | undefined, uri: string): Mime | null {
  let m = (raw ?? '').toLowerCase();
  if (!m) {
    const d = /^data:([^;,]+)/.exec(uri);
    if (d) m = d[1].toLowerCase();
    else {
      const ext = uri.split('?')[0].split('.').pop()?.toLowerCase();
      m = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : '';
    }
  }
  if (m === 'image/jpg') m = 'image/jpeg';
  return (ALLOWED as string[]).includes(m) ? (m as Mime) : null;
}

function encodedMime(base64: string): Mime | null {
  // Native pickers may return JPEG bytes while retaining the original asset's
  // PNG/HEIC metadata. Send the actual encoded type, not that stale metadata.
  if (base64.startsWith('/9j/')) return 'image/jpeg';
  if (base64.startsWith('iVBORw0KGgo')) return 'image/png';
  if (base64.startsWith('UklGR') && base64.slice(11, 16) === 'XRUJQ') return 'image/webp';
  return null;
}

function MatchItem({ id, onOpen }: { id: string; onOpen: () => void }) {
  const colors = useColors();
  const { data, isLoading, isError, refetch } = useGetListing(id);
  if (isLoading) {
    return <View testID={`photo-match-loading-${id}`} style={[styles.skel, { backgroundColor: colors.muted }]} />;
  }
  if (isError || !data) return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={{ color: colors.text }}>Mahsulotni yuklab bo‘lmadi.</Text>
      <TouchableOpacity accessibilityRole="button" onPress={() => { void refetch(); }}>
        <Text style={{ color: colors.primary }}>Qayta yuklash</Text>
      </TouchableOpacity>
    </View>
  );
  if (data.status !== 'active') return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={{ color: colors.text }}>{data.title}: hozir faol sotuvda emas.</Text>
    </View>
  );
  return <View testID={`photo-match-${id}`}><ListingCard listing={data} onOpen={onOpen} /></View>;
}

export function PhotoProductSearch() {
  const pathname = usePathname();
  const colors = useColors();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PhotoSearchResult | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [permIssue, setPermIssue] = useState<{ source: 'camera' | 'library'; canAskAgain: boolean } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const keyRef = useRef<string>(newKey());
  const fileInputRef = useRef<any>(null);
  const selectionVersion = useRef(0);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
  }, []);

  const reset = useCallback(() => {
    selectionVersion.current++;
    abort();
    setPhoto(null);
    setResult(null);
    setProblem(null);
    setPermIssue(null);
    setFileError(null);
    keyRef.current = newKey();
  }, [abort]);

  // Tabs can stay mounted beneath a pushed detail screen. A native Modal must
  // also follow the route, independently of the listing card's press callback.
  useEffect(() => {
    if (pathname !== '/search') {
      reset();
      setOpen(false);
    }
  }, [pathname, reset]);

  // account change -> drop everything
  const lastUser = useRef(userId);
  useEffect(() => {
    if (lastUser.current !== userId) {
      lastUser.current = userId;
      reset();
    }
  }, [userId, reset]);
  useEffect(() => () => abortRef.current?.abort(), []);

  function close() {
    reset();
    setOpen(false);
  }

  function acceptPhoto(uri: string, base64: string | null | undefined) {
    if (!base64) {
      setFileError("Rasmni o'qib bo'lmadi. Boshqa rasm tanlang.");
      return;
    }
    const mime = encodedMime(base64);
    if (!mime) {
      setFileError('Faqat JPEG, PNG yoki WEBP rasm qabul qilinadi. Boshqa formatdagi rasm tanlandi.');
      return;
    }
    const imageBytes = base64.length * 3 / 4 - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
    if (imageBytes > MAX_IMAGE_BYTES) {
      setFileError('Rasm hajmi 2 MB dan oshdi. Kichikroq rasm tanlang.');
      return;
    }
    abort();
    setResult(null);
    setProblem(null);
    setFileError(null);
    keyRef.current = newKey();
    setPhoto({ uri, data: base64, mimeType: mime });
  }

  async function pick(source: 'camera' | 'library') {
    const version = ++selectionVersion.current;
    setPermIssue(null);
    setFileError(null);
    try {
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (version !== selectionVersion.current) return;
        if (!perm.granted) {
          setPermIssue({ source, canAskAgain: perm.canAskAgain });
          return;
        }
      }
      const opts: ImagePicker.ImagePickerOptions = { mediaTypes: 'images', quality: 0.6, base64: true, allowsEditing: false };
      const res = source === 'camera'
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts);
      if (version !== selectionVersion.current) return;
      if (res.canceled || !res.assets?.[0]) return;
      const a = res.assets[0];
      acceptPhoto(a.uri, a.base64);
    } catch {
      if (version === selectionVersion.current) setFileError("Rasm olinmadi. Qayta urinib ko'ring.");
    }
  }

  function onWebFile(e: any) {
    const version = ++selectionVersion.current;
    const f: File | undefined = e?.target?.files?.[0];
    if (e?.target) e.target.value = '';
    if (!f) return;
    const mime = normalizeMime(f.type, f.name);
    if (!mime) {
      setFileError('Faqat JPEG, PNG yoki WEBP rasm qabul qilinadi. Boshqa formatdagi rasm tanlandi.');
      return;
    }
    if (f.size > MAX_IMAGE_BYTES) {
      setFileError('Rasm hajmi 2 MB dan oshdi. Kichikroq rasm tanlang.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (version !== selectionVersion.current) return;
      const s = String(reader.result ?? '');
      const b64 = s.includes(',') ? s.slice(s.indexOf(',') + 1) : '';
      acceptPhoto(s, b64);
    };
    reader.onerror = () => {
      if (version === selectionVersion.current) setFileError("Rasmni o'qib bo'lmadi. Boshqa rasm tanlang.");
    };
    reader.readAsDataURL(f);
  }

  async function submit(freshKey = false) {
    if (!photo || loading) return;
    if (freshKey) keyRef.current = newKey();
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setProblem(null);
    setResult(null);
    try {
      const r = await searchProductByPhoto(
        { data: photo.data, mimeType: photo.mimeType, requestId: keyRef.current },
        { signal: ctrl.signal },
      );
      if (ctrl.signal.aborted || abortRef.current !== ctrl) return;
      setResult(r);
    } catch (e) {
      if (ctrl.signal.aborted || abortRef.current !== ctrl) return;
      const detail = e instanceof ApiError ? e.data as { error?: string; message?: string } | null : null;
      const code = detail?.error;
      const status = e instanceof ApiError ? e.status : 0;
      if (status === 401) {
        setProblem({ kind: 'auth', title: 'Kirish kerak', text: "Rasm bo'yicha qidirish uchun hisobingizga kiring, so'ng qayta urinib ko'ring." });
      } else if (status === 429) {
        setProblem({ kind: 'retry', title: 'AI limiti tugadi', text: detail?.message ?? 'AI uchun ajratilgan limit tugadi. Limit tiklangach qayta urinib ko‘ring.' });
      } else if (code === 'photo_failed') {
        setProblem({ kind: 'failed', title: 'Tahlil amalga oshmadi', text: "Oldingi urinish muvaffaqiyatsiz tugadi. Yangi tahlil boshlash mumkin, bu yangi AI so'rovi hisoblanadi." });
      } else if (code === 'photo_processing') {
        setProblem({ kind: 'retry', title: 'Rasm hali tahlil qilinmoqda', text: "Avvalgi so'rov davom etmoqda. Bir ozdan so'ng qayta tekshiring; yangi so'rov yuborilmaydi." });
      } else if (status === 503) {
        setProblem({ kind: 'retry', title: 'Xizmat vaqtincha ishlamayapti', text: "AI tahlili hozir mavjud emas. Keyinroq qayta urinib ko'ring." });
      } else {
        setProblem({ kind: 'retry', title: "Ulanishda xato", text: "Internet yoki server xatosi. Qayta urinsangiz xuddi shu so'rov takrorlanadi, ikki marta hisoblanmaydi." });
      }
    } finally {
      if (abortRef.current === ctrl) {
        abortRef.current = null;
        setLoading(false);
      }
    }
  }

  const Btn = ({ id, icon, label, onPress, primary, disabled }: { id: string; icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void; primary?: boolean; disabled?: boolean }) => (
    <TouchableOpacity
      testID={id}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.btn,
        primary
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { backgroundColor: colors.card, borderColor: colors.border },
        disabled && { opacity: 0.5 },
      ]}
    >
      <Feather name={icon} size={16} color={primary ? colors.primaryForeground : colors.primary} />
      <Text style={[styles.btnText, { color: primary ? colors.primaryForeground : colors.primary }]}>{label}</Text>
    </TouchableOpacity>
  );

  function renderResult(r: PhotoSearchResult) {
    const ids = r.listingIds ?? [];
    let note: { icon: keyof typeof Feather.glyphMap; title: string; text: string; id: string } | null = null;
    if (!r.recognized) {
      note = { id: 'photo-low-recognition', icon: 'help-circle', title: "Mahsulot aniq tanilmadi", text: "Rasm yetarlicha aniq emas. Mahsulotni yaqinroq, yorug' joyda, bitta o'zini suratga oling. Sotuvchilarga hech narsa yuborilmadi." };
    } else if (r.notificationStatus === 'sent') {
      note = { id: 'photo-notice-sent', icon: 'send', title: "Talab haqida sotuvchilarga xabar yuborildi", text: `${r.notifiedSellerCount} ta sotuvchiga "${r.productName ?? 'mahsulot'}" bo'yicha talab xabari yuborildi. Rasmingiz ularga ko'rsatilmaydi.` };
    } else if (r.notificationStatus === 'already_sent') {
      note = { id: 'photo-notice-already', icon: 'check-circle', title: "Xabar avval yuborilgan", text: "Bu so'rov bo'yicha sotuvchilarga xabar allaqachon yuborilgan. Qayta yuborilmadi." };
    } else if (r.notificationStatus === 'no_sellers') {
      note = { id: 'photo-notice-no-sellers', icon: 'users', title: "Bu toifada sotuvchi topilmadi", text: "Katalogda mos faol e'lon yo'q va bu kategoriyada e'loni bor sotuvchilar hozircha yo'q, shuning uchun xabar yuborilmadi." };
    } else if (ids.length === 0) {
      note = { id: 'photo-no-match', icon: 'search', title: "Katalogda mos e'lon topilmadi", text: "Bu mahsulot hozir katalogda yo'q. Bu uning tugaganini anglatmaydi." };
    }
    return (
      <View style={{ gap: 12 }} testID="photo-result">
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.k, { color: colors.mutedForeground }]}>TANILGAN MAHSULOT</Text>
          <Text testID="photo-product-name" style={[styles.h, { color: colors.text }]}>
            {r.productName ?? "Noma'lum"}
          </Text>
          {r.categoryName ? <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 13 }}>{r.categoryName}</Text> : null}
        </View>

        {ids.length > 0 && (
          <>
            <Text testID="photo-match-count" style={[styles.k, { color: colors.mutedForeground }]}>{ids.length} TA MOS E'LON</Text>
            <View style={styles.grid}>{ids.map((id) => <MatchItem key={id} id={id} onOpen={close} />)}</View>
          </>
        )}

        {r.recognized && ids.length === 0 && (
          <Text testID="photo-no-active" style={[styles.p, { color: colors.mutedForeground }]}>
            Katalogda mos faol e’lon topilmadi. Bu mahsulotning barcha do‘konlarda tugaganini anglatmaydi.
          </Text>
        )}
        {r.unavailableCount > 0 && (
          <View testID="photo-unavailable" style={[styles.card, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Text style={[styles.t, { color: colors.text }]}>{r.unavailableCount} ta mos e'lon hozir mavjud emas</Text>
            <Text style={[styles.p, { color: colors.mutedForeground }]}>Ular pauza qilingan yoki sotilgan, shuning uchun ro'yxatda ko'rsatilmaydi.</Text>
          </View>
        )}

        {note && (
          <View testID={note.id} style={[styles.card, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <View style={styles.row}>
              <Feather name={note.icon} size={16} color={colors.primary} />
              <Text style={[styles.t, { color: colors.text, flex: 1 }]}>{note.title}</Text>
            </View>
            <Text style={[styles.p, { color: colors.mutedForeground }]}>{note.text}</Text>
          </View>
        )}

        <Btn id="photo-new-search" icon="refresh-cw" label="Yangi rasm tanlash" onPress={reset} />
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        testID="photo-search-open"
        accessibilityRole="button"
        accessibilityLabel="Rasm orqali qidirish"
        onPress={() => setOpen(true)}
        style={[styles.trigger, { borderColor: colors.border, backgroundColor: colors.card }]}
      >
        <Feather name="camera" size={16} color={colors.primary} />
        <Text style={[styles.btnText, { color: colors.primary }]}>Rasm orqali qidirish</Text>
      </TouchableOpacity>

      <Modal visible={open && pathname === '/search'} animationType="slide" onRequestClose={close} presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: colors.background }]} testID="photo-search-modal">
          <View style={[styles.mHead, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.h, { color: colors.text, flex: 1 }]}>Rasm orqali qidirish</Text>
            <TouchableOpacity testID="photo-search-close" accessibilityLabel="Yopish" accessibilityRole="button" onPress={close} hitSlop={10}>
              <Feather name="x" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
            {!result && (
              <>
                {photo ? (
                  <View style={[styles.preview, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                    <Image testID="photo-preview" accessibilityLabel="Tanlangan rasm" source={{ uri: photo.uri }} style={styles.previewImg} />
                  </View>
                ) : (
                  <View style={[styles.preview, styles.empty, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                    <Feather name="camera" size={30} color={colors.mutedForeground} />
                    <Text style={[styles.p, { color: colors.mutedForeground, textAlign: 'center' }]}>
                      Mahsulotni suratga oling yoki galereyadan tanlang. Nomini bilishingiz shart emas.
                    </Text>
                  </View>
                )}

                <View style={styles.row}>
                  <View style={{ flex: 1 }}><Btn id="photo-camera" icon="camera" label="Kamera" onPress={() => pick('camera')} disabled={loading} /></View>
                  <View style={{ flex: 1 }}><Btn id="photo-gallery" icon="image" label="Galereya" onPress={() => (Platform.OS === 'web' && fileInputRef.current ? fileInputRef.current.click() : pick('library'))} disabled={loading} /></View>
                </View>

                {Platform.OS === 'web' &&
                  React.createElement('input', {
                    ref: fileInputRef,
                    type: 'file',
                    accept: 'image/jpeg,image/png,image/webp',
                    onChange: onWebFile,
                    'data-testid': 'photo-file-input',
                    'aria-label': 'Rasm faylini tanlang',
                    style: { position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden', pointerEvents: 'none' },
                    tabIndex: -1,
                  })}

                <Text style={[styles.p, { color: colors.mutedForeground }]}>JPEG, PNG yoki WEBP, hajmi 2 MB gacha.</Text>

                {fileError && (
                  <View testID="photo-file-error" accessibilityRole="alert" style={[styles.card, { borderColor: colors.destructive, backgroundColor: colors.card }]}>
                    <Text style={[styles.p, { color: colors.destructive }]}>{fileError}</Text>
                  </View>
                )}

                {permIssue && (
                  <View testID="photo-permission-denied" style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
                    <Text style={[styles.t, { color: colors.text }]}>
                      {permIssue.source === 'camera' ? 'Kameraga ruxsat berilmadi' : 'Galereyaga ruxsat berilmadi'}
                    </Text>
                    <Text style={[styles.p, { color: colors.mutedForeground }]}>Rasm olish uchun ruxsat kerak. Rasm faqat qidiruv uchun ishlatiladi.</Text>
                    <View style={styles.row}>
                      {(permIssue.canAskAgain || Platform.OS === 'web') && (
                        <Btn id="photo-permission-retry" icon="rotate-cw" label="Qayta urinish" onPress={() => pick(permIssue.source)} />
                      )}
                      {!permIssue.canAskAgain && Platform.OS !== 'web' && (
                        <Btn id="photo-open-settings" icon="settings" label="Sozlamalarni ochish" onPress={() => { Linking.openSettings().catch(() => {}); }} />
                      )}
                    </View>
                  </View>
                )}

                {photo && !loading && !problem && (
                  <View testID="photo-explainer" style={[styles.card, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
                    <Text style={[styles.t, { color: colors.text }]}>Yuborishdan oldin</Text>
                    <Text style={[styles.p, { color: colors.mutedForeground }]}>
                      AI rasmni tahlil qilib, katalogdan mos e'lonlarni qidiradi. Agar faol mos e'lon bo'lmasa, shu kategoriyada e'loni bor barcha sotuvchilarga mahsulotga talab haqida xabar yuboriladi.
                    </Text>
                    <Text style={[styles.p, { color: colors.mutedForeground }]}>
                      Rasmingiz serverda saqlanmaydi va sotuvchilarga ko'rsatilmaydi.
                    </Text>
                  </View>
                )}

                {loading && (
                  <View testID="photo-loading" style={[styles.card, styles.row, { borderColor: colors.border, backgroundColor: colors.card }]}>
                    <ActivityIndicator color={colors.primary} />
                    <Text style={[styles.p, { color: colors.text, flex: 1 }]}>Rasm tahlil qilinmoqda...</Text>
                  </View>
                )}

                {problem && (
                  <View testID="photo-error" accessibilityRole="alert" style={[styles.card, { borderColor: colors.destructive, backgroundColor: colors.card }]}>
                    <Text style={[styles.t, { color: colors.text }]}>{problem.title}</Text>
                    <Text style={[styles.p, { color: colors.mutedForeground }]}>{problem.text}</Text>
                    {problem.kind === 'retry' && <Btn id="photo-retry" icon="rotate-cw" label="Qayta urinish" onPress={() => submit(false)} primary />}
                    {problem.kind === 'failed' && <Btn id="photo-new-analysis" icon="zap" label="Yangi tahlil boshlash (yangi AI so'rovi)" onPress={() => submit(true)} primary />}
                  </View>
                )}

                {photo && !problem && (
                  <Btn id="photo-submit" icon="search" label={loading ? 'Tekshirilmoqda...' : 'Rasm bo\'yicha qidirish'} onPress={() => submit(false)} primary disabled={loading} />
                )}
              </>
            )}

            {result && renderResult(result)}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  modal: { flex: 1 },
  mHead: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  h: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  k: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.6 },
  t: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  p: { fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
  btnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  preview: { height: 220, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  previewImg: { width: '100%', height: '100%', resizeMode: 'contain' },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24, borderStyle: 'dashed' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  skel: { width: '47%', height: 180, borderRadius: 14, marginBottom: 12 },
});
