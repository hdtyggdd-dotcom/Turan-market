import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGetRegions, useGetDistricts } from '@workspace/api-client-react';
import { useLocation } from '@/context/LocationContext';

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
}

export function LocationPicker({ visible, onClose }: LocationPickerProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setLocation, countryId } = useLocation();
  const [step, setStep] = useState<'region' | 'district'>('region');
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedRegionName, setSelectedRegionName] = useState<string | null>(null);

  const currentCountryId = countryId ?? 'uz';

  const { data: regions, isLoading: regionsLoading } = useGetRegions(
    { countryId: currentCountryId },
  );
  const { data: districtsData, isLoading: districtsLoading } = useGetDistricts(
    { regionId: selectedRegionId ?? undefined },
    { query: { enabled: !!selectedRegionId && step === 'district' } },
  );

  function handleSelectRegion(id: string, name: string) {
    setSelectedRegionId(id);
    setSelectedRegionName(name);
    setStep('district');
  }

  function handleSelectDistrict(id: string, name: string, lat?: number | null, lng?: number | null) {
    setLocation({
      regionId: selectedRegionId,
      regionName: selectedRegionName,
      districtId: id,
      districtName: name,
      lat: lat ?? null,
      lng: lng ?? null,
    });
    handleClose();
  }

  function handleClose() {
    setStep('region');
    setSelectedRegionId(null);
    setSelectedRegionName(null);
    onClose();
  }

  function handleBack() {
    setStep('region');
    setSelectedRegionId(null);
    setSelectedRegionName(null);
  }

  const isLoading = step === 'region' ? regionsLoading : districtsLoading;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              borderBottomColor: colors.border,
              paddingTop: Platform.OS === 'ios' ? 16 : insets.top + 16,
            },
          ]}
        >
          {step === 'district' ? (
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Feather name="arrow-left" size={22} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtn} />
          )}
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {step === 'region' ? 'Viloyat tanlang' : selectedRegionName ?? 'Tuman tanlang'}
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={step === 'region' ? regions ?? [] : districtsData ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) =>
              step === 'region' ? (
                <TouchableOpacity
                  style={[styles.item, { borderBottomColor: colors.border }]}
                  onPress={() => handleSelectRegion(item.id, item.name)}
                >
                  <View>
                    <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.itemNameRu, { color: colors.mutedForeground }]}>
                      {item.nameRu}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.item, { borderBottomColor: colors.border }]}
                  onPress={() =>
                    handleSelectDistrict(
                      item.id,
                      item.name,
                      (item as { lat?: number }).lat,
                      (item as { lng?: number }).lng,
                    )
                  }
                >
                  <View>
                    <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.itemNameRu, { color: colors.mutedForeground }]}>
                      {item.nameRu}
                    </Text>
                  </View>
                  <Feather name="check" size={18} color={colors.primary} />
                </TouchableOpacity>
              )
            }
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  backBtn: {
    width: 40,
    alignItems: 'flex-start',
  },
  closeBtn: {
    width: 40,
    alignItems: 'flex-end',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemName: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  itemNameRu: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
});
