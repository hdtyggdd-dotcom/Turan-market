import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as ExpoLocation from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { getGetUserListingsQueryKey, getGetListingsQueryKey, useCreateListing, useDetectLocation, useGetCategories } from '@workspace/api-client-react';
import { ImageUploader } from '@/components/ImageUploader';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useI18n } from '@/context/I18nContext';
import { MarketAnalysisModal } from '@/components/MarketAnalysisModal';

export function CreateListingForm({ hideHeader = false, onDone }: { hideHeader?: boolean; onDone?: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const {
    countryName,
    regionId: detectedRegionId,
    regionName: detectedRegionName,
    districtId: detectedDistrictId,
    districtName: detectedDistrictName,
    setLocation,
  } = useLocation();
  const { t, lang, setLangByCountry } = useI18n();
  const queryClient = useQueryClient();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [analysisListingId, setAnalysisListingId] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [specialSubcategoryId, setSpecialSubcategoryId] = useState<string | null>(null);
  const { data: categories } = useGetCategories();
  const specialCategory = (categories ?? []).find((category) => category.id === 'cat18');

  const detectLocationMutation = useDetectLocation();

  const createMutation = useCreateListing({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetListingsQueryKey() });
        if (user?.id) queryClient.invalidateQueries({ queryKey: getGetUserListingsQueryKey(user.id) });
        // Show market analysis modal after successful listing creation
        setAnalysisListingId(data.id);
      },
      onError: () => {
        setIsPreparing(false);
        Alert.alert("Xato", "E'lon joylashtirishda xato yuz berdi");
      },
    },
  });

  async function resolveAutomaticLocation() {
    const knownRegionId = detectedRegionId ?? user?.regionId;
    const knownDistrictId = detectedDistrictId ?? user?.districtId;
    if (knownRegionId && knownDistrictId) {
      return { regionId: knownRegionId, districtId: knownDistrictId };
    }

    if (Platform.OS === 'web' && typeof navigator === 'undefined') return null;

    try {
      const permission = await ExpoLocation.requestForegroundPermissionsAsync();
      if (!permission.granted) return null;
      const position = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });
      const detected = await detectLocationMutation.mutateAsync({
        data: { lat: position.coords.latitude, lng: position.coords.longitude },
      });
      const nextDistrictId = detected.districtId ?? detected.regionId;
      setLocation({
        countryId: detected.countryId,
        countryName: detected.countryName,
        countryFlag: detected.countryFlag,
        currency: detected.currency,
        regionId: detected.regionId,
        regionName: detected.regionName,
        districtId: nextDistrictId,
        districtName: detected.districtName ?? detected.regionName,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      setLangByCountry(detected.countryId);
      return { regionId: detected.regionId, districtId: nextDistrictId };
    } catch {
      return null;
    }
  }

  async function handleSubmit() {
    if (!title.trim()) {
      Alert.alert("Xato", "Tovar haqida ma'lumot kiriting");
      return;
    }
    if (!price || isNaN(Number(price))) {
      Alert.alert("Xato", "Narxni kiriting");
      return;
    }
    if (images.length === 0) {
      Alert.alert("Xato", "Kamida bitta rasm qo'shing");
      return;
    }

    setIsPreparing(true);
    const location = await resolveAutomaticLocation();
    if (!location) {
      setIsPreparing(false);
      Alert.alert("Xato", "Joylashuvni aniqlab bo'lmadi. GPS ruxsatini yoqing.");
      return;
    }

    createMutation.mutate({
      data: {
        title: title.trim(),
        price: Number(price),
        images,
        ...(specialSubcategoryId ? { categoryId: 'cat18', subcategoryId: specialSubcategoryId } : {}),
        regionId: location.regionId,
        districtId: location.districtId,
      },
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {!hideHeader && (
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('addListing')}</Text>
      </View>)}

      <MarketAnalysisModal
        visible={!!analysisListingId}
        listingId={analysisListingId}
        onClose={() => {
          setAnalysisListingId(null);
          setTitle(''); setPrice(''); setImages([]); setIsPreparing(false); setSpecialSubcategoryId(null);
          if (onDone) onDone(); else router.push('/(tabs)');
        }}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === 'web' ? 84 + 34 : 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── Rasmlar ─── */}
        <View style={{ marginTop: 8 }}>
          <ImageUploader
            images={images}
            onChange={setImages}
            max={5}
            label="📸 Rasm *"
          />
        </View>

        {/* ─── Product information ─── */}
        <FieldLabel label="Tovar haqida ma'lumot *" colors={colors} />
        <TextInput
          style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
          placeholder="Masalan: Ishlatilgan iPhone 13, yaxshi holatda..."
          placeholderTextColor={colors.mutedForeground}
          value={title}
          onChangeText={setTitle}
          multiline
          numberOfLines={4}
          maxLength={100}
        />

        {/* Price */}
        <FieldLabel label={`${t('price')} (so'm) *`} colors={colors} />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
          placeholder="0"
          placeholderTextColor={colors.mutedForeground}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />

        <FieldLabel label="Tovar bo'limi" colors={colors} />
        {specialCategory && <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{specialCategory.name}</Text>}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[{ id: null, name: 'Avtomatik' }, ...(specialCategory?.subcategories ?? [])].map((category) => {
            const selected = specialSubcategoryId === category.id;
            return (
              <TouchableOpacity
                key={category.id ?? 'auto'}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setSpecialSubcategoryId(category.id)}
                style={{
                  borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primary : colors.card,
                }}
              >
                <Text style={{ color: selected ? colors.primaryForeground : colors.text, fontFamily: 'Inter_500Medium', fontSize: 13 }}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* AI-filled fields */}
        <View style={[styles.autoCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <View style={styles.autoHeader}>
            <Text style={{ fontSize: 20 }}>✨</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.autoTitle, { color: colors.text }]}>Qolganini AI joylaydi</Text>
              <Text style={[styles.autoSubtitle, { color: colors.mutedForeground }]}>
                {specialSubcategoryId ? "Tanlangan subkategoriya saqlanadi; viloyat va tuman avtomatik aniqlanadi" : "Kategoriya, viloyat va tuman avtomatik aniqlanadi"}
              </Text>
            </View>
          </View>
          <Text style={[styles.autoRow, { color: colors.mutedForeground }]}>
            📍 {countryName ?? "Joylashuvingiz GPS orqali aniqlanadi"}
            {detectedRegionName ? ` · ${detectedRegionName}` : ''}
            {detectedDistrictName ? ` · ${detectedDistrictName}` : ''}
          </Text>
          <Text style={[styles.autoRow, { color: colors.mutedForeground }]}>
            🗂️ Mahsulot ma'lumotidan mos kategoriya topiladi
          </Text>
          <Text style={[styles.autoRow, { color: colors.mutedForeground }]}>
            🌐 Til: {lang.toUpperCase()} · Valyuta joylashuvga mos
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: createMutation.isPending ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={createMutation.isPending || isPreparing}
        >
          {createMutation.isPending || isPreparing ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <>
              <Feather name="plus-circle" size={18} color={colors.primaryForeground} />
              <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
                {t('publish')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function FieldLabel({ label, colors }: { label: string; colors: ReturnType<typeof useColors> }) {
  return (
    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  content: {
    padding: 16,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 11,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  autoCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    marginTop: 4,
  },
  autoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  autoTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  autoSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  autoRow: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
  },
  twoChipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  sellerTypeChip: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
  },
  adminNote: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginTop: 2,
  },
  freeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 4,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 20,
  },
  submitText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});
