import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetRegions, useGetDistricts, getGetDistrictsQueryKey } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useI18n } from '@/context/I18nContext';

export interface ListingLocationValue { regionId: string; districtId: string }

export function ListingLocationFields({ countryId, value, onChange }: {
  countryId: string;
  value: ListingLocationValue;
  onChange: (value: ListingLocationValue) => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, lang } = useI18n();
  const [open, setOpen] = useState<'region' | 'district' | null>(null);
  const previousCountry = useRef(countryId);
  const regions = useGetRegions({ countryId });
  const districts = useGetDistricts({ regionId: value.regionId || undefined }, {
    query: { enabled: !!value.regionId, queryKey: getGetDistrictsQueryKey({ regionId: value.regionId || undefined }) },
  });
  useEffect(() => {
    if (previousCountry.current !== countryId) {
      previousCountry.current = countryId;
      onChange({ regionId: '', districtId: '' });
      setOpen(null);
    }
  }, [countryId, onChange]);

  const name = (item?: { name: string; nameRu: string }) => item ? (lang === 'ru' ? item.nameRu : item.name) : '';
  const region = regions.data?.find(item => item.id === value.regionId);
  const district = districts.data?.find(item => item.id === value.districtId && item.regionId === value.regionId);
  const query = open === 'district' ? districts : regions;
  const options: { id: string; name: string; nameRu: string }[] = open === 'district'
    ? (districts.data ?? []).filter(item => item.regionId === value.regionId)
    : (regions.data ?? []).filter(item => item.countryId === countryId);

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: colors.text, fontSize: 16, fontFamily: 'Inter_600SemiBold' }}>E’lon joylashuvi</Text>
      <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Tovar yoki xizmat qaysi hududda ekanini tanlang.</Text>
      {(['region', 'district'] as const).map(kind => {
        const label = t(kind);
        const disabled = kind === 'district' && !region;
        return (
          <View key={kind}>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 6 }}>{label} *</Text>
            <TouchableOpacity
              accessibilityRole="button" accessibilityLabel={`${label} tanlash`}
              accessibilityState={{ disabled: !!disabled }}
              disabled={!!disabled} onPress={() => setOpen(kind)}
              style={[styles.field, { borderColor: colors.border, backgroundColor: colors.card, opacity: disabled ? 0.5 : 1 }]}
            >
              <Text style={{ flex: 1, color: colors.text, fontSize: 15 }}>
                {kind === 'region' ? name(region) || 'Viloyatni tanlang'
                  : name(district) || (disabled ? 'Avval viloyatni tanlang' : 'Tumanni tanlang')}
              </Text>
              <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        );
      })}
      <Modal visible={open !== null} animationType="slide" onRequestClose={() => setOpen(null)}>
        <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }}>
          <View style={styles.modalHeader}>
            <Text style={{ flex: 1, color: colors.text, fontSize: 20 }}>{open === 'region' ? 'Viloyatni tanlang' : 'Tumanni tanlang'}</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Yopish" onPress={() => setOpen(null)} style={{ padding: 12 }}>
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          {query.isLoading || query.isFetching ? <ActivityIndicator color={colors.primary} /> : query.isError ? (
            <View style={{ padding: 20, gap: 12 }}>
              <Text style={{ color: colors.text }}>Hududlar yuklanmadi. Internetni tekshirib, qayta urining.</Text>
              <TouchableOpacity accessibilityRole="button" onPress={() => void query.refetch()}>
                <Text style={{ color: colors.primary }}>Qayta yuklash</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList data={options} keyExtractor={item => item.id}
              ListEmptyComponent={<Text style={{ padding: 20, color: colors.mutedForeground }}>Bu hudud uchun ro‘yxat topilmadi.</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity accessibilityRole="button" onPress={() => {
                  onChange(open === 'region' ? { regionId: item.id, districtId: '' } : { ...value, districtId: item.id });
                  setOpen(null);
                }} style={[styles.option, { borderBottomColor: colors.border }]}>
                  <Text style={{ color: colors.text, fontSize: 16 }}>{name(item)}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 14, minHeight: 48 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  option: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, minHeight: 48 },
});
