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
import { useGetCargoLoads, CargoLoadStatus, useGetDrivers, useGetVehicleTypes } from '@workspace/api-client-react';
import { CargoLoadCard } from '@/components/cargo/CargoLoadCard';
import { EmptyState } from '@/components/EmptyState';
import { useRouter } from 'expo-router';

export default function CargoHubScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

  const { data: loads, isLoading, refetch, isRefetching } = useGetCargoLoads({
    status: activeTab === 'all' ? CargoLoadStatus.open : undefined,
    mine: activeTab === 'my' ? true : undefined,
  });

  const { data: drivers } = useGetDrivers();
  const { data: vehicles } = useGetVehicleTypes();

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const renderDriversList = () => {
    if (!drivers || drivers.length === 0) return null;
    return (
      <View style={{ marginBottom: 16 }}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Faol haydovchilar</Text>
        <FlatList
          data={drivers}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingBottom: 8 }}
          style={{ marginHorizontal: -16 }}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.driverCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/driver/${item.id}`)}
            >
              <View style={[styles.driverAvatar, { backgroundColor: colors.primary }]}>
                <Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_700Bold', fontSize: 16 }}>
                  {item.user.name.charAt(0)}
                </Text>
              </View>
              <View>
                <Text style={[styles.driverName, { color: colors.text }]} numberOfLines={1}>{item.user.name}</Text>
                <Text style={[styles.driverVehicle, { color: colors.mutedForeground }]} numberOfLines={1}>{item.vehicleType.name}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: colors.text }]}>Yuklar markazi</Text>
          <TouchableOpacity
            testID="open-cargo-trips"
            accessibilityLabel="Yuk tashuvlarim va xabarlar"
            onPress={() => router.push('/(tabs)/orders')}
            style={styles.filterBtn}
          >
            <Feather name="bell" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, { backgroundColor: colors.secondary }]}
          >
            <Feather name="filter" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'all' && [styles.activeTab, { backgroundColor: colors.primary }],
            ]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'all' ? colors.primaryForeground : colors.mutedForeground }
            ]}>Barcha yuklar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'my' && [styles.activeTab, { backgroundColor: colors.primary }],
            ]}
            onPress={() => setActiveTab('my')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'my' ? colors.primaryForeground : colors.mutedForeground }
            ]}>Mening yuklarim</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Yuklanmoqda...</Text>
        </View>
      ) : loads?.length === 0 ? (
        <EmptyState
          icon="truck"
          title="Hozircha yuklar yo'q"
          subtitle="Tizimda mos keluvchi yuk e'lonlari topilmadi."
        />
      ) : (
        <FlatList
          data={loads}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderDriversList()}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Platform.OS === 'web' ? 84 + 34 : 100 },
          ]}
          renderItem={({ item }) => (
            <CargoLoadCard
              load={item}
              onPress={() => router.push(`/cargo/${item.id}`)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: (Platform.OS === 'web' ? 84 : 90) + insets.bottom }]}
        onPress={() => router.push('/cargo/create')}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={24} color={colors.primaryForeground} />
        <Text style={[styles.fabText, { color: colors.primaryForeground }]}>Yuk qo'shish</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
  },
  activeTab: {
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  list: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 160,
    maxWidth: 200,
  },
  driverAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverName: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  driverVehicle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  centered: {
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
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 100,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
