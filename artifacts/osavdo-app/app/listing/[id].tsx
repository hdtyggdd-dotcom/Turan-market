import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import {
  getGetOrdersQueryKey,
  useGetListing,
  createOrder,
  useEstimateDelivery,
} from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useCart } from '@/context/CartContext';
import { useLocation } from '@/context/LocationContext';
import { MarketAnalysisModal } from '@/components/MarketAnalysisModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { submitPurchase } from '@/services/purchase-attempt';
import { PurchaseCargoSuggestion, type CargoPurchase } from '@/components/PurchaseCargoSuggestion';

function formatPrice(price: number): string {
  return price.toLocaleString() + " so'm";
}

function DistancePill({ color, km }: { color: string; km: number }) {
  const bgColors: Record<string, string> = {
    green: '#22C55E',
    yellow: '#F59E0B',
    red: '#EF4444',
  };
  const bg = bgColors[color] ?? '#22C55E';
  return (
    <View style={[styles.distancePill, { backgroundColor: bg + '20', borderColor: bg + '40' }]}>
      <View style={[styles.distanceDot, { backgroundColor: bg }]} />
      <Text style={[styles.distancePillText, { color: bg }]}>{km} km uzoqlikda</Text>
    </View>
  );
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, token, expireSession } = useAuth();
  const session = useRef({ owner: user?.id, token });
  session.current = { owner: user?.id, token };
  const { districtId, lat, lng } = useLocation();
  const queryClient = useQueryClient();
  const { addItem, items: cartItems } = useCart();
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);
  const purchaseLock = useRef(false);
  const [confirmPurchase, setConfirmPurchase] = useState(false);
  const [notice, setNotice] = useState<{ title: string; message: string; cart?: boolean } | null>(null);
  const [purchases, setPurchases] = useState<CargoPurchase[]>([]);
  useEffect(() => { setConfirmPurchase(false); setNotice(null); setPurchases([]); }, [user?.id]);
  const [showAdvice, setShowAdvice] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedDelivery, setSelectedDelivery] = useState<{
    vehicleType: string;
    vehicleName: string;
    price: number;
  } | null>(null);

  const { data: listing, isLoading } = useGetListing(id);

  const deliveryMutation = useEstimateDelivery();

  function handleOrder() {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!listing) return;

    setConfirmPurchase(true);
  }

  async function confirmOrder() {
    if (!listing || !user || !token || purchaseLock.current) return;
    const owner = user.id;
    const capturedToken = token;
    const current = () => session.current.owner === owner && session.current.token === capturedToken;
    purchaseLock.current = true;
    setBuying(true);
    try {
      const result = await submitPurchase(AsyncStorage, owner, {
        listingId: listing.id, quantity,
        ...(selectedDelivery && { deliveryOption: selectedDelivery.vehicleType, deliveryPrice: selectedDelivery.price }),
      }, input => createOrder(input, { headers: { Authorization: `Bearer ${capturedToken}` } }), current);
      if (!current()) return;
      await queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
      if (!current()) return;
      setConfirmPurchase(false);
      if (result.order.status === 'pending' || result.order.status === 'confirmed') {
        setPurchases([{ orderId: result.order.id, title: listing.title, quantity: result.order.quantity, unit: listing.priceUnit }]);
      } else setNotice({ title: 'Buyurtma mavjud', message: 'Bu xarid avval yuborilgan. Buyurtmalarimni tekshiring.' });
    } catch (error) {
      if ((error as { status?: number }).status === 401) await expireSession(capturedToken);
      if (current()) setNotice({ title: 'Xarid tasdiqlanmadi', message: error instanceof Error ? error.message : 'Buyurtmalarimni tekshiring va aynan shu so‘rovni qayta yuboring.' });
    } finally {
      purchaseLock.current = false;
      setBuying(false);
    }
  }

  async function handleAddToCart() {
    if (!user || !token) { router.push('/auth/login'); return; }
    if (!listing || adding) return;
    const owner = user.id, capturedToken = token;
    const current = () => session.current.owner === owner && session.current.token === capturedToken;
    setAdding(true);
    try {
      await addItem(listing, quantity);
      if (!current()) return;
      setNotice({ title: "Savatga qo'shildi", message: listing.title, cart: true });
    } catch (error) {
      if (!current()) return;
      setNotice({ title: 'Xato', message: error instanceof Error ? error.message : "Savatga qo'shib bo'lmadi" });
    } finally {
      setAdding(false);
    }
  }

  function handleEstimateDelivery() {
    if (!listing?.districtId || !districtId) {
      Alert.alert("Joylashuv", "Yetkazib berish narxini hisoblash uchun joylashuvingizni tanlang");
      return;
    }
    deliveryMutation.mutate({
      data: {
        fromDistrictId: listing.districtId,
        toDistrictId: districtId,
        cargoType: listing.categoryId === 'cat1' ? 'livestock' : 'standard',
      },
    });
  }

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>E'lon topilmadi</Text>
      </View>
    );
  }

  const isOwner = user?.id === listing.userId;
   const unavailable = listing.status !== 'active';
  const inCart = cartItems.find((c) => c.listing.id === listing.id)?.quantity ?? 0;
  const sellerBadge = listing.user?.sellerBadge;
  const badgeColor = sellerBadge === 'manufacturer' ? colors.manufacturerBadge : colors.resellerBadge;
  const bottomPad = Platform.OS === 'web' ? 84 + 34 : insets.bottom + 20;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Modal visible={confirmPurchase || !!notice || purchases.length > 0} transparent animationType="fade" onRequestClose={() => {
        if (!buying) { setConfirmPurchase(false); setNotice(null); setPurchases([]); }
      }}>
        {purchases.length > 0 ? <PurchaseCargoSuggestion inline purchases={purchases} onClose={() => setPurchases([])} /> : notice ? (
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialog, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 20 }}>{notice.title}</Text>
            <Text style={{ color: colors.text }}>{notice.message}</Text>
            <TouchableOpacity testID="purchase-notice-action" style={[styles.dialogButton, { backgroundColor: colors.primary }]}
              onPress={() => { const cart = notice.cart; setNotice(null); setConfirmPurchase(false); router.push(cart ? '/(tabs)/cart' : '/(tabs)/orders'); }}>
              <Text style={{ color: colors.primaryForeground }}>{notice.cart ? 'Savatni ochish' : 'Buyurtmalarimni tekshirish'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dialogButton} onPress={() => setNotice(null)}><Text style={{ color: colors.mutedForeground }}>Yopish</Text></TouchableOpacity>
          </View>
        </View>
        ) : (
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialog, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 20 }}>Buyurtmani tasdiqlash</Text>
            <Text style={{ color: colors.text }}>{listing.title}{'\n'}{quantity} {listing.priceUnit} × {formatPrice(listing.price)}</Text>
            {selectedDelivery && <Text style={{ color: colors.mutedForeground }}>Yetkazish hisobi: {selectedDelivery.vehicleName} — {formatPrice(selectedDelivery.price)}</Text>}
            <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold' }}>Jami: {formatPrice(listing.price * quantity + (selectedDelivery?.price ?? 0))}</Text>
            <Text style={{ color: colors.mutedForeground }}>To‘lov ilova ichida amalga oshirilmaydi. Xariddan keyin cargo taklif qilinadi.</Text>
            <TouchableOpacity testID="confirm-purchase" disabled={buying} style={[styles.dialogButton, { backgroundColor: colors.primary }]} onPress={confirmOrder}>
              <Text style={{ color: colors.primaryForeground }}>{buying ? 'Yuborilmoqda…' : 'Tasdiqlash'}</Text>
            </TouchableOpacity>
            <TouchableOpacity disabled={buying} style={styles.dialogButton} onPress={() => setConfirmPurchase(false)}>
              <Text style={{ color: colors.mutedForeground }}>Bekor qilish</Text>
            </TouchableOpacity>
          </View>
        </View>
        )}
      </Modal>
      <MarketAnalysisModal visible={showAdvice} listingId={listing.id} onClose={() => setShowAdvice(false)} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image placeholder */}
        <View style={[styles.imagePlaceholder, { backgroundColor: colors.secondary }]}>
          <Feather name="image" size={48} color={colors.mutedForeground} />
          <Text style={[styles.noImageText, { color: colors.mutedForeground }]}>Rasm yo'q</Text>
        </View>

        <View style={styles.content}>
          {/* Category */}
          <Text style={[styles.category, { color: colors.primary }]}>
            {listing.categoryId}
          </Text>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>{listing.title}</Text>
          {listing.titleRu && (
            <Text style={[styles.titleRu, { color: colors.mutedForeground }]}>{listing.titleRu}</Text>
          )}

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.primary }]}>
              {formatPrice(listing.price)}
            </Text>
            {listing.priceUnit && (
              <Text style={[styles.priceUnit, { color: colors.mutedForeground }]}>
                / {listing.priceUnit}
              </Text>
            )}
          </View>

          {/* Distance */}
          {listing.distanceKm != null && listing.distanceColor && (
            <DistancePill color={listing.distanceColor} km={listing.distanceKm} />
          )}

          {/* Location */}
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <Feather name="map-pin" size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                {[listing.neighborhood?.name, listing.district?.name, listing.region?.name].filter(Boolean).join(', ')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Feather name="eye" size={16} color={colors.mutedForeground} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                {listing.viewCount} ta ko'rish
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Feather name="calendar" size={16} color={colors.mutedForeground} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                {new Date(listing.createdAt).toLocaleDateString('uz-Latn')}
              </Text>
            </View>
          </View>

          {/* Seller */}
          {listing.user && (
            <View style={[styles.sellerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.sellerAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.sellerAvatarText}>
                  {listing.user.name?.charAt(0).toUpperCase() ?? '?'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sellerName, { color: colors.text }]}>{listing.user.name}</Text>
                {sellerBadge && (
                  <View style={[styles.sellerBadge, { backgroundColor: badgeColor + '20' }]}>
                    <Text style={[styles.sellerBadgeText, { color: badgeColor }]}>
                      {sellerBadge === 'manufacturer' ? '✅ Ishlab chiqaruvchi' : '✔️ Sotuvchi'}
                    </Text>
                  </View>
                )}
                {listing.user.rating && (
                  <Text style={[styles.sellerRating, { color: colors.mutedForeground }]}>
                    ⭐ {listing.user.rating} reyting
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Description */}
          {listing.description && (
            <View style={[styles.descCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.descTitle, { color: colors.text }]}>Tavsif</Text>
              <Text style={[styles.descText, { color: colors.mutedForeground }]}>
                {listing.description}
              </Text>
            </View>
          )}

          {/* Delivery estimate */}
          {isOwner && (
            <TouchableOpacity
              testID="open-ai-advice"
              onPress={() => setShowAdvice(true)}
              style={[styles.deliveryBtn, { borderColor: colors.primary, backgroundColor: colors.secondary }]}
            >
              <Feather name="zap" size={18} color={colors.primary} />
              <Text style={[styles.deliveryBtnText, { color: colors.primary }]}>AI maslahat</Text>
            </TouchableOpacity>
          )}
          {!isOwner && (
            <TouchableOpacity
              style={[styles.deliveryBtn, { borderColor: colors.border, backgroundColor: colors.secondary }]}
              onPress={handleEstimateDelivery}
            >
              <Feather name="truck" size={16} color={colors.primary} />
              <Text style={[styles.deliveryBtnText, { color: colors.primary }]}>
                {deliveryMutation.isPending ? "Hisoblanmoqda..." : "Yetkazib berish narxini bilish"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Delivery result — selectable options */}
          {deliveryMutation.data && (
            <View style={[styles.deliveryResult, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.deliveryTitle, { color: colors.text }]}>
                🚚 Yetkazib berish ({deliveryMutation.data.distanceKm} km) — birini tanlang
              </Text>
              {/* "O'zim olib ketaman" option */}
              <TouchableOpacity
                style={[
                  styles.deliveryOptionRow,
                  {
                    borderColor: selectedDelivery === null ? colors.primary : colors.border,
                    backgroundColor: selectedDelivery === null ? colors.primary + '12' : 'transparent',
                  },
                ]}
                onPress={() => setSelectedDelivery(null)}
              >
                <View style={styles.deliveryOptionLeft}>
                  <Text style={[styles.deliveryVehicle, { color: colors.text }]}>🚶 O'zim olib ketaman</Text>
                  <Text style={[styles.deliveryVehicleSub, { color: colors.mutedForeground }]}>Yetkazib berish kerak emas</Text>
                </View>
                <View style={styles.deliveryOptionRight}>
                  <Text style={[styles.deliveryPrice, { color: colors.primary }]}>Bepul</Text>
                  {selectedDelivery === null && (
                    <Feather name="check-circle" size={18} color={colors.primary} />
                  )}
                </View>
              </TouchableOpacity>
              {deliveryMutation.data.options.map((opt) => {
                const isSelected = selectedDelivery?.vehicleType === opt.vehicleType;
                return (
                  <TouchableOpacity
                    key={opt.vehicleType}
                    style={[
                      styles.deliveryOptionRow,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.primary + '12' : 'transparent',
                      },
                    ]}
                    onPress={() => setSelectedDelivery({ vehicleType: opt.vehicleType, vehicleName: opt.vehicleName, price: opt.price })}
                  >
                    <View style={styles.deliveryOptionLeft}>
                      <Text style={[styles.deliveryVehicle, { color: colors.text }]}>{opt.vehicleName}</Text>
                    </View>
                    <View style={styles.deliveryOptionRight}>
                      <Text style={[styles.deliveryPrice, { color: colors.primary }]}>{formatPrice(opt.price)}</Text>
                      {isSelected && <Feather name="check-circle" size={18} color={colors.primary} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom action */}
      {!isOwner && (
        <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomPad }]}>
          {/* Quantity */}
          <View style={styles.quantityRow}>
            <TouchableOpacity
              style={[styles.quantityBtn, { borderColor: colors.border }]}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Feather name="minus" size={16} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.quantityText, { color: colors.text }]}>{quantity}</Text>
            <TouchableOpacity
              style={[styles.quantityBtn, { borderColor: colors.border }]}
              onPress={() => setQuantity(Math.min(999, quantity + 1))}
            >
              <Feather name="plus" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            testID="add-to-cart"
            style={[styles.cartBtn, { borderColor: colors.primary, opacity: unavailable || adding ? 0.5 : 1 }]}
            onPress={handleAddToCart}
            disabled={unavailable || adding}
          >
            <Feather name="shopping-cart" size={18} color={colors.primary} />
            {inCart > 0 && <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 12 }}>{inCart}</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.orderBtn, { backgroundColor: colors.primary, opacity: buying || unavailable ? 0.6 : 1 }]}
            onPress={handleOrder}
            disabled={buying || unavailable}
          >
            {buying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.orderBtnText}>{unavailable ? 'Sotuvda yo\'q' : 'Sotib olish'}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dialogOverlay: { flex: 1, backgroundColor: '#0008', alignItems: 'center', justifyContent: 'center', padding: 20 },
  dialog: { width: '100%', maxWidth: 440, borderRadius: 20, padding: 20, gap: 16 },
  dialogButton: { padding: 12, borderRadius: 12, alignItems: 'center' },
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imagePlaceholder: {
    width: '100%',
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  noImageText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  content: { padding: 16, gap: 14 },
  category: { fontSize: 12, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', lineHeight: 30 },
  titleRu: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: -8 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  price: { fontSize: 26, fontFamily: 'Inter_700Bold' },
  priceUnit: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
  },
  distanceDot: { width: 8, height: 8, borderRadius: 4 },
  distancePillText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  infoCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { fontSize: 14, fontFamily: 'Inter_400Regular', flex: 1 },
  sellerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  sellerAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sellerAvatarText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  sellerName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  sellerBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 3 },
  sellerBadgeText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  sellerRating: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  descCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  descTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  descText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  deliveryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 14, borderWidth: 1 },
  deliveryBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  deliveryResult: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  deliveryTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  deliveryOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  deliveryOptionLeft: { flex: 1, gap: 2 },
  deliveryOptionRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deliveryVehicle: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  deliveryVehicleSub: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  deliveryPrice: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quantityBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  quantityText: { fontSize: 18, fontFamily: 'Inter_600SemiBold', minWidth: 24, textAlign: 'center' },
  cartBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 48, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1.5 },
  orderBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  orderBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
