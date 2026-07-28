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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useGetCategories, useCreateListing, useGetRegions, useGetDistricts } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { MarketAnalysisModal } from '@/components/MarketAnalysisModal';

export default function CreateScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const [title, setTitle] = useState('');
  const [titleRu, setTitleRu] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceUnit, setPriceUnit] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
  const [regionId, setRegionId] = useState(user?.regionId ?? '');
  const [districtId, setDistrictId] = useState(user?.districtId ?? '');
  const [listingType, setListingType] = useState<'savdo' | 'xizmat'>('savdo');
  const [sellerType, setSellerType] = useState<'sotuvchi' | 'ishlab_chiqaruvchi'>('sotuvchi');
  const [elanTur, setElanTur] = useState<'oddiy' | 'vip'>('oddiy');
  const [analysisListingId, setAnalysisListingId] = useState<string | null>(null);

  // Bepul davr: ro'yxatdan o'tganidan 30 kun ichida birinchi e'lon bepul
  const BEPUL_KUN = 30;
  const freeDaysLeft = React.useMemo(() => {
    if (!user?.createdAt) return 0;
    const diff = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000);
    return Math.max(0, BEPUL_KUN - diff);
  }, [user?.createdAt]);
  const isBepul = freeDaysLeft > 0;

  const { data: categories } = useGetCategories();
  const { data: regions } = useGetRegions();
  const { data: districtsData } = useGetDistricts(
    { regionId: regionId || undefined },
    { query: { enabled: !!regionId } },
  );

  const createMutation = useCreateListing({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['getListings'] });
        // Show market analysis modal after successful listing creation
        setAnalysisListingId(data.id);
      },
      onError: () => {
        Alert.alert("Xato", "E'lon joylashtirishda xato yuz berdi");
      },
    },
  });

  const selectedCategory = categories?.find((c) => c.id === selectedCategoryId);

  function handleSubmit() {
    if (!title.trim()) {
      Alert.alert("Xato", "Sarlavha kiriting");
      return;
    }
    if (!price || isNaN(Number(price))) {
      Alert.alert("Xato", "Narxni kiriting");
      return;
    }
    if (!selectedCategoryId) {
      Alert.alert("Xato", "Kategoriya tanlang");
      return;
    }
    if (!regionId || !districtId) {
      Alert.alert("Xato", "Viloyat va tumanni tanlang");
      return;
    }

    createMutation.mutate({
      data: {
        title: title.trim(),
        titleRu: titleRu.trim() || undefined,
        description: description.trim() || undefined,
        price: Number(price),
        priceUnit: priceUnit.trim() || undefined,
        categoryId: selectedCategoryId,
        subcategoryId: selectedSubcategoryId || undefined,
        regionId,
        districtId,
        images: [],
        listingType,
        sellerType,
        elanTur,
      },
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>E'lon joylash</Text>
      </View>

      <MarketAnalysisModal
        visible={!!analysisListingId}
        listingId={analysisListingId}
        onClose={() => {
          setAnalysisListingId(null);
          router.push('/(tabs)');
        }}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === 'web' ? 84 + 34 : 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── E'lon turi: Savdo / Xizmat ─── */}
        <FieldLabel label="E'lon turi *" colors={colors} />
        <View style={styles.twoChipRow}>
          {([
            { val: 'savdo', icon: '🛒', label: 'Savdo' },
            { val: 'xizmat', icon: '🛠️', label: 'Xizmat' },
          ] as const).map(({ val, icon, label }) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.halfChip,
                {
                  backgroundColor: listingType === val ? colors.primary : colors.card,
                  borderColor: listingType === val ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setListingType(val)}
            >
              <Text style={{ fontSize: 18 }}>{icon}</Text>
              <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: listingType === val ? colors.primaryForeground : colors.text }}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── Sotuvchi turi (faqat savdoda) ─── */}
        {listingType === 'savdo' && (
          <>
            <FieldLabel label="Siz kimni ifodalaysiz?" colors={colors} />
            <View style={styles.twoChipRow}>
              {([
                { val: 'sotuvchi', icon: '🛒', label: 'Sotuvchi', sub: 'Tayyor mahsulot' },
                { val: 'ishlab_chiqaruvchi', icon: '🏭', label: 'Ishlab chiqaruvchi', sub: "O'zim yasayman" },
              ] as const).map(({ val, icon, label, sub }) => (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.sellerTypeChip,
                    {
                      backgroundColor: sellerType === val ? colors.primary + '15' : colors.card,
                      borderColor: sellerType === val ? colors.primary : colors.border,
                      borderWidth: sellerType === val ? 2 : 1,
                    },
                  ]}
                  onPress={() => setSellerType(val)}
                >
                  <Text style={{ fontSize: 22 }}>{icon}</Text>
                  <Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: sellerType === val ? colors.primary : colors.text }}>
                    {label}
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.mutedForeground }}>
                    {sub}
                  </Text>
                  {val === 'ishlab_chiqaruvchi' && (
                    <View style={[styles.adminNote, { backgroundColor: colors.secondary }]}>
                      <Text style={{ fontSize: 10, fontFamily: 'Inter_400Regular', color: colors.mutedForeground }}>
                        ⏳ Admin tasdiqlash kerak
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ─── Title ─── */}
        <FieldLabel label="Sarlavha *" colors={colors} />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
          placeholder="Masalan: Sut sigir sotiladi"
          placeholderTextColor={colors.mutedForeground}
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        {/* Russian title */}
        <FieldLabel label="Sarlavha (Ruscha, ixtiyoriy)" colors={colors} />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
          placeholder="Название на русском"
          placeholderTextColor={colors.mutedForeground}
          value={titleRu}
          onChangeText={setTitleRu}
          maxLength={100}
        />

        {/* Description */}
        <FieldLabel label="Tavsif" colors={colors} />
        <TextInput
          style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
          placeholder="Mahsulot haqida batafsil ma'lumot..."
          placeholderTextColor={colors.mutedForeground}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={1000}
        />

        {/* Price */}
        <View style={styles.priceRow}>
          <View style={{ flex: 2 }}>
            <FieldLabel label="Narx (so'm) *" colors={colors} />
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1.2 }}>
            <FieldLabel label="O'lchov birligi" colors={colors} />
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
              placeholder="dona, kg, m..."
              placeholderTextColor={colors.mutedForeground}
              value={priceUnit}
              onChangeText={setPriceUnit}
              maxLength={20}
            />
          </View>
        </View>

        {/* Category */}
        <FieldLabel label="Kategoriya *" colors={colors} />
        <View style={styles.chipGrid}>
          {(categories ?? []).map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.catChip,
                {
                  backgroundColor: selectedCategoryId === cat.id ? colors.primary : colors.card,
                  borderColor: selectedCategoryId === cat.id ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                setSelectedCategoryId(cat.id);
                setSelectedSubcategoryId('');
              }}
            >
              <Text style={{ fontSize: 14 }}>{cat.icon}</Text>
              <Text style={{
                fontSize: 12,
                fontFamily: 'Inter_500Medium',
                color: selectedCategoryId === cat.id ? colors.primaryForeground : colors.text,
              }}>
                {cat.name.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Subcategory */}
        {selectedCategory && selectedCategory.subcategories.length > 0 && (
          <>
            <FieldLabel label="Kichik kategoriya" colors={colors} />
            <View style={styles.chipGrid}>
              {selectedCategory.subcategories.map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: selectedSubcategoryId === sub.id ? colors.secondary : colors.card,
                      borderColor: selectedSubcategoryId === sub.id ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedSubcategoryId(sub.id)}
                >
                  <Text style={{
                    fontSize: 12,
                    fontFamily: 'Inter_500Medium',
                    color: selectedSubcategoryId === sub.id ? colors.primary : colors.text,
                  }}>
                    {sub.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Region */}
        <FieldLabel label="Viloyat *" colors={colors} />
        <View style={styles.chipGrid}>
          {(regions ?? []).map((reg) => (
            <TouchableOpacity
              key={reg.id}
              style={[
                styles.catChip,
                {
                  backgroundColor: regionId === reg.id ? colors.primary : colors.card,
                  borderColor: regionId === reg.id ? colors.primary : colors.border,
                },
              ]}
              onPress={() => { setRegionId(reg.id); setDistrictId(''); }}
            >
              <Text style={{
                fontSize: 12,
                fontFamily: 'Inter_500Medium',
                color: regionId === reg.id ? colors.primaryForeground : colors.text,
              }}>
                {reg.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* District */}
        {regionId && (
          <>
            <FieldLabel label="Tuman *" colors={colors} />
            <View style={styles.chipGrid}>
              {(districtsData ?? []).map((dist) => (
                <TouchableOpacity
                  key={dist.id}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: districtId === dist.id ? colors.primary : colors.card,
                      borderColor: districtId === dist.id ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setDistrictId(dist.id)}
                >
                  <Text style={{
                    fontSize: 12,
                    fontFamily: 'Inter_500Medium',
                    color: districtId === dist.id ? colors.primaryForeground : colors.text,
                  }}>
                    {dist.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ─── E'lon turi: VIP / Oddiy ─── */}
        <FieldLabel label="E'lon darajasi" colors={colors} />

        {/* Bepul davr banneri */}
        {isBepul && (
          <View style={[styles.freeBanner, { backgroundColor: '#16a34a18', borderColor: '#16a34a40' }]}>
            <Text style={{ fontSize: 16 }}>🎁</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: '#16a34a' }}>
                Bepul davr: {freeDaysLeft} kun qoldi
              </Text>
              <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: '#16a34a' }}>
                Oddiy e'lon hozir bepul
              </Text>
            </View>
          </View>
        )}

        <View style={styles.twoChipRow}>
          {([
            {
              val: 'oddiy' as const,
              icon: '📄',
              label: "Oddiy e'lon",
              price: isBepul ? 'BEPUL' : "5 000 so'm",
              priceColor: isBepul ? '#16a34a' : undefined,
            },
            {
              val: 'vip' as const,
              icon: '⭐',
              label: "VIP e'lon",
              price: isBepul ? "5 000 so'm" : "10 000 so'm",
              priceColor: '#f59e0b',
            },
          ]).map(({ val, icon, label, price, priceColor }) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.sellerTypeChip,
                {
                  backgroundColor: elanTur === val ? (val === 'vip' ? '#f59e0b18' : colors.primary + '15') : colors.card,
                  borderColor: elanTur === val ? (val === 'vip' ? '#f59e0b' : colors.primary) : colors.border,
                  borderWidth: elanTur === val ? 2 : 1,
                },
              ]}
              onPress={() => setElanTur(val)}
            >
              <Text style={{ fontSize: 22 }}>{icon}</Text>
              <Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: elanTur === val ? (val === 'vip' ? '#f59e0b' : colors.primary) : colors.text }}>
                {label}
              </Text>
              <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: priceColor ?? colors.mutedForeground }}>
                {price}
              </Text>
              {val === 'vip' && (
                <View style={[styles.adminNote, { backgroundColor: '#f59e0b18' }]}>
                  <Text style={{ fontSize: 10, fontFamily: 'Inter_400Regular', color: '#f59e0b' }}>
                    Tepada ko'rinadi 🚀
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: createMutation.isPending ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <>
              <Feather name="plus-circle" size={18} color={colors.primaryForeground} />
              <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
                E'lonni joylash
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
