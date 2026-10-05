import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGetDriver, getGetDriverQueryKey } from '@workspace/api-client-react';

export default function DriverProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data: driver, isLoading } = useGetDriver(id!, {
    query: { enabled: !!id, queryKey: getGetDriverQueryKey(id!), refetchInterval: 15_000, refetchOnMount: 'always' },
  });

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Haydovchi', headerTransparent: true }} />
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!driver) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Haydovchi topilmadi' }} />
        <Text style={{ color: colors.mutedForeground }}>Ma'lumot topilmadi.</Text>
      </View>
    );
  }

  const isVerified = driver.operational === true;
  const verificationColor = isVerified
    ? colors.statusConfirmed
    : colors.statusPending;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Haydovchi profili",
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: true,
        }}
      />
      
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.headerInfo}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>{driver.user.name.charAt(0)}</Text>
            </View>
            <View style={styles.nameContainer}>
              <Text style={[styles.name, { color: colors.text }]}>{driver.user.name}</Text>
              <View style={styles.ratingRow}>
                <Feather name="star" size={14} color={colors.statusPending} style={{ marginTop: -2 }} />
                <Text style={[styles.rating, { color: colors.text }]}>
                  {driver.rating} ({driver.ratingCount} baho)
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.verificationBadge, { backgroundColor: verificationColor + '15' }]}>
            <Feather name={isVerified ? 'shield' : 'clock'} size={16} color={verificationColor} />
            <Text style={[styles.verificationText, { color: verificationColor }]}>
              {isVerified ? 'Tasdiqlangan haydovchi' : 'Tekshiruv kutilmoqda'}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{driver.completedTrips}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Bajarilgan qatnovlar</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{new Date(driver.user.createdAt).getFullYear()}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Dan beri tizimda</Text>
          </View>
        </View>

        {isVerified ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Transport vositasi</Text>
            <View style={[styles.vehicleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.vehicleHeader}>
                <Feather name="truck" size={24} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.vehicleName, { color: colors.text }]}>{driver.vehicleType.name}</Text>
                  <Text style={[styles.plateNumber, { color: colors.mutedForeground }]}>{driver.vehiclePlate}</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.capacityRow}>
                <View style={styles.capacityItem}>
                  <Text style={[styles.capacityLabel, { color: colors.mutedForeground }]}>Yuk ko'tarish</Text>
                  <Text style={[styles.capacityValue, { color: colors.text }]}>{driver.capacityKg ?? driver.vehicleType.capacityKg} kg</Text>
                </View>
                <View style={styles.capacityItem}>
                  <Text style={[styles.capacityLabel, { color: colors.mutedForeground }]}>Hajm</Text>
                  <Text style={[styles.capacityValue, { color: colors.text }]}>{driver.capacityM3 ?? driver.vehicleType.capacityM3} m³</Text>
                </View>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Hamroh yuk (Pochta)</Text>
            <View style={[styles.sharedLoadCard, { backgroundColor: colors.accent, borderColor: colors.primary + '30' }]}>
              <Text style={[styles.sharedTitle, { color: colors.accentForeground }]}>
                Bo'sh joy mavjud:
              </Text>
              <View style={styles.capacityRow}>
                <View style={styles.capacityItem}>
                  <Text style={[styles.capacityLabel, { color: colors.accentForeground }]}>Og'irlik</Text>
                  <Text style={[styles.sharedValue, { color: colors.accentForeground }]}>{driver.sharedLoadAvailableKg} kg gacha</Text>
                </View>
                <View style={styles.capacityItem}>
                  <Text style={[styles.capacityLabel, { color: colors.accentForeground }]}>Hajm</Text>
                  <Text style={[styles.sharedValue, { color: colors.accentForeground }]}>{driver.sharedLoadAvailableM3} m³ gacha</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={[styles.pendingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="alert-circle" size={22} color={colors.statusPending} />
            <View style={styles.pendingCopy}>
              <Text style={[styles.pendingTitle, { color: colors.text }]}>
                Transport hali tasdiqlanmagan
              </Text>
              <Text style={[styles.pendingText, { color: colors.mutedForeground }]}>
                Hujjatlar va davlat raqami tekshirilgach, haydovchi yuklarga taklif bera oladi.
              </Text>
            </View>
          </View>
        )}
        
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Bo'sh bo'ladi</Text>
        <View style={[styles.bioCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.bio, { color: colors.text }]}>{new Date(driver.availableFrom).toLocaleString()}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Tasdiqlangan hujjatlar</Text>
        <View style={[styles.bioCard, { backgroundColor: colors.card, borderColor: colors.border, gap: 6 }]}>
          {driver.verifiedDocuments?.length ? driver.verifiedDocuments.map((d) => (
            <Text key={d.id} style={[styles.bio, { color: colors.text }]}>
              {{ identity: 'Shaxs hujjati', license: 'Haydovchilik guvohnomasi', registration: 'Transport guvohnomasi' }[d.kind]}
              {d.reviewedAt ? ` · ${new Date(d.reviewedAt).toLocaleDateString()}` : ''}
            </Text>
          )) : <Text style={[styles.bio, { color: colors.mutedForeground }]}>Tasdiqlangan hujjat yo'q.</Text>}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Baholar</Text>
        <View style={[styles.bioCard, { backgroundColor: colors.card, borderColor: colors.border, gap: 10 }]}>
          {driver.ratingHistory?.length ? driver.ratingHistory.map((r) => (
            <View key={r.id}>
              <Text style={[styles.bio, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>{r.score}/5 · {new Date(r.createdAt).toLocaleDateString()}</Text>
              {!!r.comment && <Text style={[styles.bio, { color: colors.mutedForeground }]}>{r.comment}</Text>}
            </View>
          )) : <Text style={[styles.bio, { color: colors.mutedForeground }]}>Hali baho berilmagan.</Text>}
        </View>

        {driver.bio && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Qo'shimcha</Text>
            <View style={[styles.bioCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.bio, { color: colors.text }]}>{driver.bio}</Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 16 },
  profileCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  rating: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  verificationText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  pendingCopy: {
    flex: 1,
    gap: 4,
  },
  pendingTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  pendingText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginTop: 8,
  },
  vehicleCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  plateNumber: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  capacityRow: {
    flexDirection: 'row',
  },
  capacityItem: {
    flex: 1,
  },
  capacityLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  capacityValue: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 4,
  },
  sharedLoadCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  sharedTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
  },
  sharedValue: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    marginTop: 4,
  },
  bioCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  bio: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
});
