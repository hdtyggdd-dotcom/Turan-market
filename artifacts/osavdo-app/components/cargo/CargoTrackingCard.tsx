import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  AppState,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useQueryClient } from '@tanstack/react-query';
import {
  CargoTrackingCurrentStage,
  CargoTrackingUpdateInputStage,
  getGetCargoLoadQueryKey,
  getGetCargoTrackingQueryKey,
  getGetCargoLoadsQueryKey,
  getGetNotificationsQueryKey,
  useGetCargoTracking,
  useUpdateCargoTracking,
  updateCargoLocation,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { CargoRouteMap } from './CargoRouteMap';
import { useAuth } from '@/context/AuthContext';
import {
  cargoBackgroundAvailable, getCargoBackgroundSharing,
  startCargoBackgroundSharing, stopCargoBackgroundSharing,
} from '@/services/cargo-background-location';

const stages = [
  CargoTrackingCurrentStage.accepted,
  CargoTrackingCurrentStage.pickup_ready,
  CargoTrackingCurrentStage.picked_up,
  CargoTrackingCurrentStage.in_transit,
  CargoTrackingCurrentStage.border_control,
  CargoTrackingCurrentStage.delivered,
] as const;

const stageLabels: Record<string, string> = {
  accepted: 'Tashuv tasdiqlandi',
  pickup_ready: 'Yuklashga tayyor',
  picked_up: 'Yuk olindi',
  in_transit: "Yo'lda",
  border_control: 'Chegara nazoratida',
  delivered: 'Yetkazildi',
};

type Coordinate = { latitude: number; longitude: number };

async function getWebPosition(): Promise<Coordinate> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Brauzer joylashuvni qo‘llamaydi'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      reject,
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  });
}

export function CargoTrackingCard({
  loadId,
  canUpdate,
}: {
  loadId: string;
  canUpdate: boolean;
}) {
  const colors = useColors();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [sharing, setSharing] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [backgroundSharing, setBackgroundSharing] = useState(false);
  const [backgroundAvailable, setBackgroundAvailable] = useState(false);
  const [backgroundBusy, setBackgroundBusy] = useState(false);
  const [clock, setClock] = useState(Date.now());
  const liveRequest = useRef(false);
  const [permission, requestPermission] = Location.useForegroundPermissions();
  const { data: tracking, isLoading } = useGetCargoTracking(loadId, {
    query: {
      queryKey: getGetCargoTrackingQueryKey(loadId),
      refetchInterval: 10_000,
    },
  });
  const updateTracking = useUpdateCargoTracking();
  useFocusEffect(useCallback(() => () => setSharing(false), []));

  const currentIndex = stages.findIndex((stage) => stage === tracking?.currentStage);
  const nextStage = stages[currentIndex + 1];

  const allowedToUpdate = canUpdate && tracking?.canUpdate;
  const freshGps = !!tracking?.locationUpdatedAt &&
    clock - new Date(tracking.locationUpdatedAt).getTime() < 180_000 &&
    tracking.currentStage !== 'delivered';

  useEffect(() => {
    let active = true;
    const check = async () => {
      const available = await cargoBackgroundAvailable();
      const activeLoad = available ? await getCargoBackgroundSharing() : null;
      if (active) {
        setBackgroundAvailable(available);
        setBackgroundSharing(activeLoad === loadId);
        setClock(Date.now());
      }
    };
    void check().catch(() => {});
    const timer = setInterval(() => { void check().catch(() => {}); }, 5_000);
    return () => { active = false; clearInterval(timer); };
  }, [loadId]);

  useEffect(() => {
    if (tracking && !allowedToUpdate) {
      setSharing(false);
      void stopCargoBackgroundSharing(loadId).then(() => setBackgroundSharing(false))
        .catch(() => setLocationError('Fon GPS to‘xtashini tekshirish uchun ilova sozlamalarini oching.'));
    }
  }, [tracking?.canUpdate, tracking?.currentStage, allowedToUpdate, loadId]);

  const toggleBackground = async () => {
    if (backgroundSharing) {
      setBackgroundBusy(true);
      try {
        await stopCargoBackgroundSharing(loadId);
        setBackgroundSharing(false);
        setLocationError('');
      } catch {
        setLocationError('GPS to‘xtatilmadi. Ilova sozlamalarida joylashuvni o‘chiring.');
      } finally { setBackgroundBusy(false); }
      return;
    }
    Alert.alert(
      'Fon GPS ulashishga rozimisiz?',
      'GPS faqat ushbu yuk egasiga ekran yopiq paytda ham yuboriladi. Taxminan 1 daqiqa / 100 metr oralig‘ida, batareyani tejovchi aniqlikda ishlaydi. Yetkazilganda yoki siz to‘xtatganda tugaydi. Android ruxsat sozlamalarini ochishi mumkin: “Har doim”ni tanlang. Ilovani majburan yopish yoki telefon cheklovlari GPSni to‘xtatishi mumkin.',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        { text: 'Roziman, yoqish', onPress: () => {
          setBackgroundBusy(true);
          void (async () => {
            try {
              if (!user) throw new Error('Hisobga kiring.');
              setSharing(false);
              await startCargoBackgroundSharing(loadId, user.id);
              setBackgroundSharing(true);
              setLocationError('');
            } catch (error) {
              setLocationError(error instanceof Error ? error.message : 'Fon GPS yoqilmadi.');
            } finally { setBackgroundBusy(false); }
          })();
        } },
      ],
    );
  };

  const getCurrentCoordinate = async (): Promise<Coordinate> => {
    if (Platform.OS === 'web') return getWebPosition();
    let resolvedPermission = permission;
    if (!resolvedPermission?.granted) {
      resolvedPermission = await requestPermission();
    }
    if (!resolvedPermission.granted) {
      if (!resolvedPermission.canAskAgain) {
        Alert.alert(
          'Joylashuv o‘chiq',
          'GPS holatini ulash uchun ilova sozlamalarida joylashuv ruxsatini yoqing.',
          [
            { text: 'Bekor qilish', style: 'cancel' },
            { text: 'Sozlamalar', onPress: () => Linking.openSettings() },
          ],
        );
      }
      throw new Error('Joylashuv ruxsati berilmadi');
    }
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return position.coords;
  };

  useEffect(() => {
    if (!sharing || !allowedToUpdate || backgroundSharing || backgroundBusy) return;
    let active = true;
    const sendPosition = async () => {
      if (liveRequest.current || AppState.currentState !== 'active') return;
      liveRequest.current = true;
      try {
        const coordinate = Platform.OS === 'web'
          ? await getWebPosition()
          : (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })).coords;
        if (!active) return;
        await updateCargoLocation(loadId, { lat: coordinate.latitude, lng: coordinate.longitude });
        if (active) {
          setLocationError('');
          queryClient.invalidateQueries({ queryKey: getGetCargoTrackingQueryKey(loadId) });
        }
      } catch {
        if (active) setLocationError('GPS yuborilmadi. Internet va joylashuv ruxsatini tekshiring.');
      } finally {
        liveRequest.current = false;
      }
    };
    void sendPosition();
    const timer = setInterval(() => { void sendPosition(); }, 15_000);
    return () => { active = false; clearInterval(timer); };
  }, [sharing, allowedToUpdate, backgroundSharing, backgroundBusy, loadId, queryClient]);

  const toggleSharing = async () => {
    if (sharing) { setSharing(false); return; }
    setGettingLocation(true);
    try {
      await getCurrentCoordinate();
      setSharing(true);
      setLocationError('');
    } catch {
      setLocationError('GPS ulashish yoqilmadi. Joylashuv ruxsatini tekshiring.');
    } finally { setGettingLocation(false); }
  };

  const handleAdvance = (stage: CargoTrackingUpdateInputStage = nextStage!) => {
    if (!stage || !allowedToUpdate) return;
    updateTracking.mutate(
      { id: loadId, data: { stage, note: note.trim() || undefined } },
      {
        onSuccess: (result) => {
          if (!result.canUpdate) {
            setSharing(false);
            void stopCargoBackgroundSharing(loadId).then(() => setBackgroundSharing(false))
              .catch(() => setLocationError('GPS ruxsatini ilova sozlamalarida o‘chiring.'));
          }
          setNote('');
          queryClient.invalidateQueries({ queryKey: getGetCargoTrackingQueryKey(loadId) });
          queryClient.invalidateQueries({ queryKey: getGetCargoLoadQueryKey(loadId) });
          queryClient.invalidateQueries({ queryKey: getGetCargoLoadsQueryKey() });
          queryClient.invalidateQueries({ queryKey: ['/api/cargo-trips'] });
          queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
        },
        onError: (error) => Alert.alert('Yangilanmadi', error.message),
      },
    );
  };

  /*
    Stage updates do not require GPS permission: a driver can update a milestone
    even when indoors/offline GPS. Location sharing is a separate, explicit opt-in.
  */
  if (isLoading) {
    return (
      <View style={[styles.card, styles.loadingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.mutedText, { color: colors.mutedForeground }]}>Marshrut yuklanmoqda...</Text>
      </View>
    );
  }
  if (!tracking) return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={{ color: colors.mutedForeground }}>Kuzatuv ochilmadi. Faqat yuk egasi va biriktirilgan haydovchi jonli holatni ko‘ra oladi.</Text>
    </View>
  );

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.headingRow}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>JONLI KUZATUV</Text>
          <Text style={[styles.heading, { color: colors.text }]}>
            {tracking.currentStage ? stageLabels[tracking.currentStage] : 'Haydovchi tanlanmagan'}
          </Text>
        </View>
        <View style={[styles.liveBadge, { backgroundColor: colors.accent }]}>
          <View style={[styles.liveDot, { backgroundColor: freshGps ? colors.primary : colors.mutedForeground }]} />
          <Text style={[styles.liveText, { color: colors.accentForeground }]}>{tracking.currentStage === 'delivered' ? 'Kuzatuv tugadi' : freshGps ? 'GPS faol' : tracking.currentLat !== null ? 'GPS eskirgan / oflayn' : 'GPS yo‘q'}</Text>
        </View>
      </View>

      <CargoRouteMap tracking={tracking} />
      <Text style={[styles.mutedText, { color: colors.mutedForeground }]}>
        {tracking.locationUpdatedAt
          ? `GPS oxirgi yangilanishi: ${new Date(tracking.locationUpdatedAt).toLocaleString()}`
          : 'Haydovchi GPS joylashuvini hali ulashmagan.'}
      </Text>
      {!freshGps && tracking.currentLat !== null && tracking.currentStage !== 'delivered' && (
        <Text style={[styles.mutedText, { color: colors.mutedForeground }]}>
          Bu oxirgi ma’lum nuqta, hozirgi joylashuv emas. Internet, GPS ruxsati yoki telefon cheklovi sabab yangilanish to‘xtagan bo‘lishi mumkin.
        </Text>
      )}

      <View style={styles.routeLabels}>
        <View style={styles.routeLabelBlock}>
          <Text style={[styles.routeCaption, { color: colors.mutedForeground }]}>Yuklash</Text>
          <Text style={[styles.routeName, { color: colors.text }]} numberOfLines={2}>{tracking.pickup.label}</Text>
        </View>
        <Feather name="arrow-right" size={18} color={colors.mutedForeground} />
        <View style={[styles.routeLabelBlock, styles.routeLabelRight]}>
          <Text style={[styles.routeCaption, { color: colors.mutedForeground }]}>Yetkazish</Text>
          <Text style={[styles.routeName, { color: colors.text }]} numberOfLines={2}>{tracking.delivery.label}</Text>
        </View>
      </View>

      {tracking.assigned && <View style={styles.timeline}>
        {stages.map((stage, index) => {
          const completed = index <= currentIndex;
          return (
            <View key={stage} style={styles.timelineRow}>
              <View style={styles.timelineRail}>
                <View
                  style={[
                    styles.timelineDot,
                    {
                      backgroundColor: completed ? colors.primary : colors.muted,
                      borderColor: completed ? colors.primary : colors.border,
                    },
                  ]}
                >
                  {completed && <Feather name="check" size={11} color={colors.primaryForeground} />}
                </View>
                {index < stages.length - 1 && (
                  <View style={[styles.timelineLine, { backgroundColor: index < currentIndex ? colors.primary : colors.border }]} />
                )}
              </View>
              <Text
                style={[
                  styles.timelineLabel,
                  { color: completed ? colors.text : colors.mutedForeground },
                  index === currentIndex ? styles.timelineLabelCurrent : undefined,
                ]}
              >
                {stageLabels[stage]}
              </Text>
            </View>
          );
        })}
      </View>}

      {tracking.history.length > 0 && (
        <View style={[styles.lastMessage, { backgroundColor: colors.secondary }]}>
          <Feather name="message-circle" size={16} color={colors.secondaryForeground} />
          <View style={styles.messageBody}>
            <Text style={[styles.messageTitle, { color: colors.secondaryForeground }]}>So‘nggi xabar</Text>
            <Text style={[styles.messageText, { color: colors.secondaryForeground }]}>
              {tracking.history[tracking.history.length - 1]?.note ?? stageLabels[tracking.currentStage ?? 'accepted']}
            </Text>
          </View>
        </View>
      )}

      {allowedToUpdate && nextStage && (
        <View style={[styles.driverControls, { borderTopColor: colors.border }]}>
          <Text style={[styles.driverTitle, { color: colors.text }]}>Haydovchi boshqaruvi</Text>
          <TextInput
            testID="tracking-note-input"
            style={[styles.noteInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            value={note}
            onChangeText={setNote}
            placeholder="Yuk egasiga izoh (ixtiyoriy)"
            placeholderTextColor={colors.mutedForeground}
            maxLength={1000}
          />
          <TouchableOpacity
            testID="advance-tracking-stage"
            style={[styles.advanceButton, { backgroundColor: colors.primary }]}
            onPress={() => handleAdvance()}
            disabled={updateTracking.isPending}
            activeOpacity={0.85}
          >
            {updateTracking.isPending ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <>
                <Feather name="navigation" size={17} color={colors.primaryForeground} />
                <Text style={[styles.advanceText, { color: colors.primaryForeground }]}>
                  {stageLabels[nextStage]} deb belgilash
                </Text>
              </>
            )}
          </TouchableOpacity>
          {tracking.currentStage === 'in_transit' && (
            <TouchableOpacity
              testID="mark-domestic-delivered"
              onPress={() => handleAdvance('delivered')}
              disabled={updateTracking.isPending}
              style={[styles.advanceButton, { backgroundColor: colors.secondary }]}
            >
              <Text style={[styles.advanceText, { color: colors.secondaryForeground }]}>Chegarasiz: yetkazildi deb belgilash</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            testID="toggle-live-gps"
            onPress={toggleSharing}
            disabled={gettingLocation || backgroundSharing || backgroundBusy}
            style={[styles.advanceButton, { backgroundColor: colors.secondary }]}
          >
            <Text style={[styles.advanceText, { color: colors.secondaryForeground }]}>
              {gettingLocation ? 'GPS aniqlanmoqda...' : sharing ? 'GPS ulashishni to‘xtatish' : 'Jonli GPS ulashishni yoqish'}
            </Text>
          </TouchableOpacity>
          {Platform.OS !== 'web' && (
            <TouchableOpacity
              testID="toggle-background-gps"
              onPress={toggleBackground}
              disabled={backgroundBusy || !backgroundAvailable}
              style={[styles.advanceButton, { backgroundColor: colors.secondary, opacity: backgroundAvailable ? 1 : 0.5 }]}
            >
              <Text style={[styles.advanceText, { color: colors.secondaryForeground }]}>
                {backgroundBusy ? 'Kutilmoqda...' : backgroundSharing ? 'Fon GPS ulashishni to‘xtatish' : 'Ekran yopiq paytda ham GPS ulashish'}
              </Text>
            </TouchableOpacity>
          )}
          {Platform.OS !== 'web' && <TouchableOpacity onPress={() => Linking.openSettings()}>
            <Text style={[styles.gpsHint, { color: colors.primary }]}>Joylashuv ruxsati sozlamalari</Text>
          </TouchableOpacity>}
          {!!locationError && <Text style={{ color: colors.destructive }}>{locationError}</Text>}
          <Text style={[styles.gpsHint, { color: colors.mutedForeground }]}>
            {backgroundSharing
              ? 'Fon GPS yoqilgan: boshqa ekranga o‘tsangiz ham ulashiladi. Telefonning batareya yoki majburan yopish cheklovlari uzilish keltirishi mumkin.'
              : 'Jonli GPS: faqat shu ekran ochiq va ilova faol bo‘lganda har 15 soniyada. Fon GPS alohida rozilik bilan yoqiladi.'}
            {!backgroundAvailable ? ' Fon GPS brauzer va Expo Go’da ishlamaydi; alohida o‘rnatilgan Android/iOS ilovasi kerak.' : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  loadingCard: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutedText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
  },
  heading: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginTop: 3,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 100,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  map: {
    height: 190,
    borderRadius: 14,
    overflow: 'hidden',
  },
  mapLegend: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  routeLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  routeLabelBlock: {
    flex: 1,
  },
  routeLabelRight: {
    alignItems: 'flex-end',
  },
  routeCaption: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    marginBottom: 3,
  },
  routeName: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  timeline: {
    gap: 0,
  },
  timelineRow: {
    minHeight: 34,
    flexDirection: 'row',
    gap: 11,
  },
  timelineRail: {
    width: 20,
    alignItems: 'center',
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
  },
  timelineLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    paddingTop: 2,
  },
  timelineLabelCurrent: {
    fontFamily: 'Inter_700Bold',
  },
  lastMessage: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 12,
  },
  messageBody: {
    flex: 1,
  },
  messageTitle: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Inter_400Regular',
  },
  driverControls: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
    gap: 10,
  },
  driverTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  noteInput: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  advanceButton: {
    minHeight: 48,
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  advanceText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  gpsHint: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
});