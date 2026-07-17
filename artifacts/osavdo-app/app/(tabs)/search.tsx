import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGetListings, useGetCategories } from '@workspace/api-client-react';
import { ListingCard } from '@/components/ListingCard';
import { EmptyState } from '@/components/EmptyState';

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: categories } = useGetCategories();

  const { data: listingsData, isLoading } = useGetListings(
    {
      search: search || undefined,
      categoryId: selectedCategory ?? undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      limit: 40,
    },
    { query: { enabled: search.length > 0 || selectedCategory !== null || !!minPrice || !!maxPrice } },
  );

  const listings = listingsData?.items ?? [];
  const hasSearched = search.length > 0 || selectedCategory !== null || !!minPrice || !!maxPrice;
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Qidirish</Text>

        {/* Search bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
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
        </View>

        {/* Filter toggle */}
        <TouchableOpacity
          style={[styles.filterToggle, { borderColor: colors.border, backgroundColor: showFilters ? colors.secondary : colors.card }]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Feather name="sliders" size={16} color={colors.primary} />
          <Text style={[styles.filterToggleText, { color: colors.primary }]}>Filtrlar</Text>
          {(selectedCategory || minPrice || maxPrice) && (
            <View style={[styles.filterDot, { backgroundColor: colors.primary }]} />
          )}
        </TouchableOpacity>
      </View>

      {/* Filters panel */}
      {showFilters && (
        <View style={[styles.filtersPanel, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
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
                onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              >
                <Text style={{ fontSize: 13, color: selectedCategory === cat.id ? colors.primaryForeground : colors.text }}>
                  {cat.icon} {cat.name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.filterLabel, { color: colors.mutedForeground, marginTop: 12 }]}>Narx oralig'i (so'm)</Text>
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
        </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
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
