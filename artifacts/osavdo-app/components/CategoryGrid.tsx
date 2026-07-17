import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
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

export function CategoryGrid({ categories, selected, onSelect }: CategoryGridProps) {
  const colors = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* All */}
      <TouchableOpacity
        style={[
          styles.chip,
          {
            backgroundColor: selected === null ? colors.primary : colors.card,
            borderColor: selected === null ? colors.primary : colors.border,
          },
        ]}
        onPress={() => onSelect(null)}
      >
        <Text style={styles.icon}>🏪</Text>
        <Text
          style={[
            styles.label,
            { color: selected === null ? colors.primaryForeground : colors.text },
          ]}
        >
          Hammasi
        </Text>
      </TouchableOpacity>

      {categories.map((cat) => {
        const isSelected = selected === cat.id;
        return (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? colors.primary : colors.card,
                borderColor: isSelected ? colors.primary : colors.border,
              },
            ]}
            onPress={() => onSelect(isSelected ? null : cat.id)}
          >
            <Text style={styles.icon}>{cat.icon}</Text>
            <Text
              style={[
                styles.label,
                { color: isSelected ? colors.primaryForeground : colors.text },
              ]}
              numberOfLines={1}
            >
              {cat.name.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  icon: {
    fontSize: 15,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
});
