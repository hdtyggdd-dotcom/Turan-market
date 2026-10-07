import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import {
  useGetCargoLoad,
  useCreateCargoOffer,
  useAcceptCargoOffer,
  useCounterCargoOffer,
  useRespondCargoCounter,
  useGetDistricts,
  useGetRegions,
  useGetMyDriverVerification,
  getGetMyDriverVerificationQueryKey,
  getGetDistrictsQueryKey,
  CargoLoadStatus,
  CargoOfferStatus,
} from '@workspace/api-client-react';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { RateDriver } from '@/components/cargo/RateDriver';
import { CargoTrackingCard } from '@/components/cargo/CargoTrackingCard';
import { useQueryClient } from '@tanstack/react-query';
import { getGetCargoLoadQueryKey } from '@workspace/api-client-react';

const typeLabels: Record<string, string> = {
  general: 'Oddiy yuk',
  fragile: "Mo'rt yuk",
  perishable: 'Aynuvchan yuk',
  livestock: 'Chorva',
  hazardous: 'Xavfli yuk',
  construction: 'Qurilish mollari',
};

const statusLabels: Record<string, string> = {
  [CargoLoadStatus.open]: 'Ochiq',
  [CargoLoadStatus.negotiating]: 'Kelishilmoqda',
  [CargoLoadStatus.accepted]: 'Qabul qilingan',
  [CargoLoadStatus.in_transit]: "Yo'lda",
  [CargoLoadStatus.delivered]: 'Yetkazildi',
  [CargoLoadStatus.cancelled]: 'Bekor qilingan',
};

export default function CargoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: driverApplication } = useGetMyDriverVerification({ query: {
    queryKey: getGetMyDriverVerificationQueryKey(), enabled: user?.role === 'driver', refetchInterval: 15_000,
  } });

  const { data: load, isLoading } = useGetCargoLoad(id!, {
    query: { enabled: !!id, queryKey: getGetCargoLoadQueryKey(id!), refetchInterval: 10_000 },
  });
  const { data: regions } = useGetRegions();
  const { data: pickupDistricts } = useGetDistricts(
    { regionId: load?.pickupRegionId },
    {
      query: {
        enabled: !!load?.pickupRegionId,
        queryKey: getGetDistrictsQueryKey({ regionId: load?.pickupRegionId }),
      },
    },
  );
  const { data: deliveryDistricts } = useGetDistricts(
    { regionId: load?.deliveryRegionId },
    {
      query: {
        enabled: !!load?.deliveryRegionId,
        queryKey: getGetDistrictsQueryKey({ regionId: load?.deliveryRegionId }),
      },
    },
  );

  const createOffer = useCreateCargoOffer();
  const acceptOffer = useAcceptCargoOffer();
  const counterOffer = useCounterCargoOffer();
  const respondCounter = useRespondCargoCounter();

  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  
  const [counterId, setCounterId] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterMessage, setCounterMessage] = useState('');

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Yuk tafsilotlari', headerTransparent: true }} />
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!load) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Yuk topilmadi' }} />
        <Text style={{ color: colors.mutedForeground }}>Yuk topilmadi yoki o'chirilgan.</Text>
      </View>
    );
  }

  const isShipper = user?.id === load.shipperId;
  const isDriver = user?.role === 'driver';
  const isVerifiedDriver =
    isDriver && driverApplication?.status === 'approved' &&
    ['identity', 'license', 'registration'].every(kind =>
      driverApplication.documents.some(doc => doc.kind === kind && doc.status === 'approved'));
  const canNegotiate =
    load.status === CargoLoadStatus.open ||
    load.status === CargoLoadStatus.negotiating;
  const hasActiveDriverOffer = load.offers?.some(
    (offer) =>
      offer.status === CargoOfferStatus.pending ||
      offer.status === CargoOfferStatus.countered ||
      offer.status === CargoOfferStatus.accepted,
  );
  const isAssignedDriver = load.offers?.some(
    (offer) =>
      offer.status === CargoOfferStatus.accepted &&
      offer.driver?.user?.id === user?.id,
  );
  const pickupRegionName =
    regions?.find((region) => region.id === load.pickupRegionId)?.name ??
    load.pickupRegionId;
  const pickupDistrictName =
    pickupDistricts?.find((district) => district.id === load.pickupDistrictId)?.name ??
    load.pickupDistrictId;
  const deliveryRegionName =
    regions?.find((region) => region.id === load.deliveryRegionId)?.name ??
    load.deliveryRegionId;
  const deliveryDistrictName =
    deliveryDistricts?.find((district) => district.id === load.deliveryDistrictId)?.name ??
    load.deliveryDistrictId;
  
  const handleCreateOffer = () => {
    if (!offerAmount) {
      Alert.alert("Xato", "Narxni kiriting");
      return;
    }
    createOffer.mutate({
      id: load.id,
      data: {
        amountUzs: Number(offerAmount),
        message: offerMessage || undefined,
      }
    }, {
      onSuccess: () => {
        Alert.alert("Muvaffaqiyatli", "Taklifingiz yuborildi!");
        setOfferAmount('');
        setOfferMessage('');
        queryClient.invalidateQueries({ queryKey: getGetCargoLoadQueryKey(load.id) });
      },
      onError: (err: any) => Alert.alert("Xato", err.message)
    });
  };

  const handleAcceptOffer = (offerId: string) => {
    Alert.alert("Tasdiqlash", "Taklifni qabul qilasizmi?", [
      { text: "Yo'q", style: "cancel" },
      { text: "Ha", onPress: () => {
        acceptOffer.mutate({ id: load.id, offerId }, {
          onSuccess: () => {
            Alert.alert("Muvaffaqiyatli", "Taklif qabul qilindi!");
            queryClient.invalidateQueries({ queryKey: getGetCargoLoadQueryKey(load.id) });
          },
          onError: (err: any) => Alert.alert("Xato", err.message)
        });
      }}
    ]);
  };

  const submitCounterOffer = (offerId: string) => {
    if (!counterAmount) return;
    counterOffer.mutate({
      id: load.id,
      offerId,
      data: { amountUzs: Number(counterAmount), message: counterMessage || undefined }
    }, {
      onSuccess: () => {
        Alert.alert("Muvaffaqiyatli", "Qarshi taklif yuborildi!");
        setCounterId(null);
        setCounterAmount('');
        setCounterMessage('');
        queryClient.invalidateQueries({ queryKey: getGetCargoLoadQueryKey(load.id) });
      },
      onError: (err: any) => Alert.alert("Xato", err.message)
    });
  };

  const handleCounterDecision = (offerId: string, accepted: boolean) => {
    Alert.alert(
      accepted ? 'Qarshi taklifni qabul qilish' : 'Qarshi taklifni rad etish',
      accepted
        ? "Yuk egasining narxiga rozimisiz?"
        : "Bu qarshi taklifni rad etasizmi?",
      [
        { text: "Yo'q", style: 'cancel' },
        {
          text: accepted ? 'Roziman' : 'Rad etish',
          style: accepted ? 'default' : 'destructive',
          onPress: () => {
            respondCounter.mutate(
              { id: load.id, offerId, data: { accepted } },
              {
                onSuccess: () => {
                  Alert.alert(
                    'Muvaffaqiyatli',
                    accepted
                      ? 'Kelishilgan narx yuk egasiga yuborildi.'
                      : 'Qarshi taklif rad etildi.',
                  );
                  queryClient.invalidateQueries({
                    queryKey: getGetCargoLoadQueryKey(load.id),
                  });
                },
                onError: (err: any) => Alert.alert('Xato', err.message),
              },
            );
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Yuk tafsilotlari',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: true,
        }}
      />
      
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[styles.content, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 20 }]}
        bottomOffset={40}
        keyboardShouldPersistTaps="handled"
      >
        {/* Main Info */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.text }]}>{load.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.statusText, { color: colors.primary }]}>{statusLabels[load.status] || load.status}</Text>
            </View>
          </View>
          
          <Text style={[styles.date, { color: colors.mutedForeground }]}>
            Jo'nash sanasi: {new Date(load.pickupDate).toLocaleDateString('uz-UZ')}
          </Text>

          {load.description && (
            <Text style={[styles.desc, { color: colors.text }]}>{load.description}</Text>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.routeContainer}>
            <View style={styles.routeItem}>
              <View style={[styles.dot, { backgroundColor: colors.statusConfirmed }]} />
              <View style={styles.routeTextContainer}>
                <Text style={[styles.routeLabel, { color: colors.mutedForeground }]}>Qayerdan</Text>
                <Text style={[styles.routeValue, { color: colors.text }]}>
                  {pickupRegionName}, {pickupDistrictName}
                </Text>
                {load.pickupAddress && (
                  <Text style={[styles.routeAddress, { color: colors.mutedForeground }]}>
                    {load.pickupAddress}
                  </Text>
                )}
              </View>
            </View>
            <View style={[styles.routeLine, { borderLeftColor: colors.border }]} />
            <View style={styles.routeItem}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <View style={styles.routeTextContainer}>
                <Text style={[styles.routeLabel, { color: colors.mutedForeground }]}>Qayerga</Text>
                <Text style={[styles.routeValue, { color: colors.text }]}>
                  {deliveryRegionName}, {deliveryDistrictName}
                </Text>
                {load.deliveryAddress && (
                  <Text style={[styles.routeAddress, { color: colors.mutedForeground }]}>
                    {load.deliveryAddress}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Turi</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{typeLabels[load.cargoType] || load.cargoType}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Og'irlik</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{load.weightKg} kg</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Hajm</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{load.volumeM3} m³</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Budjet</Text>
              <Text style={[styles.detailValue, { color: colors.primary }]}>
                {load.budgetUzs ? `${load.budgetUzs.toLocaleString()} so'm` : 'Kelishiladi'}
              </Text>
            </View>
          </View>
        </View>

        <CargoTrackingCard
          loadId={load.id}
          canUpdate={Boolean(isAssignedDriver)}
        />

        {isShipper && load.status === CargoLoadStatus.delivered && (
          <RateDriver
            loadId={load.id}
            driverId={load.offers?.find((o) => o.status === CargoOfferStatus.accepted)?.driverId}
          />
        )}

        {/* Recommendation */}
        {load.recommendation && (
          <View style={[styles.recommendationCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <View style={styles.recHeader}>
              <Feather name="info" size={18} color={colors.primary} />
              <Text style={[styles.recTitle, { color: colors.primary }]}>Tavsiya etilgan transport</Text>
            </View>
            <Text style={[styles.recVehicle, { color: colors.text }]}>{load.recommendation.vehicleType.name}</Text>
            <Text style={[styles.recReason, { color: colors.mutedForeground }]}>{load.recommendation.reason}</Text>
          </View>
        )}

        {/* Offers */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Takliflar ({load.offers?.length || 0})</Text>
        
        {load.offers?.map((offer) => (
          <View key={offer.id} style={[styles.offerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.offerHeader}>
              <TouchableOpacity 
                style={styles.driverInfo}
                onPress={() => router.push(`/driver/${offer.driverId}`)}
              >
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>{offer.driver.user.name.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={[styles.driverName, { color: colors.text }]}>{offer.driver.user.name}</Text>
                  <Text style={[styles.driverVehicle, { color: colors.mutedForeground }]}>{offer.driver.vehicleType.name}</Text>
                </View>
              </TouchableOpacity>
              <Text style={[styles.offerAmount, { color: colors.text }]}>{offer.amountUzs.toLocaleString()} so'm</Text>
            </View>
            
            {offer.message && (
              <Text style={[styles.offerMessage, { color: colors.mutedForeground }]}>{offer.message}</Text>
            )}
            
            {offer.counterAmountUzs && (
              <View style={[styles.counterBox, { backgroundColor: colors.muted }]}>
                <Text style={[styles.counterTitle, { color: colors.text }]}>Qarshi taklif:</Text>
                <Text style={[styles.counterAmount, { color: colors.primary }]}>{offer.counterAmountUzs.toLocaleString()} so'm</Text>
                {offer.counterMessage && <Text style={[styles.counterMsg, { color: colors.mutedForeground }]}>{offer.counterMessage}</Text>}
              </View>
            )}

            {isShipper &&
              canNegotiate &&
              offer.status === CargoOfferStatus.pending && (
              <View style={styles.actionsRow}>
                <TouchableOpacity 
                  style={[styles.actionBtn, { borderColor: colors.primary }]}
                  onPress={() => setCounterId(offer.id)}
                >
                  <Text style={[styles.actionBtnText, { color: colors.primary }]}>Qarshi taklif</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.actionBtnPrimary, { backgroundColor: colors.primary }]}
                  onPress={() => handleAcceptOffer(offer.id)}
                  disabled={acceptOffer.isPending}
                >
                  <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>Qabul qilish</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {isShipper &&
              canNegotiate &&
              counterId === offer.id &&
              offer.status === CargoOfferStatus.pending && (
              <View style={[styles.counterForm, { borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                  placeholder="Summa (so'm)"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  value={counterAmount}
                  onChangeText={setCounterAmount}
                />
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text, marginTop: 8 }]}
                  placeholder="Xabar (ixtiyoriy)"
                  placeholderTextColor={colors.mutedForeground}
                  value={counterMessage}
                  onChangeText={setCounterMessage}
                />
                <View style={[styles.actionsRow, { marginTop: 12 }]}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { borderColor: colors.border }]}
                    onPress={() => setCounterId(null)}
                  >
                    <Text style={[styles.actionBtnText, { color: colors.mutedForeground }]}>Bekor qilish</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.actionBtnPrimary, { backgroundColor: colors.primary }]}
                    onPress={() => submitCounterOffer(offer.id)}
                    disabled={counterOffer.isPending}
                  >
                    <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>Yuborish</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {isDriver &&
              canNegotiate &&
              offer.status === CargoOfferStatus.countered && (
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: colors.border }]}
                    onPress={() => handleCounterDecision(offer.id, false)}
                    disabled={respondCounter.isPending}
                  >
                    <Text style={[styles.actionBtnText, { color: colors.mutedForeground }]}>
                      Rad etish
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      styles.actionBtnPrimary,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={() => handleCounterDecision(offer.id, true)}
                    disabled={respondCounter.isPending}
                  >
                    <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>
                      Qarshi narxga roziman
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
          </View>
        ))}
        
        {load.offers?.length === 0 && (
          <Text style={[styles.emptyOffers, { color: colors.mutedForeground }]}>
            Hozircha takliflar yo'q
          </Text>
        )}

        {/* Driver Offer Form */}
        {isDriver && !isShipper && !isVerifiedDriver && canNegotiate && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
            <View style={styles.recHeader}>
              <Feather name="shield" size={18} color={colors.statusPending} />
              <Text style={[styles.recTitle, { color: colors.statusPending }]}>
                Haydovchi tekshiruvi kutilmoqda
              </Text>
            </View>
            <Text style={[styles.recReason, { color: colors.mutedForeground }]}>
              Shaxs va transport hujjatlari tasdiqlangach, yuklarga narx taklifi bera olasiz.
            </Text>
          </View>
        )}

        {isVerifiedDriver && !isShipper && canNegotiate && !hasActiveDriverOffer && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 0 }]}>Taklif qoldirish</Text>
            
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background, marginTop: 12 }]}
              placeholder="Taklif summasi (so'm)"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              value={offerAmount}
              onChangeText={setOfferAmount}
            />
            
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background, marginTop: 12 }]}
              placeholder="Xabar (ixtiyoriy)"
              placeholderTextColor={colors.mutedForeground}
              value={offerMessage}
              onChangeText={setOfferMessage}
            />
            
            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: colors.primary, marginTop: 16 }]}
              onPress={handleCreateOffer}
              disabled={createOffer.isPending}
            >
              <Text style={[styles.submitBtnText, { color: colors.primaryForeground }]}>
                {createOffer.isPending ? "Yuborilmoqda..." : "Taklifni yuborish"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 16 },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'capitalize',
  },
  date: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 6,
  },
  desc: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    marginTop: 12,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  routeContainer: {
    gap: 12,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeLine: {
    position: 'absolute',
    left: 20,
    top: 24,
    bottom: -12,
    width: 2,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    zIndex: -1,
  },
  routeTextContainer: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  routeValue: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 2,
  },
  routeAddress: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
    marginTop: 4,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    width: '45%',
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  detailValue: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 4,
  },
  recommendationCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  recTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  recVehicle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  recReason: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginTop: 8,
  },
  offerCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  driverName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  driverVehicle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  offerAmount: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  offerMessage: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 12,
    fontStyle: 'italic',
  },
  counterBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  counterTitle: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  counterAmount: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 4,
  },
  counterMsg: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionBtnPrimary: {
    borderWidth: 0,
  },
  actionBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  counterForm: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  emptyOffers: {
    textAlign: 'center',
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    paddingVertical: 20,
  },
  submitBtn: {
    height: 48,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
