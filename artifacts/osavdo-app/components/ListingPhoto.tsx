import React, { useState } from 'react';
import { View, Text, Image, ActivityIndicator, TouchableOpacity, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getBaseUrl } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { resolveListingImageUrl } from '@/services/listing-image';

export function ListingPhoto({ source, style, contain = false }: {
  source: string;
  style?: StyleProp<ViewStyle>;
  contain?: boolean;
}) {
  const uri = resolveListingImageUrl(source, getBaseUrl());
  // A changed source remounts the loader rather than retaining an old error.
  return <PhotoLoader key={uri ?? source} uri={uri} style={style} contain={contain} />;
}

function PhotoLoader({ uri, style, contain }: { uri: string | null; style?: StyleProp<ViewStyle>; contain: boolean }) {
  const colors = useColors();
  const [loading, setLoading] = useState(Boolean(uri));
  const [failed, setFailed] = useState(!uri);
  const [attempt, setAttempt] = useState(0);
  return (
    <View style={[{ backgroundColor: colors.secondary, overflow: 'hidden' }, style]}>
      {uri && !failed && <Image
        key={attempt}
        source={{ uri }}
        accessibilityLabel="E’lon rasmi"
        style={StyleSheet.absoluteFill}
        resizeMode={contain ? 'contain' : 'cover'}
        onLoad={() => setLoading(false)}
        onError={() => { setLoading(false); setFailed(true); }}
      />}
      {loading && <View pointerEvents="none" style={styles.overlay}><ActivityIndicator color={colors.primary} /></View>}
      {failed && <View style={styles.overlay}>
        <Feather name="image" size={24} color={colors.mutedForeground} />
        <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Rasm yuklanmadi</Text>
        {uri && <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Rasmni qayta yuklash"
          style={styles.retry}
          onPress={(event) => {
            event.stopPropagation();
            setFailed(false);
            setLoading(true);
            setAttempt(attempt + 1);
          }}
        ><Text style={{ color: colors.primary }}>Qayta urinish</Text></TouchableOpacity>}
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 6 },
  retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
});
