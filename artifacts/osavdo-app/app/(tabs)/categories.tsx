import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGetCategories } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { EmptyState } from '@/components/EmptyState';

export default function CategoriesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: categories, isLoading, isError, refetch } = useGetCategories();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const top = Platform.OS === 'web' ? 67 : insets.top;

  function go(categoryId: string, subcategoryId?: string) {
    router.push({
      pathname: '/(tabs)/search',
      params: { mode: 'search', categoryId, subcategoryId: subcategoryId ?? '', ts: String(Date.now()) },
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: top + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Kategoriyalar</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: 'Inter_400Regular' }}>
          {categories ? `${categories.length} ta bo'lim` : ''}
        </Text>
      </View>
      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : isError || !categories ? (
        <EmptyState icon="alert-circle" title="Yuklab bo'lmadi" subtitle="Internetni tekshirib qayta urinib ko'ring" actionLabel="Qayta urinish" onAction={() => { void refetch(); }} />
      ) : categories.length === 0 ? (
        <EmptyState icon="grid" title="Kategoriyalar yo'q" />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 120 }}>
          {categories.map((cat) => {
            const isOpen = !collapsed.has(cat.id);
            return (
              <View key={cat.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity style={styles.row} onPress={() => setCollapsed((previous) => {
                  const next = new Set(previous);
                  if (next.has(cat.id)) next.delete(cat.id); else next.add(cat.id);
                  return next;
                })} testID={`cat-${cat.id}`}>
                  <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
                    <Feather name="grid" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>{cat.name}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{cat.subcategories.length}</Text>
                  <Feather name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
                {isOpen && (
                  <View style={styles.subs}>
                    <TouchableOpacity style={[styles.chip, { backgroundColor: colors.primary }]} onPress={() => go(cat.id)}>
                      <Text style={{ color: colors.primaryForeground, fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>Hammasi</Text>
                    </TouchableOpacity>
                    {cat.subcategories.map((sub) => (
                      <TouchableOpacity
                        key={sub.id}
                        style={[styles.chip, { backgroundColor: colors.secondary, borderColor: colors.border, borderWidth: 1 }]}
                        onPress={() => go(cat.id, sub.id)}
                      >
                        <Text style={{ color: colors.text, fontSize: 13 }}>{sub.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  subs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 12, paddingBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100 },
});
