import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGetOrders } from '@workspace/api-client-react';
import { EmptyState } from '@/components/EmptyState';
import { useRouter } from 'expo-router';

const STATUS_LABELS: Record<string, string> = {
  pending: "Kutilmoqda",
  confirmed: "Tasdiqlangan",
  delivering: "Yetkazilmoqda",
  delivered: "Yetkazildi",
  cancelled: "Bekor qilindi",
};

const STATUS_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  pending: "clock",
  confirmed: "check-circle",
  delivering: "truck",
  delivered: "check-square",
  cancelled: "x-circle",
};

function formatPrice(price: number): string {
  return price.toLocaleString() + " so'm";
}

type OrderItem = NonNullable<ReturnType<typeof useGetOrders>['data']>[number];

function OrderCard({ order, colors, onPress }: { order: OrderItem; colors: ReturnType<typeof useColors>; onPress: () => void }) {
  const statusColor = {
    pending: colors.statusPending,
    confirmed: colors.statusConfirmed,
    delivering: colors.statusDelivering,
    delivered: colors.statusDelivered,
    cancelled: colors.statusCancelled,
  }[order.status] ?? colors.mutedForeground;

  const icon = STATUS_ICONS[order.status] ?? 'clock';
  const date = new Date(order.createdAt).toLocaleDateString('uz-Latn', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <TouchableOpacity
      style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.orderHeader}>
        <Text style={[styles.orderTitle, { color: colors.text }]} numberOfLines={2}>
          {order.listing?.title ?? '—'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Feather name={icon} size={12} color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {STATUS_LABELS[order.status]}
          </Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Feather name="package" size={13} color={colors.mutedForeground} />
          <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
            {order.quantity} ta
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Feather name="credit-card" size={13} color={colors.mutedForeground} />
          <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
            {formatPrice(order.totalPrice)}
          </Text>
        </View>
        {order.deliveryPrice && (
          <View style={styles.detailRow}>
            <Feather name="truck" size={13} color={colors.mutedForeground} />
            <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
              + {formatPrice(order.deliveryPrice)} dostavka
            </Text>
          </View>
        )}
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.sellerRow}>
          <Feather name="user" size={12} color={colors.mutedForeground} />
          <Text style={[styles.sellerText, { color: colors.mutedForeground }]}>
            {order.seller?.name ?? '—'}
          </Text>
        </View>
        <Text style={[styles.dateText, { color: colors.mutedForeground }]}>{date}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const { data: orders, isLoading, refetch, isRefetching } = useGetOrders();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Buyurtmalar</Text>
      </View>

      <FlatList
        data={orders ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Platform.OS === 'web' ? 84 + 34 : 100 },
          (orders?.length ?? 0) === 0 && !isLoading ? { flex: 1 } : undefined,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching || isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            colors={colors}
            onPress={() => {}}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="shopping-bag"
              title="Buyurtmalar yo'q"
              subtitle="Hali birorta buyurtma bermagansiz. Savatdan xarid qiling!"
            />
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
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
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  orderCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  orderTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  orderDetails: {
    gap: 5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sellerText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
