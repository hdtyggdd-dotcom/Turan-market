import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGetUserListings, getGetUserListingsQueryKey } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { ListingCard } from '@/components/ListingCard';
import { EmptyState } from '@/components/EmptyState';

export default function MyProductsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const top = Platform.OS === 'web' ? 67 : insets.top;
  const uid = user?.id ?? '';
  const { data, isLoading, isError, refetch, isRefetching } = useGetUserListings(uid, {
    query: { enabled: !!uid, queryKey: getGetUserListingsQueryKey(uid), refetchOnMount: 'always' },
  });
  const create = () => router.push({ pathname: '/(tabs)/search', params: { mode: 'post', ts: String(Date.now()) } });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: top + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} hitSlop={10}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Mahsulotlarim</Text>
        <TouchableOpacity onPress={create} hitSlop={10} testID="my-products-add">
          <Feather name="plus-circle" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : isError ? (
        <EmptyState icon="alert-circle" title="Yuklab bo'lmadi" actionLabel="Qayta urinish" onAction={() => { void refetch(); }} />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState icon="package" title="Mahsulotlar yo'q" subtitle="Birinchi e'loningizni joylang" actionLabel="E'lon joylash" onAction={create} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(i) => i.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          renderItem={({ item }) => <ListingCard listing={item} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch(); }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
