import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useColors } from '@/hooks/useColors';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface CategoryGridProps {
  categories: Category[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

const COLS = 5;
const H_PAD = 12;
const GAP = 8;

export function CategoryGrid({ categories, selected, onSelect }: CategoryGridProps) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const itemSize = (width - H_PAD * 2 - GAP * (COLS - 1)) / COLS;

  const all = [{ id: '__all__', name: 'Hammasi', icon: '🏪' }, ...categories];

  return (
    <View style={[styles.grid, { paddingHorizontal: H_PAD, gap: GAP }]}>
      {all.map((cat) => {
        const isSelected = cat.id === '__all__' ? selected === null : selected === cat.id;
        const handlePress = () => onSelect(cat.id === '__all__' ? null : (isSelected ? null : cat.id));

        // short label: first word, max 8 chars
        const label = cat.name.split(' ')[0].slice(0, 9);

        return (
          <TouchableOpacity
            key={cat.id}
            onPress={handlePress}
            activeOpacity={0.75}
            style={[
              styles.item,
              {
                width: itemSize,
                backgroundColor: isSelected ? colors.primary + '15' : colors.card,
                borderColor: isSelected ? colors.primary : colors.border,
              },
            ]}
          >
            <View style={[
              styles.iconWrap,
              {
                backgroundColor: isSelected ? colors.primary : colors.secondary,
              }
            ]}>
              <Text style={styles.icon}>{cat.icon}</Text>
            </View>
            <Text
              style={[
                styles.label,
                { color: isSelected ? colors.primary : colors.text },
              ]}
              numberOfLines={2}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 10,
  },
  item: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
    marginBottom: GAP,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    lineHeight: 13,
  },
});
