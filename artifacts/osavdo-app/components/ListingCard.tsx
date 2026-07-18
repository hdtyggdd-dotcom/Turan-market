import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Listing {
  id: string;
  title: string;
  price: number;
  priceUnit?: string | null;
  images: string[];
  distanceKm?: number | null;
  distanceColor?: 'green' | 'yellow' | 'red' | null;
  priceColor?: 'green' | 'yellow' | 'red' | null;
  district?: { name: string } | null;
  region?: { name: string } | null;
  user?: {
    name: string;
    sellerBadge?: 'manufacturer' | 'reseller' | null;
  } | null;
  viewCount: number;
  createdAt: string;
}

interface ListingCardProps {
  listing: Listing;
}

const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2;

function formatPrice(price: number): string {
  if (price >= 1_000_000) {
    return `${(price / 1_000_000).toFixed(1)} mln`;
  }
  if (price >= 1000) {
    return `${Math.round(price / 1000)}K`;
  }
  return price.toLocaleString();
}

function DistanceDot({ color }: { color: 'green' | 'yellow' | 'red' | null | undefined }) {
  const colors = useColors();
  if (!color) return null;
  const dotColor =
    color === 'green'
      ? colors.distanceGreen
      : color === 'yellow'
        ? colors.distanceYellow
        : colors.distanceRed;
  return <View style={[styles.distanceDot, { backgroundColor: dotColor }]} />;
}

function SellerBadge({ badge }: { badge?: 'manufacturer' | 'reseller' | null }) {
  const colors = useColors();
  if (!badge) return null;
  const isManufacturer = badge === 'manufacturer';
  return (
    <View
      style={[
        styles.badgeContainer,
        {
          backgroundColor: isManufacturer
            ? colors.manufacturerBadge + '20'
            : colors.resellerBadge + '20',
        },
      ]}
    >
      <Text style={[styles.badgeText, { color: isManufacturer ? colors.manufacturerBadge : colors.resellerBadge }]}>
        {isManufacturer ? '✅ Ishlab chiqaruvchi' : '✔️ Sotuvchi'}
      </Text>
    </View>
  );
}

export function ListingCard({ listing }: ListingCardProps) {
  const colors = useColors();
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/listing/${listing.id}`)}
      activeOpacity={0.9}
    >
      {/* Image */}
      <View style={[styles.imageContainer, { backgroundColor: colors.secondary }]}>
        {listing.images.length > 0 ? (
          <Image source={{ uri: listing.images[0] }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Feather name="image" size={28} color={colors.mutedForeground} />
          </View>
        )}

        {/* Distance dot */}
        <View style={styles.distanceCorner}>
          <DistanceDot color={listing.distanceColor} />
          {listing.distanceKm != null && (
            <Text style={[styles.distanceText, { color: colors.mutedForeground }]}>
              {listing.distanceKm} km
            </Text>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[styles.title, { color: colors.text }]}
          numberOfLines={2}
        >
          {listing.title}
        </Text>

        <View style={styles.priceRow}>
          {listing.priceColor && (
            <View style={[
              styles.priceDot,
              {
                backgroundColor:
                  listing.priceColor === 'green' ? colors.distanceGreen
                  : listing.priceColor === 'yellow' ? colors.distanceYellow
                  : colors.distanceRed,
              },
            ]} />
          )}
          <Text style={[styles.price, { color: colors.primary }]}>
            {formatPrice(listing.price)} so'm
            {listing.priceUnit ? (
              <Text style={[styles.priceUnit, { color: colors.mutedForeground }]}>
                {' '}/{listing.priceUnit}
              </Text>
            ) : null}
          </Text>
        </View>

        {/* Location */}
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={10} color={colors.mutedForeground} />
          <Text style={[styles.locationText, { color: colors.mutedForeground }]} numberOfLines={1}>
            {listing.district?.name ?? listing.region?.name ?? '—'}
          </Text>
        </View>

        {/* Seller badge */}
        {listing.user?.sellerBadge && (
          <SellerBadge badge={listing.user.sellerBadge} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 0.75,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceCorner: {
    position: 'absolute',
    top: 8,
    right: 8,
    alignItems: 'center',
    gap: 2,
  },
  distanceDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  distanceText: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
  },
  content: {
    padding: 10,
    gap: 4,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  priceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  price: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    flex: 1,
  },
  priceUnit: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  badgeContainer: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
  },
});
