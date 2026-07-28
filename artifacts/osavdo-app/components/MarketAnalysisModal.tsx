import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAnalyseListingMarket } from '@workspace/api-client-react';

interface MarketAnalysisModalProps {
  visible: boolean;
  listingId: string | null;
  onClose: () => void;
}

const POSITION_MAP: Record<string, { emoji: string; label: string; color: string }> = {
  juda_arzon:   { emoji: '🟢🟢', label: 'Juda arzon',  color: '#16a34a' },
  arzon:        { emoji: '🟢',   label: 'Arzon',       color: '#22c55e' },
  orta:         { emoji: '🟡',   label: "O'rtacha",    color: '#ca8a04' },
  qimmatroq:    { emoji: '🟠',   label: 'Qimmatroq',   color: '#ea580c' },
  juda_qimmat:  { emoji: '🔴',   label: 'Juda qimmat', color: '#dc2626' },
  kelishiladi:  { emoji: '🤝',   label: 'Kelishiladi', color: '#6366f1' },
  malumot_yoq:  { emoji: '❓',   label: "Ma'lumot yo'q", color: '#6b7280' },
};

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} mln`;
  if (n >= 1_000)     return `${Math.round(n / 1_000)}K`;
  return n.toLocaleString();
}

export function MarketAnalysisModal({ visible, listingId, onClose }: MarketAnalysisModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data, isLoading, isError } = useAnalyseListingMarket(
    listingId ?? '',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { query: { enabled: !!listingId && visible } as any },
  );

  const pos = data ? (POSITION_MAP[data.pricePosition] ?? POSITION_MAP.malumot_yoq) : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
          paddingTop: Platform.OS === 'ios' ? 16 : insets.top + 12,
        }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerIcon}>🤖</Text>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>AI Bozor Tahlili</Text>
              <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>E'loningiz tahlil qilindi</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              📊 Bozor narxlari tekshirilmoqda...{'\n'}
              📈 Raqobatchilar sanalmoqda...{'\n'}
              💡 Maslahatlar tayyorlanmoqda...
            </Text>
          </View>
        ) : isError || !data ? (
          <View style={styles.centered}>
            <Text style={{ fontSize: 40 }}>😕</Text>
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Tahlil yuklanmadi. Keyinroq urinib ko'ring.
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
            {/* Narx holati */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.mutedForeground }]}>💰 Narx holati</Text>
              <View style={styles.priceStatusRow}>
                <Text style={[styles.priceStatusLabel, { color: pos?.color ?? colors.text }]}>
                  {pos?.emoji} {pos?.label}
                </Text>
              </View>

              <View style={styles.statsRow}>
                <StatBox label="Bozor o'rtachasi" value={`${fmt(data.avgPrice)} so'm`} colors={colors} />
                <StatBox label="Eng arzon" value={`${fmt(data.minPrice)} so'm`} colors={colors} highlight="green" />
                <StatBox label="Eng qimmat" value={`${fmt(data.maxPrice)} so'm`} colors={colors} highlight="red" />
              </View>
            </View>

            {/* Raqobat */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.mutedForeground }]}>🏆 Raqobat</Text>
              <View style={styles.statsRow}>
                <StatBox label="Jami raqobatchi" value={`${data.totalCompetitors} ta`} colors={colors} />
                <StatBox label="Shu viloyatda" value={`${data.regionalCompetitors} ta`} colors={colors} />
              </View>
              <Text style={[styles.competitionNote, { color: colors.mutedForeground }]}>
                {data.totalCompetitors === 0
                  ? '🚀 Siz bu subkategoriyada dastlabki sotuvchilardansiz!'
                  : data.totalCompetitors < 5
                  ? '✅ Raqobat kam — ajoyib imkoniyat!'
                  : data.totalCompetitors < 20
                  ? '🟡 Raqobat o\'rtacha. Sifat va narx bilan farqlaning.'
                  : '🔴 Raqobat kuchli. Tavsif va rasmlarni kuchaytiring.'}
              </Text>
            </View>

            {/* Maslahat */}
            {data.advice && (
              <View style={[styles.card, styles.adviceCard, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
                <Text style={[styles.cardTitle, { color: colors.primary }]}>💡 Maslahat</Text>
                <Text style={[styles.adviceText, { color: colors.text }]}>{data.advice}</Text>
              </View>
            )}

            {/* Top kategoriyalar */}
            {data.topCategories.length > 0 && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.mutedForeground }]}>📈 Ko'p e'lon berilgan tovarlar</Text>
                {data.topCategories.map((cat, i) => (
                  <View key={cat.name} style={styles.topCatRow}>
                    <Text style={[styles.topCatRank, { color: colors.mutedForeground }]}>#{i + 1}</Text>
                    <Text style={[styles.topCatName, { color: colors.text }]}>{cat.name}</Text>
                    <Text style={[styles.topCatCount, { color: colors.primary }]}>{cat.count} ta</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.primary }]}
              onPress={onClose}
            >
              <Text style={[styles.closeButtonText, { color: colors.primaryForeground }]}>
                Bosh sahifaga qaytish
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function StatBox({
  label, value, colors, highlight,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof import('@/hooks/useColors').useColors>;
  highlight?: 'green' | 'red';
}) {
  const valueColor =
    highlight === 'green' ? '#16a34a'
    : highlight === 'red' ? '#dc2626'
    : colors.primary;

  return (
    <View style={[styles.statBox, { backgroundColor: colors.secondary }]}>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: { fontSize: 28 },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  loadingText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 24, textAlign: 'center' },
  content: { padding: 16, gap: 12 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  adviceCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  cardTitle: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  priceStatusRow: { flexDirection: 'row', alignItems: 'center' },
  priceStatusLabel: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  competitionNote: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  adviceText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  topCatRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  topCatRank: { fontSize: 12, fontFamily: 'Inter_500Medium', width: 24 },
  topCatName: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium' },
  topCatCount: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  closeButton: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  closeButtonText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
