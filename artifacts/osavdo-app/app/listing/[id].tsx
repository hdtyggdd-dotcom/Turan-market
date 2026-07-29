import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useGetListing, useCreateOrder, useEstimateDelivery } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from '@/context/LocationContext';

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
  const { user } = useAuth();
  const { districtId, lat, lng } = useLocation();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [selectedDelivery, setSelectedDelivery] = useState<{
    vehicleType: string;
    vehicleName: string;
    price: number;
  } | null>(null);

  const { data: listing, isLoading } = useGetListing(id);

  const deliveryMutation = useEstimateDelivery();
  const orderMutation = useCreateOrder({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['getOrders'] });
        Alert.alert("Buyurtma qabul qilindi!", "Sotuvchi tez orada siz bilan bog'lanadi.", [
          { text: "OK", onPress: () => router.push('/(tabs)/orders') },
        ]);
      },
      onError: () => Alert.alert("Xato", "Buyurtma berishda xato yuz berdi"),
    },
  });

  function handleOrder() {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!listing) return;

    const goodsTotal = listing.price * quantity;
    const deliveryTotal = selectedDelivery ? selectedDelivery.price : 0;
    const grandTotal = goodsTotal + deliveryTotal;

    const deliveryLine = selectedDelivery
      ? `\nYetkazib berish (${selectedDelivery.vehicleName}): ${formatPrice(selectedDelivery.price)}`
      : '\nYetkazib berish: tanlanmagan';

    Alert.alert(
      "Buyurtma berish",
      `${quantity} ta × ${formatPrice(listing.price)} = ${formatPrice(goodsTotal)}${deliveryLine}\n\nJami: ${formatPrice(grandTotal)}`,
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: "Tasdiqlash",
          onPress: () => {
            orderMutation.mutate({
              data: {
                listingId: listing.id,
                quantity,
                ...(selectedDelivery && {
                  deliveryOption: selectedDelivery.vehicleType,
                  deliveryPrice: selectedDelivery.price,
                }),
              },
            });
          },
        },
      ],
    );
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
  const sellerBadge = listing.user?.sellerBadge;
  const badgeColor = sellerBadge === 'manufacturer' ? colors.manufacturerBadge : colors.resellerBadge;
  const bottomPad = Platform.OS === 'web' ? 84 + 34 : insets.bottom + 20;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
              onPress={() => setQuantity(quantity + 1)}
            >
              <Feather name="plus" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.orderBtn, { backgroundColor: colors.primary, opacity: orderMutation.isPending ? 0.7 : 1 }]}
            onPress={handleOrder}
            disabled={orderMutation.isPending}
          >
            {orderMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="shopping-cart" size={18} color="#fff" />
                <Text style={styles.orderBtnText}>Buyurtma berish</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  orderBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  orderBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
