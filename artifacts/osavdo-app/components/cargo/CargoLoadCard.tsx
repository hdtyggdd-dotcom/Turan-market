import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { CargoLoad, CargoLoadStatus } from '@workspace/api-client-react';

const statusLabels: Record<string, string> = {
  [CargoLoadStatus.open]: 'Ochiq',
  [CargoLoadStatus.negotiating]: 'Kelishilmoqda',
  [CargoLoadStatus.accepted]: 'Qabul qilingan',
  [CargoLoadStatus.in_transit]: 'Yo\'lda',
  [CargoLoadStatus.delivered]: 'Yetkazildi',
  [CargoLoadStatus.cancelled]: 'Bekor qilingan',
};

const typeLabels: Record<string, string> = {
  general: 'Oddiy',
  fragile: 'Mo\'rt',
  perishable: 'Aynuvchan',
  livestock: 'Chorva',
  hazardous: 'Xavfli',
  construction: 'Qurilish',
};

export function CargoLoadCard({
  load,
  onPress,
}: {
  load: CargoLoad;
  onPress?: () => void;
}) {
  const colors = useColors();
  
  const statusColor = load.status === CargoLoadStatus.open ? colors.primary : 
                      load.status === CargoLoadStatus.delivered ? colors.statusDelivered : 
                      colors.mutedForeground;

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {load.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabels[load.status] || load.status}
            </Text>
          </View>
        </View>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>
          Jo'nash: {new Date(load.pickupDate).toLocaleDateString('uz-UZ')}
        </Text>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeItem}>
          <View style={[styles.dot, { backgroundColor: colors.statusConfirmed }]} />
          <View style={styles.routeTextContainer}>
            <Text style={[styles.routeLabel, { color: colors.mutedForeground }]}>Qayerdan</Text>
            <Text style={[styles.routeValue, { color: colors.text }]} numberOfLines={1}>
              {load.pickupRegionId}, {load.pickupDistrictId}
            </Text>
          </View>
        </View>
        <View style={[styles.routeLine, { borderLeftColor: colors.border }]} />
        <View style={styles.routeItem}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <View style={styles.routeTextContainer}>
            <Text style={[styles.routeLabel, { color: colors.mutedForeground }]}>Qayerga</Text>
            <Text style={[styles.routeValue, { color: colors.text }]} numberOfLines={1}>
              {load.deliveryRegionId}, {load.deliveryDistrictId}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <View style={[styles.detailBadge, { backgroundColor: colors.muted }]}>
          <Feather name="box" size={14} color={colors.mutedForeground} />
          <Text style={[styles.detailText, { color: colors.text }]}>{load.weightKg} kg</Text>
        </View>
        <View style={[styles.detailBadge, { backgroundColor: colors.muted }]}>
          <Feather name="maximize" size={14} color={colors.mutedForeground} />
          <Text style={[styles.detailText, { color: colors.text }]}>{load.volumeM3} m³</Text>
        </View>
        <View style={[styles.detailBadge, { backgroundColor: colors.muted }]}>
          <Feather name="tag" size={14} color={colors.mutedForeground} />
          <Text style={[styles.detailText, { color: colors.text }]}>{typeLabels[load.cargoType] || load.cargoType}</Text>
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.priceContainer}>
          <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Budjet</Text>
          <Text style={[styles.price, { color: colors.primary }]}>
            {load.budgetUzs ? `${load.budgetUzs.toLocaleString()} UZS` : 'Kelishiladi'}
          </Text>
        </View>
        
        {load.sharedLoadAllowed && (
          <View style={[styles.sharedBadge, { backgroundColor: colors.accent }]}>
            <Text style={[styles.sharedText, { color: colors.accentForeground }]}>Hamroh yuk (Kichik)</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: {
    padding: 14,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  date: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  routeContainer: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeLine: {
    position: 'absolute',
    left: 18,
    top: 20,
    bottom: -8,
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
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  routeValue: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  detailText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  priceContainer: {
    gap: 2,
  },
  priceLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  price: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  sharedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sharedText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
});
