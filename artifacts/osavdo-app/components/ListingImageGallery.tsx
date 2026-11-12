import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { ListingPhoto } from './ListingPhoto';

export function ListingImageGallery({ images }: { images: string[] }) {
  const colors = useColors();
  const scroll = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  function move(next: number) {
    scroll.current?.scrollTo({ x: next * width, animated: true });
    setIndex(next);
  }
  return (
    <View style={[styles.gallery, { backgroundColor: colors.secondary }]} onLayout={(event) => {
      const next = event.nativeEvent.layout.width;
      if (next !== width) { setWidth(next); setIndex(0); }
    }}>
      {images.length === 0 ? <View style={styles.empty}>
        <Feather name="image" size={48} color={colors.mutedForeground} />
        <Text style={{ color: colors.mutedForeground }}>E’longa rasm qo‘shilmagan</Text>
      </View> : width > 0 && <ScrollView
        ref={scroll}
        key={width}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => setIndex(Math.max(0, Math.min(images.length - 1, Math.round(event.nativeEvent.contentOffset.x / width))))}
      >
        {images.map((source, i) => <ListingPhoto key={`${source}-${i}`} source={source} contain style={{ width, height: 260 }} />)}
      </ScrollView>}
      {images.length > 1 && <View style={styles.controls}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Oldingi rasm" disabled={index === 0} onPress={() => move(index - 1)} style={[styles.arrow, { opacity: index === 0 ? 0.4 : 1 }]}>
          <Feather name="chevron-left" color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.counter}>{index + 1} / {images.length}</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Keyingi rasm" disabled={index === images.length - 1} onPress={() => move(index + 1)} style={[styles.arrow, { opacity: index === images.length - 1 ? 0.4 : 1 }]}>
          <Feather name="chevron-right" color="#fff" size={24} />
        </TouchableOpacity>
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  gallery: { height: 260, width: '100%' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  controls: { position: 'absolute', bottom: 8, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 24, backgroundColor: '#0009' },
  counter: { color: '#fff', fontSize: 13 },
  arrow: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
});
