import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGetCategories, useGetListings } from '@workspace/api-client-react';
import { CategoryGrid } from '@/components/CategoryGrid';
import { ListingCard } from '@/components/ListingCard';
import { EmptyState } from '@/components/EmptyState';
import { LocationPicker } from '@/components/LocationPicker';
import { AIMaslahatModal } from '@/components/AIMaslahatModal';
import { useLocation } from '@/context/LocationContext';
import { useAuth } from '@/context/AuthContext';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { districtName, regionName, districtId, regionId } = useLocation();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showAI, setShowAI] = useState(false);

  const { data: categories } = useGetCategories();

  const { data: listingsData, isLoading, refetch, isRefetching } = useGetListings({
    categoryId: selectedCategory ?? undefined,
    districtId: districtId ?? undefined,
    regionId: districtId ? undefined : regionId ?? undefined,
    limit: 40,
  });

  const listings = listingsData?.items ?? [];

  const locationLabel = districtName
    ? `${districtName}, ${regionName}`
    : regionName ?? "Joylashuv tanlang";

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.appName, { color: colors.primary }]}>Turan Market</Text>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              Assalomu alaykum, {user?.name?.split(' ')[0] ?? 'Mehmon'}!
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.locationBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            onPress={() => setShowLocationPicker(true)}
          >
            <Feather name="map-pin" size={14} color={colors.primary} />
            <Text style={[styles.locationBtnText, { color: colors.primary }]} numberOfLines={1}>
              {locationLabel}
            </Text>
            <Feather name="chevron-down" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories */}
      <View style={[styles.categoriesBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.categoriesLabel, { color: colors.mutedForeground }]}>Kategoriyalar</Text>
        <CategoryGrid
          categories={categories ?? []}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </View>

      {/* Listings Grid */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Yuklanmoqda...
          </Text>
        </View>
      ) : listings.length === 0 ? (
        <EmptyState
          icon="package"
          title="E'lonlar topilmadi"
          subtitle="Bu hududda hozircha e'lonlar yo'q. Filterni o'zgartiring yoki birinchi bo'ling!"
          actionLabel="Joylashuvni o'zgartirish"
          onAction={() => setShowLocationPicker(true)}
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
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>
              {listingsData?.total ?? 0} ta e'lon topildi
            </Text>
          }
        />
      )}

      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
      />

      {/* AI Maslahat floating button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: (Platform.OS === 'web' ? 84 : 90) + insets.bottom }]}
        onPress={() => setShowAI(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabEmoji}>🤖</Text>
        <Text style={[styles.fabText, { color: colors.primaryForeground }]}>AI Maslahat</Text>
      </TouchableOpacity>

      <AIMaslahatModal visible={showAI} onClose={() => setShowAI(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  appName: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  greeting: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
    maxWidth: 180,
  },
  locationBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  categoriesBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  categoriesLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    paddingHorizontal: 16,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  row: {
    justifyContent: 'space-between',
  },
  resultCount: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  fab: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 100,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabEmoji: { fontSize: 16 },
  fabText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});
