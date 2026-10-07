import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useLocation } from '@/context/LocationContext';
import { useAuth } from '@/context/AuthContext';
import {
  useCreateCargoLoad,
  CargoLoadInputCargoType,
  useRecommendCargoTransport,
  useGetRegions,
  useGetDistricts,
  getGetDistrictsQueryKey,
  TransportRecommendation,
  useGetOrder,
  getGetOrderQueryKey,
} from '@workspace/api-client-react';

const cargoTypeLabels: Record<string, string> = {
  general: 'Oddiy yuk',
  fragile: "Mo'rt yuk",
  perishable: 'Aynuvchan yuk',
  livestock: 'Chorva',
  hazardous: 'Xavfli yuk',
  construction: 'Qurilish mollari',
};

export default function CreateCargoLoadScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { countryId, regionId, districtId } = useLocation();
  const { user, token } = useAuth();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const sourceId = typeof params.orderId === 'string' ? params.orderId : '';
  const { data: sourceOrder, isLoading: sourceLoading, isError: sourceError } = useGetOrder(sourceId, {
    query: { enabled: !!sourceId && !!token, queryKey: [...getGetOrderQueryKey(sourceId), user?.id] },
    request: { headers: { Authorization: `Bearer ${token}` } },
  });
  const sourceAllowed = !sourceId || (sourceOrder?.buyerId === user?.id && ['pending', 'confirmed'].includes(sourceOrder?.status ?? ''));
  const applied = useRef('');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cargoType, setCargoType] = useState<CargoLoadInputCargoType>(CargoLoadInputCargoType.general);
  const [weightKg, setWeightKg] = useState('');
  const [volumeM3, setVolumeM3] = useState('');
  const [lengthCm, setLengthCm] = useState('');
  const [widthCm, setWidthCm] = useState('');
  const [heightCm, setHeightCm] = useState('');

  const [pickupRegionId, setPickupRegionId] = useState('');
  const [pickupDistrictId, setPickupDistrictId] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');

  const [deliveryRegionId, setDeliveryRegionId] = useState('');
  const [deliveryDistrictId, setDeliveryDistrictId] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  
  const [pickupDate, setPickupDate] = useState('');
  const [budgetUzs, setBudgetUzs] = useState('');
  const [sharedLoadAllowed, setSharedLoadAllowed] = useState(false);

  const { data: regions } = useGetRegions({ countryId: countryId || 'uz' });
  const { data: pickupDistricts } = useGetDistricts(
    { regionId: pickupRegionId || undefined },
    { query: { enabled: !!pickupRegionId, queryKey: getGetDistrictsQueryKey({ regionId: pickupRegionId || undefined }) } }
  );
  const { data: deliveryDistricts } = useGetDistricts(
    { regionId: deliveryRegionId || undefined },
    { query: { enabled: !!deliveryRegionId, queryKey: getGetDistrictsQueryKey({ regionId: deliveryRegionId || undefined }) } }
  );

  const createLoad = useCreateCargoLoad();
  const recommendTransport = useRecommendCargoTransport();
  const [recommendation, setRecommendation] = useState<TransportRecommendation | null>(null);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  useEffect(() => {
    if (!sourceId || !sourceOrder || !user || !sourceAllowed || applied.current === `${user.id}:${sourceId}`) return;
    applied.current = `${user.id}:${sourceId}`;
    setTitle(`${sourceOrder.listing?.title ?? 'Xarid qilingan tovar'} — ${sourceOrder.quantity} ${sourceOrder.listing?.priceUnit || 'birlik'}`);
    if (sourceOrder.listing?.categoryId === 'cat1') setCargoType(CargoLoadInputCargoType.livestock);
    setPickupRegionId(sourceOrder.listing?.regionId ?? '');
    setPickupDistrictId(sourceOrder.listing?.districtId ?? '');
    setDeliveryRegionId(regionId ?? '');
    setDeliveryDistrictId(districtId ?? '');
    // Never invent mass/volume, exact seller addresses, budget, or a departure date.
  }, [sourceId, sourceOrder, user?.id, sourceAllowed, regionId, districtId]);
  useEffect(() => {
    if (!sourceId || !sourceAllowed || !token) return;
    const weight = Number(weightKg), volume = Number(volumeM3);
    if (!Number.isFinite(weight) || !Number.isFinite(volume) || weight <= 0 || volume <= 0) {
      setRecommendation(null); return;
    }
    let active = true;
    setRecommendation(null);
    setRecommendationError(null);
    const timer = setTimeout(() => recommendTransport.mutate({ data: {
      cargoType, weightKg: weight, volumeM3: volume,
      lengthCm: lengthCm ? Number(lengthCm) : undefined,
      widthCm: widthCm ? Number(widthCm) : undefined,
      heightCm: heightCm ? Number(heightCm) : undefined,
    } }, {
      onSuccess: data => { if (active) setRecommendation(data); },
      onError: () => { if (active) setRecommendationError('Transport tavsiyasi olinmadi. O‘lchamlar va internetni tekshiring yoki qayta tavsiya oling.'); },
    }), 600);
    return () => { active = false; clearTimeout(timer); };
  }, [sourceId, sourceAllowed, token, cargoType, weightKg, volumeM3, lengthCm, widthCm, heightCm]);

  const handleRecommend = () => {
    if (!weightKg || !volumeM3) {
      Alert.alert("Xato", "Og'irlik va hajmni kiriting");
      return;
    }
    recommendTransport.mutate({
      data: {
        cargoType,
        weightKg: Number(weightKg),
        volumeM3: Number(volumeM3),
        lengthCm: lengthCm ? Number(lengthCm) : undefined,
        widthCm: widthCm ? Number(widthCm) : undefined,
        heightCm: heightCm ? Number(heightCm) : undefined,
      }
    }, {
      onSuccess: (data) => setRecommendation(data),
      onError: (err: any) => Alert.alert("Xato", err.message)
    });
  };

  const handleSave = () => {
    if (!sourceAllowed) return;
    if (!title || !weightKg || !volumeM3 || !pickupRegionId || !pickupDistrictId || !deliveryRegionId || !deliveryDistrictId || !pickupDate) {
      Alert.alert("Xato", "Iltimos, barcha majburiy maydonlarni to'ldiring.");
      return;
    }

    const parsedDate = new Date(`${pickupDate}T00:00:00.000Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(pickupDate) ||
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== pickupDate
    ) {
      Alert.alert("Xato", "Jo'nash sanasini to'g'ri formatda kiriting (YYYY-MM-DD)");
      return;
    }

    createLoad.mutate({
      data: {
        title,
        description: description || undefined,
        cargoType,
        weightKg: Number(weightKg),
        volumeM3: Number(volumeM3),
        lengthCm: lengthCm ? Number(lengthCm) : undefined,
        widthCm: widthCm ? Number(widthCm) : undefined,
        heightCm: heightCm ? Number(heightCm) : undefined,
        pickupRegionId,
        pickupDistrictId,
        pickupAddress: pickupAddress || undefined,
        deliveryRegionId,
        deliveryDistrictId,
        deliveryAddress: deliveryAddress || undefined,
        pickupDate,
        budgetUzs: budgetUzs ? Number(budgetUzs) : undefined,
        sharedLoadAllowed,
      }
    }, {
      onSuccess: (load) => {
        router.replace(`/cargo/${load.id}`);
      },
      onError: (err: any) => {
        Alert.alert("Xato", err.message || "Yuk yaratishda xatolik yuz berdi");
      }
    });
  };

  if (sourceId && (!token || sourceLoading || sourceError || !sourceAllowed)) {
    return <View style={[styles.container, { backgroundColor: colors.background, padding: 24, justifyContent: 'center', gap: 16 }]}>
      <Text style={{ color: colors.text }}>{sourceLoading && token ? 'Xarid tekshirilmoqda…' : 'Xarid topilmadi yoki bu xarid uchun yangi yuk tayyorlash mumkin emas. Buyurtmalaringizni tekshiring.'}</Text>
      <TouchableOpacity onPress={() => router.replace(token ? '/(tabs)/orders' : '/auth/login')}><Text style={{ color: colors.primary }}>{token ? 'Buyurtmalarim' : 'Qayta kirish'}</Text></TouchableOpacity>
    </View>;
  }
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Yangi yuk qo'shish",
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: true,
        }}
      />
      
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 }
        ]}
        bottomOffset={40}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Yuk nomi *</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
            placeholder="Masalan: 2 tonna olma"
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Qo'shimcha ma'lumot</Text>
          <TextInput
            style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
            placeholder="Yuk haqida batafsil..."
            placeholderTextColor={colors.mutedForeground}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Cargo Type */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Yuk turi *</Text>
          <View style={styles.typesGrid}>
            {Object.values(CargoLoadInputCargoType).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: cargoType === type ? colors.primary : colors.card,
                    borderColor: cargoType === type ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => setCargoType(type)}
              >
                <Text style={{
                  fontSize: 13,
                  color: cargoType === type ? colors.primaryForeground : colors.text,
                  fontFamily: cargoType === type ? 'Inter_600SemiBold' : 'Inter_400Regular'
                }}>
                  {cargoTypeLabels[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Measurements */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Og'irligi (kg) *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
              placeholder="0.0"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              value={weightKg}
              onChangeText={setWeightKg}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Hajmi (m³) *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
              placeholder="0.0"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              value={volumeM3}
              onChangeText={setVolumeM3}
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Uzunligi (cm)</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
              placeholder="Ixtiyoriy"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              value={lengthCm}
              onChangeText={setLengthCm}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Kengligi (cm)</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
              placeholder="Ixtiyoriy"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              value={widthCm}
              onChangeText={setWidthCm}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Balandligi (cm)</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
              placeholder="Ixtiyoriy"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              value={heightCm}
              onChangeText={setHeightCm}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.recommendBtn, { borderColor: colors.primary }]}
          onPress={handleRecommend}
          disabled={recommendTransport.isPending}
        >
          <Text style={[styles.recommendBtnText, { color: colors.primary }]}>
            {recommendTransport.isPending ? "Hisoblanmoqda..." : "Transport tavsiyasini olish"}
          </Text>
        </TouchableOpacity>

        {!!sourceId && <Text style={{ color: colors.mutedForeground, marginBottom: 12 }}>Xariddagi mahsulot va hududlar kiritildi. Yuk turini tekshiring. Haqiqiy og‘irlik va hajmni to‘ldirsangiz, transport avtomatik tavsiya qilinadi. Manzillarni tekshiring; faqat saqlashni tasdiqlaganingizda yuk yaratiladi.</Text>}
        {recommendationError && <Text style={{ color: colors.destructive, marginBottom: 12 }}>{recommendationError}</Text>}
        {recommendation && (
          <View style={[styles.recommendationBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Text style={[styles.recTitle, { color: colors.primary }]}>Tavsiya: {recommendation.vehicleType.name}</Text>
            <Text style={[styles.recReason, { color: colors.mutedForeground }]}>{recommendation.reason}</Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Jo'nash sanasi *</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
            placeholder="YYYY-MM-DD (masalan: 2024-05-12)"
            placeholderTextColor={colors.mutedForeground}
            value={pickupDate}
            onChangeText={setPickupDate}
          />
        </View>

        {/* Locations */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Qayerdan (Olib ketish) *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          {(regions ?? []).map((reg) => (
            <TouchableOpacity
              key={reg.id}
              style={[styles.locChip, {
                backgroundColor: pickupRegionId === reg.id ? colors.primary : colors.card,
                borderColor: pickupRegionId === reg.id ? colors.primary : colors.border
              }]}
              onPress={() => { setPickupRegionId(reg.id); setPickupDistrictId(''); }}
            >
              <Text style={{ fontSize: 13, color: pickupRegionId === reg.id ? colors.primaryForeground : colors.text }}>
                {reg.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {!!pickupRegionId && (pickupDistricts ?? []).length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {pickupDistricts?.map((dist) => (
              <TouchableOpacity
                key={dist.id}
                style={[styles.locChip, {
                  backgroundColor: pickupDistrictId === dist.id ? colors.primary : colors.card,
                  borderColor: pickupDistrictId === dist.id ? colors.primary : colors.border
                }]}
                onPress={() => setPickupDistrictId(dist.id)}
              >
                <Text style={{ fontSize: 12, color: pickupDistrictId === dist.id ? colors.primaryForeground : colors.text }}>
                  {dist.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card, marginTop: 4 }]}
          placeholder="Aniq manzil yoki mo'ljal (ixtiyoriy)"
          placeholderTextColor={colors.mutedForeground}
          value={pickupAddress}
          onChangeText={setPickupAddress}
        />

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Qayerga (Yetkazish) *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          {(regions ?? []).map((reg) => (
            <TouchableOpacity
              key={reg.id}
              style={[styles.locChip, {
                backgroundColor: deliveryRegionId === reg.id ? colors.primary : colors.card,
                borderColor: deliveryRegionId === reg.id ? colors.primary : colors.border
              }]}
              onPress={() => { setDeliveryRegionId(reg.id); setDeliveryDistrictId(''); }}
            >
              <Text style={{ fontSize: 13, color: deliveryRegionId === reg.id ? colors.primaryForeground : colors.text }}>
                {reg.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {!!deliveryRegionId && (deliveryDistricts ?? []).length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {deliveryDistricts?.map((dist) => (
              <TouchableOpacity
                key={dist.id}
                style={[styles.locChip, {
                  backgroundColor: deliveryDistrictId === dist.id ? colors.primary : colors.card,
                  borderColor: deliveryDistrictId === dist.id ? colors.primary : colors.border
                }]}
                onPress={() => setDeliveryDistrictId(dist.id)}
              >
                <Text style={{ fontSize: 12, color: deliveryDistrictId === dist.id ? colors.primaryForeground : colors.text }}>
                  {dist.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card, marginTop: 4 }]}
          placeholder="Aniq manzil yoki mo'ljal (ixtiyoriy)"
          placeholderTextColor={colors.mutedForeground}
          value={deliveryAddress}
          onChangeText={setDeliveryAddress}
        />

        <Text style={[styles.sectionTitle, { color: colors.text }]}>To'lov va shartlar</Text>
        <View style={styles.inputGroup}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.label, { color: colors.text }]}>Taklif qilinayotgan summa (so'm)</Text>
            {!budgetUzs && <Text style={{ fontSize: 11, color: colors.statusPending }}>Kelishiladi</Text>}
          </View>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
            placeholder="Bo'sh qoldirsangiz kelishiladi"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            value={budgetUzs}
            onChangeText={setBudgetUzs}
          />
        </View>

        <View style={[styles.switchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.switchInfo}>
            <Text style={[styles.switchTitle, { color: colors.text }]}>Hamroh yuk (Kichik yuk)</Text>
            <Text style={[styles.switchDesc, { color: colors.mutedForeground }]}>Boshqa yuklar bilan birga olib ketishga ruxsat</Text>
          </View>
          <Switch
            value={sharedLoadAllowed}
            onValueChange={setSharedLoadAllowed}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: createLoad.isPending ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={createLoad.isPending}
        >
          <Text style={[styles.submitBtnText, { color: colors.primaryForeground }]}>
            {createLoad.isPending ? "Saqlanmoqda..." : "E'lon qilish"}
          </Text>
        </TouchableOpacity>
        
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 16,
    gap: 16,
  },
  inputGroup: { gap: 6 },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  textArea: {
    height: 100,
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 8,
    marginBottom: -8,
  },
  horizontalScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  locChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  switchInfo: {
    flex: 1,
    paddingRight: 16,
  },
  switchTitle: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  switchDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  recommendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: 'dashed',
    marginTop: -4,
  },
  recommendBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  recommendationBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: -4,
  },
  recTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  recReason: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  submitBtn: {
    height: 52,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  submitBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});
