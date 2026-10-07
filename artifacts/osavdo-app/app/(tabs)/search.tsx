import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGetListings, useGetCategories, useGetRegions, useGetDistricts, getGetDistrictsQueryKey, getGetListingsQueryKey } from '@workspace/api-client-react';
import { ListingCard } from '@/components/ListingCard';
import { EmptyState } from '@/components/EmptyState';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PhotoProductSearch } from '@/components/PhotoProductSearch';
import { CreateListingForm } from '@/components/CreateListingForm';

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string; subcategoryId?: string; mode?: string; ts?: string }>();
  const [mode, setMode] = useState<'search' | 'post'>(params.mode === 'post' ? 'post' : 'search');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (params.mode === 'post') setMode('post');
    else if (params.mode === 'search' || params.categoryId) setMode('search');
    if (params.categoryId || params.subcategoryId) {
      setSelectedCategory(params.categoryId ?? null);
      setSelectedSubcategory(params.subcategoryId || null);
      setQuery('');
      setSearch('');
    }
  }, [params.categoryId, params.subcategoryId, params.mode, params.ts]);

  const { data: categories } = useGetCategories();
  const { data: regions } = useGetRegions();
  const { data: districts } = useGetDistricts(
    { regionId: selectedRegion ?? undefined },
    { query: { enabled: !!selectedRegion, queryKey: getGetDistrictsQueryKey({ regionId: selectedRegion ?? undefined }) } }
  );

  const activeCategory = categories?.find(c => c.id === selectedCategory);

  const { data: listingsData, isLoading } = useGetListings(
    {
      search: search || undefined,
      categoryId: selectedCategory ?? undefined,
      subcategoryId: selectedSubcategory ?? undefined,
      regionId: selectedRegion ?? undefined,
      districtId: selectedDistrict ?? undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      limit: 40,
    },
    { query: { enabled: mode === 'search' && (search.length > 0 || selectedSubcategory !== null || selectedCategory !== null || selectedRegion !== null || !!minPrice || !!maxPrice), queryKey: getGetListingsQueryKey({
      search: search || undefined,
      categoryId: selectedCategory ?? undefined,
      subcategoryId: selectedSubcategory ?? undefined,
      regionId: selectedRegion ?? undefined,
      districtId: selectedDistrict ?? undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      limit: 40,
    }) } },
  );

  const listings = listingsData?.items ?? [];
  const hasSearched = search.length > 0 || selectedCategory !== null || selectedSubcategory !== null || selectedRegion !== null || !!minPrice || !!maxPrice;
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const modeHeader = null;
  void modeHeader;
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.seg, { backgroundColor: colors.muted }]}>
          {(['search', 'post'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              testID={`mode-${m}`}
              style={[styles.segBtn, mode === m && { backgroundColor: colors.primary }]}
              onPress={() => setMode(m)}
            >
              <Feather name={m === 'search' ? 'search' : 'plus-circle'} size={15} color={mode === m ? colors.primaryForeground : colors.text} />
              <Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: mode === m ? colors.primaryForeground : colors.text }}>
                {m === 'search' ? 'Qidirish' : "E'lon joylash"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {mode === 'search' && (
          <TouchableOpacity onPress={() => router.push('/(tabs)/categories')} style={styles.catLink}>
            <Feather name="grid" size={14} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 13, fontFamily: 'Inter_500Medium' }}>Barcha kategoriyalar</Text>
          </TouchableOpacity>
        )}

        {/* Search bar */}
        {mode === 'search' && <View style={[styles.searchBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Mahsulot nomi yoki kalit so'z..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => setSearch(query)}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setSearch(''); }}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>}

        {mode === 'search' && <PhotoProductSearch />}

        {/* Filter toggle */}
        {mode === 'search' && <TouchableOpacity
          style={[styles.filterToggle, { borderColor: colors.border, backgroundColor: showFilters ? colors.secondary : colors.card }]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Feather name="sliders" size={16} color={colors.primary} />
          <Text style={[styles.filterToggleText, { color: colors.primary }]}>Filtrlar</Text>
          {(selectedCategory || minPrice || maxPrice) && (
            <View style={[styles.filterDot, { backgroundColor: colors.primary }]} />
          )}
        </TouchableOpacity>}
      </View>

      {mode === 'post' ? (
        <CreateListingForm hideHeader onDone={() => setMode('search')} />
      ) : (<>
      {/* Filters panel */}
      {showFilters && (
        <ScrollView style={[styles.filtersPanel, { backgroundColor: colors.card, borderBottomColor: colors.border }]} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>Kategoriya</Text>
          <View style={styles.categoryChips}>
            {(categories ?? []).map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: selectedCategory === cat.id ? colors.primary : colors.secondary,
                    borderColor: selectedCategory === cat.id ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  setSelectedCategory(selectedCategory === cat.id ? null : cat.id);
                  setSelectedSubcategory(null);
                }}
              >
                <Text style={{ fontSize: 13, color: selectedCategory === cat.id ? colors.primaryForeground : colors.text }}>
                  {cat.icon} {
                    cat.id === 'cat15'
                      ? 'Sanoat'
                      : cat.id === 'cat16'
                        ? 'B2B / Optom'
                        : cat.id === 'cat17'
                          ? 'Ishlatilgan'
                          : cat.name.split(' ')[0]
                  }
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeCategory && activeCategory.subcategories.length > 0 && (
            <>
              <Text style={[styles.filterLabel, { color: colors.mutedForeground, marginTop: 16 }]}>Ostki kategoriya</Text>
              <View style={styles.categoryChips}>
                {activeCategory.subcategories.map((sub) => (
                  <TouchableOpacity
                    key={sub.id}
                    style={[
                      styles.catChip,
                      {
                        backgroundColor: selectedSubcategory === sub.id ? colors.primary : colors.secondary,
                        borderColor: selectedSubcategory === sub.id ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedSubcategory(selectedSubcategory === sub.id ? null : sub.id)}
                  >
                    <Text style={{ fontSize: 12, color: selectedSubcategory === sub.id ? colors.primaryForeground : colors.text }}>
                      {sub.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={[styles.filterLabel, { color: colors.mutedForeground, marginTop: 16 }]}>Hudud</Text>
          <View style={styles.categoryChips}>
            {(regions ?? []).map((reg) => (
              <TouchableOpacity
                key={reg.id}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: selectedRegion === reg.id ? colors.primary : colors.secondary,
                    borderColor: selectedRegion === reg.id ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  setSelectedRegion(selectedRegion === reg.id ? null : reg.id);
                  setSelectedDistrict(null);
                }}
              >
                <Text style={{ fontSize: 13, color: selectedRegion === reg.id ? colors.primaryForeground : colors.text }}>
                  {reg.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedRegion && (districts ?? []).length > 0 && (
            <>
              <Text style={[styles.filterLabel, { color: colors.mutedForeground, marginTop: 16 }]}>Tuman</Text>
              <View style={styles.categoryChips}>
                {(districts ?? []).map((dist) => (
                  <TouchableOpacity
                    key={dist.id}
                    style={[
                      styles.catChip,
                      {
                        backgroundColor: selectedDistrict === dist.id ? colors.primary : colors.secondary,
                        borderColor: selectedDistrict === dist.id ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedDistrict(selectedDistrict === dist.id ? null : dist.id)}
                  >
                    <Text style={{ fontSize: 12, color: selectedDistrict === dist.id ? colors.primaryForeground : colors.text }}>
                      {dist.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={[styles.filterLabel, { color: colors.mutedForeground, marginTop: 16 }]}>Narx oralig'i (so'm)</Text>
          <View style={styles.priceRow}>
            <TextInput
              style={[styles.priceInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.muted }]}
              placeholder="Dan"
              placeholderTextColor={colors.mutedForeground}
              value={minPrice}
              onChangeText={setMinPrice}
              keyboardType="numeric"
            />
            <Text style={{ color: colors.mutedForeground }}>—</Text>
            <TextInput
              style={[styles.priceInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.muted }]}
              placeholder="Gacha"
              placeholderTextColor={colors.mutedForeground}
              value={maxPrice}
              onChangeText={setMaxPrice}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            style={[styles.clearBtn, { borderColor: colors.border }]}
            onPress={() => {
              setSelectedCategory(null);
              setSelectedSubcategory(null);
              setSelectedRegion(null);
              setSelectedDistrict(null);
              setMinPrice('');
              setMaxPrice('');
              setSearch('');
              setQuery('');
            }}
          >
            <Text style={{ color: colors.destructive, fontSize: 13, fontFamily: 'Inter_500Medium' }}>
              Filtrni tozalash
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Results */}
      {!hasSearched ? (
        <EmptyState
          icon="search"
          title="Nima qidiryapsiz?"
          subtitle="Mahsulot nomi yozing yoki kategoriya tanlang"
        />
      ) : isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : listings.length === 0 ? (
        <EmptyState
          icon="frown"
          title="Natija topilmadi"
          subtitle="Boshqa kalit so'z yoki filtr bilan urinib ko'ring"
        />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Platform.OS === 'web' ? 84 + 34 : 100 },
          ]}
          renderItem={({ item }) => <ListingCard listing={item} />}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>
              {listingsData?.total ?? 0} ta natija
            </Text>
          }
        />
      )}
      </>)}
    </View>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', borderRadius: 12, padding: 3 },
  segBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10 },
  catLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterToggleText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filtersPanel: {
    padding: 16,
    maxHeight: 400,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  clearBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 12,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  row: { justifyContent: 'space-between' },
  resultCount: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
