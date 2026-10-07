import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { createOrder, getListing, getGetOrdersQueryKey } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { EmptyState } from '@/components/EmptyState';
import { PurchaseCargoSuggestion, type CargoPurchase } from '@/components/PurchaseCargoSuggestion';

const fmt = (n: number) => n.toLocaleString() + " so'm";

export default function CartScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { user, token } = useAuth();
  const { items, ready, syncing, error, refresh, setQuantity, removeItem, refreshItem } = useCart();
  const account = useRef(user?.id);
  account.current = user?.id;
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [report, setReport] = useState<{ ok: number; failed: string[] } | null>(null);
  const [purchases, setPurchases] = useState<CargoPurchase[]>([]);
  const top = Platform.OS === 'web' ? 67 : insets.top;
  const total = items.reduce((s, i) => s + i.listing.price * i.quantity, 0);
  useFocusEffect(useCallback(() => { void refresh().catch(() => {}); }, [refresh]));
  useEffect(() => { setReport(null); setPurchases([]); }, [user?.id]);
  const disabled = busy || syncing || !ready;

  async function checkout() {
    if (lock.current || disabled || !token || items.length === 0) return;
    const owner = user?.id;
    const options = { headers: { Authorization: `Bearer ${token}` } };
    lock.current = true;
    setBusy(true);
    setReport(null);
    let ok = 0;
    const failed: string[] = [];
    const successful: CargoPurchase[] = [];
    const snapshot = [...items];
    try {
      for (const it of snapshot) {
        if (account.current !== owner) break;
        const name = it.listing.title;
        try {
          const fresh = await getListing(it.listing.id, options);
          if (account.current !== owner) break;
          const status = fresh.status;
          if (fresh.userId === user?.id) { failed.push(`${name}: o'zingizning mahsulotingiz`); continue; }
          if (status && status !== 'active') { failed.push(`${name}: sotuvda yo'q`); continue; }
          if (fresh.price !== it.listing.price) {
            await refreshItem(fresh, it);
            failed.push(`${name}: narx ${fmt(fresh.price)} ga o'zgardi. Yangi jami summani tekshirib, qayta tasdiqlang.`);
            continue;
          }
          const order = await createOrder({
            listingId: it.listing.id,
            quantity: it.quantity,
            clientRequestId: it.requestId,
          }, options);
          if (account.current !== owner) break;
          ok += 1;
          if (order.status === 'pending' || order.status === 'confirmed') successful.push({ orderId: order.id, title: name, quantity: order.quantity, unit: fresh.priceUnit });
          try {
            await removeItem(it.listing.id, it);
          } catch {
            failed.push(`${name}: buyurtma yuborildi, lekin savatchani yangilab bo'lmadi. Buyurtmalarimda ko'ring.`);
          }
        } catch (e) {
          const st = (e as { status?: number }).status;
          failed.push(st === 409
            ? `${name}: mahsulot mavjudligi yoki oldingi so'rov ma'lumotlari o'zgargan. Buyurtmalarimni tekshiring.`
            : `${name}: buyurtma holati tasdiqlanmadi. Buyurtmalarimni tekshiring yoki qayta urinib ko'ring.`);
        }
      }
      await qc.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
    } finally {
      if (account.current === owner) { setReport({ ok, failed }); setPurchases(successful); }
      setBusy(false);
      lock.current = false;
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PurchaseCargoSuggestion purchases={purchases} onClose={() => setPurchases([])} />
      <View style={[styles.header, { paddingTop: top + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Savat</Text>
        <TouchableOpacity disabled={syncing || busy} onPress={() => { void refresh().catch(() => {}); }} testID="refresh-cart">
          <Text style={{ color: colors.primary }}>{syncing ? 'Yangilanmoqda…' : 'Yangilash'}</Text>
        </TouchableOpacity>
      </View>
      {!ready ? (
        <View style={styles.center}>
          {error ? <>
            <Text style={{ color: colors.destructive, textAlign: 'center', padding: 20 }}>{error}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
              <Text style={{ color: colors.primary }}>Buyurtmalarimni tekshirish</Text>
            </TouchableOpacity>
          </> : <ActivityIndicator color={colors.primary} />}
        </View>
      ) : (
        <>
          {error && (
            <View style={[styles.banner, { backgroundColor: colors.destructive + '18' }]}>
              <Text style={{ color: colors.destructive, fontSize: 13 }}>{error}</Text>
            </View>
          )}
          {report && (
            <View style={[styles.banner, { backgroundColor: (report.failed.length ? colors.destructive : colors.primary) + '18' }]}>
              {report.ok > 0 && <Text style={{ color: colors.text, fontSize: 13 }}>{report.ok} ta buyurtma sotuvchiga yuborildi. To'lov ilovada amalga oshirilmaydi.</Text>}
              {report.failed.map((f, i) => (
                <Text key={i} style={{ color: colors.destructive, fontSize: 13 }}>{f}</Text>
              ))}
              {(report.ok > 0 || report.failed.length > 0) && (
                <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
                  <Text style={{ color: colors.primary, fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>Buyurtmalarim</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {items.length === 0 ? (
            <EmptyState icon="shopping-cart" title="Savat bo'sh" subtitle="Yoqqan mahsulotlarni savatga qo'shing" actionLabel="Qidirish" onAction={() => router.push('/(tabs)/search')} />
          ) : (
            <>
              <FlatList
                data={items}
                keyExtractor={(i) => i.requestId}
                contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 24 }}
                renderItem={({ item }) => (
                  <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TouchableOpacity onPress={() => router.push(`/listing/${item.listing.id}`)} style={[styles.img, { backgroundColor: colors.secondary }]}>
                      {item.listing.images?.[0] ? (
                        <Image source={{ uri: item.listing.images[0] }} style={styles.img} />
                      ) : (
                        <Feather name="image" size={22} color={colors.mutedForeground} />
                      )}
                    </TouchableOpacity>
                    <View style={{ flex: 1, gap: 6 }}>
                      <Text numberOfLines={2} style={{ color: colors.text, fontSize: 14, fontFamily: 'Inter_600SemiBold' }}>{item.listing.title}</Text>
                      {items.filter(i => i.listing.id === item.listing.id).length > 1 && (
                        <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Alohida eski xarid so‘rovi. Buyurtmalarimni tekshiring.</Text>
                      )}
                      <Text style={{ color: colors.primary, fontSize: 14, fontFamily: 'Inter_700Bold' }}>{fmt(item.listing.price * item.quantity)}</Text>
                      <View style={styles.qtyRow}>
                        <TouchableOpacity disabled={disabled || item.quantity <= 1} style={[styles.qBtn, { borderColor: colors.border, opacity: item.quantity <= 1 ? 0.4 : 1 }]} onPress={() => { void setQuantity(item.listing.id, item.quantity - 1, item.requestId).catch(() => {}); }}>
                          <Feather name="minus" size={14} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={{ color: colors.text, minWidth: 22, textAlign: 'center', fontFamily: 'Inter_600SemiBold' }}>{item.quantity}</Text>
                        <TouchableOpacity disabled={disabled || item.quantity >= 999} style={[styles.qBtn, { borderColor: colors.border, opacity: item.quantity >= 999 ? 0.4 : 1 }]} onPress={() => { void setQuantity(item.listing.id, Math.min(999, item.quantity + 1), item.requestId).catch(() => {}); }}>
                          <Feather name="plus" size={14} color={colors.text} />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }} />
                        <TouchableOpacity disabled={disabled} onPress={() => { void removeItem(item.listing.id, item).catch(() => {}); }} hitSlop={8}>
                          <Feather name="trash-2" size={18} color={colors.destructive} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              />
              <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Platform.OS === 'web' ? 100 : 96 }]}>
                <View>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Jami</Text>
                  <Text style={{ color: colors.text, fontSize: 18, fontFamily: 'Inter_700Bold' }}>{fmt(total)}</Text>
                </View>
                <TouchableOpacity disabled={disabled} onPress={checkout} testID="checkout" style={[styles.buy, { backgroundColor: colors.primary, opacity: disabled ? 0.7 : 1 }]}>
                  {busy ? <ActivityIndicator color={colors.primaryForeground} /> : (
                    <Text style={{ color: colors.primaryForeground, fontSize: 15, fontFamily: 'Inter_600SemiBold' }}>Buyurtma berish</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  banner: { margin: 16, marginBottom: 0, padding: 12, borderRadius: 12, gap: 4 },
  card: { flexDirection: 'row', gap: 12, padding: 10, borderRadius: 14, borderWidth: 1 },
  img: { width: 84, height: 84, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  buy: { flex: 1, maxWidth: 220, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14 },
});
