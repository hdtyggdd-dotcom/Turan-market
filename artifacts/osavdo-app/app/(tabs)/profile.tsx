import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useGetUserListings } from '@workspace/api-client-react';
import { ListingCard } from '@/components/ListingCard';
import { EmptyState } from '@/components/EmptyState';
import { useRouter } from 'expo-router';

function StatBox({ label, value, colors }: { label: string; value: string | number; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.statBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color: colors.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function BadgeDisplay({ badge, verificationStatus, colors }: {
  badge: 'manufacturer' | 'reseller' | null;
  verificationStatus: string;
  colors: ReturnType<typeof useColors>;
}) {
  if (!badge && verificationStatus !== 'pending') return null;

  if (verificationStatus === 'pending') {
    return (
      <View style={[styles.badgeRow, { backgroundColor: colors.statusPending + '20' }]}>
        <Feather name="clock" size={14} color={colors.statusPending} />
        <Text style={[styles.badgeText, { color: colors.statusPending }]}>
          Tasdiqlanish kutilmoqda...
        </Text>
      </View>
    );
  }

  const isManufacturer = badge === 'manufacturer';
  const badgeColor = isManufacturer ? colors.manufacturerBadge : colors.resellerBadge;
  return (
    <View style={[styles.badgeRow, { backgroundColor: badgeColor + '20' }]}>
      <Text style={{ fontSize: 16 }}>{isManufacturer ? '✅' : '✔️'}</Text>
      <Text style={[styles.badgeText, { color: badgeColor }]}>
        {isManufacturer ? 'Ishlab chiqaruvchi' : 'Sotuvchi'}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const { data: myListings } = useGetUserListings(user?.id ?? '', {
    query: { enabled: !!user?.id },
  });

  function handleSignOut() {
    Alert.alert("Chiqish", "Rostdan ham chiqmoqchimisiz?", [
      { text: "Bekor qilish", style: "cancel" },
      {
        text: "Chiqish",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace('/auth/login');
        },
      },
    ]);
  }

  if (!user) return null;

  const roleLabel = { buyer: 'Xaridor', seller: 'Sotuvchi', driver: 'Haydovchi', admin: 'Admin' }[user.role] ?? user.role;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profil</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Feather name="log-out" size={22} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === 'web' ? 84 + 34 : 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + Info */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>{user.name}</Text>
            <Text style={[styles.profilePhone, { color: colors.mutedForeground }]}>{user.phone}</Text>
            <View style={[styles.roleBadge, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.roleText, { color: colors.primary }]}>{roleLabel}</Text>
            </View>
          </View>
        </View>

        {/* Seller badge */}
        {(user.sellerBadge || user.verificationStatus === 'pending') && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <BadgeDisplay
              badge={user.sellerBadge ?? null}
              verificationStatus={user.verificationStatus}
              colors={colors}
            />
          </View>
        )}

        {/* Location */}
        {(user.region || user.district) && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={16} color={colors.primary} />
              <Text style={[styles.locationText, { color: colors.text }]}>
                {[user.district?.name, user.region?.name].filter(Boolean).join(', ')}
              </Text>
            </View>
          </View>
        )}

        {/* Stats */}
        {user.role === 'seller' && (
          <View style={styles.statsRow}>
            <StatBox label="Sotuvlar" value={user.totalSales ?? 0} colors={colors} />
            <StatBox label="Reyting" value={user.rating ? `${user.rating} ⭐` : '—'} colors={colors} />
            <StatBox label="E'lonlar" value={myListings?.length ?? 0} colors={colors} />
          </View>
        )}

        {/* My listings */}
        {user.role === 'seller' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Mening e'lonlarim</Text>
            {(myListings?.length ?? 0) === 0 ? (
              <EmptyState
                icon="package"
                title="E'lonlar yo'q"
                subtitle="Birinchi e'loningizni joylang!"
                actionLabel="E'lon joylash"
                onAction={() => router.push('/(tabs)/create')}
              />
            ) : (
              <View style={styles.listingsGrid}>
                {(myListings ?? []).map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </View>
            )}
          </>
        )}

        {/* Verification CTA for sellers without badge */}
        {user.role === 'seller' && !user.sellerBadge && user.verificationStatus === 'none' && (
          <View style={[styles.verifyCard, { backgroundColor: colors.accent, borderColor: colors.primary + '40' }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.verifyTitle, { color: colors.primary }]}>
                ✅ Ishlab chiqaruvchi bo'ling
              </Text>
              <Text style={[styles.verifySubtitle, { color: colors.accentForeground }]}>
                Tasdiqlangan ishlab chiqaruvchilar ko'proq xaridorlarga ega!
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.verifyBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>Ariza</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  profileInfo: { flex: 1, gap: 3 },
  profileName: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  profilePhone: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
    marginTop: 4,
  },
  roleText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  section: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    marginTop: 4,
  },
  listingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  verifyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  verifyTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 3,
  },
  verifySubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  verifyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
});
