import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Constants from 'expo-constants';
import type { NotificationResponse } from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import {
  getGetNotificationsQueryKey,
  registerPushToken,
  unregisterPushToken,
  useGetNotifications,
  useMarkNotificationRead,
} from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

export const PUSH_TOKEN_KEY = 'osavdo_cargo_push_token';

export function CargoPushListener() {
  const { user } = useAuth();
  const router = useRouter();
  const client = useQueryClient();
  useEffect(() => {
    if (!user || Platform.OS === 'web' || Constants.appOwnership === 'expo') return;
    let active = true;
    let cleanup = () => {};
    void import('expo-notifications').then(async Notifications => {
      if (!active) return;
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false,
        }),
      });
      const received = Notifications.addNotificationReceivedListener(() => {
        client.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
        client.invalidateQueries({ queryKey: ['/api/cargo-trips'] });
      });
      const open = (response: NotificationResponse) => {
        const loadId = response.notification.request.content.data.loadId;
        if (typeof loadId === 'string') router.push(`/cargo/${encodeURIComponent(loadId)}`);
        else if (typeof response.notification.request.content.data.notificationId === 'string') router.push('/(tabs)/profile');
        client.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
      };
      const responseListener = Notifications.addNotificationResponseReceivedListener(open);
      cleanup = () => { received.remove(); responseListener.remove(); };
      const last = await Notifications.getLastNotificationResponseAsync();
      if (last && active) {
        open(last);
        await Notifications.clearLastNotificationResponseAsync();
      }
      const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      if (token && active) {
        const permissions = await Notifications.getPermissionsAsync();
        if (permissions.granted) await registerPushToken({ token });
        else await unregisterPushToken({ token });
      }
    }).catch((error) => {
      console.warn('Cargo push subscription could not be restored:', error instanceof Error ? error.message : 'unknown');
    });
    return () => { active = false; cleanup(); };
  }, [user?.id, router, client]);
  return null;
}

export function CargoNotifications({ scope = 'cargo' }: { scope?: 'cargo' | 'all' } = {}) {
  const colors = useColors();
  const router = useRouter();
  const client = useQueryClient();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [needsSettings, setNeedsSettings] = useState(false);
  const { data: notifications, isError } = useGetNotifications({
    query: { queryKey: getGetNotificationsQueryKey(), refetchInterval: 10_000, enabled: !!user },
  });
  const markRead = useMarkNotificationRead();
  useEffect(() => {
    let active = true;
    if (Platform.OS !== 'web' && Constants.appOwnership !== 'expo') {
      void (async () => {
        const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
        if (!token) return;
        const Notifications = await import('expo-notifications');
        const permissions = await Notifications.getPermissionsAsync();
        if (active) setPushEnabled(permissions.granted);
      })().catch(() => { if (active) setFeedback('Push obunasini tekshirib bo‘lmadi.'); });
    }
    return () => { active = false; };
  }, [user?.id]);

  const togglePush = async () => {
    setFeedback('');
    setNeedsSettings(false);
    if (Platform.OS === 'web' || Constants.appOwnership === 'expo') {
      setFeedback('Push bildirishnomalar o‘rnatilgan mobil ilovada ishlaydi; brauzer va Expo Go uchun xabarlar quyida ko‘rinadi.');
      return;
    }
    setBusy(true);
    try {
      if (pushEnabled) {
        const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
        if (token) await unregisterPushToken({ token });
        await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
        setPushEnabled(false);
        setFeedback('Push o‘chirildi. Ilova ichidagi xabarlar saqlanadi.');
        return;
      }
      const Notifications = await import('expo-notifications');
      if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('cargo', {
        name: 'Yuk holatlari', importance: Notifications.AndroidImportance.HIGH,
      });
      let permission = await Notifications.getPermissionsAsync();
      if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
      if (!permission.granted) {
        setNeedsSettings(!permission.canAskAgain);
        throw new Error('Bildirishnoma ruxsati berilmadi. Sozlamalarda ruxsatni yoqishingiz mumkin.');
      }
      const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) throw new Error('Mobil buildda Expo push loyiha IDsi sozlanmagan. Pushni yoqish uchun build sozlamasi kerak; ilova ichidagi xabarlar ishlaydi.');
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      await registerPushToken({ token });
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
      setPushEnabled(true);
      setFeedback('Push bildirishnomalar yoqildi.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Pushni yoqib bo‘lmadi. Qayta urinib ko‘ring.');
    } finally { setBusy(false); }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.heading}>
        <Feather name="bell" size={18} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>{scope === 'all' ? 'Bildirishnomalar' : 'Yuk xabarlari'}</Text>
      </View>
      <TouchableOpacity testID="enable-cargo-push" onPress={togglePush} disabled={busy} style={[styles.pushButton, { backgroundColor: colors.secondary }]}>
        {busy ? <ActivityIndicator color={colors.primary} /> : <Text style={[styles.pushText, { color: colors.secondaryForeground }]}>
          {pushEnabled ? 'Pushni o‘chirish' : 'Push bildirishnomalarni yoqish'}
        </Text>}
      </TouchableOpacity>
      {!!feedback && <Text style={[styles.message, { color: colors.mutedForeground }]}>{feedback}</Text>}
      {needsSettings && Platform.OS !== 'web' && <TouchableOpacity onPress={() => Linking.openSettings()}>
        <Text style={{ color: colors.primary }}>Sozlamalarni ochish</Text>
      </TouchableOpacity>}
      {isError && <Text style={{ color: colors.destructive }}>Xabarlar yuklanmadi. Sahifani yangilang.</Text>}
      {notifications?.length === 0 && <Text style={[styles.message, { color: colors.mutedForeground }]}>{scope === 'all' ? 'Mahsulotlarga talab va yuklar haqidagi xabarlar shu yerda ko‘rinadi.' : 'Yuk holati o‘zgarsa, xabar shu yerda ko‘rinadi.'}</Text>}
      {notifications?.map(notification => (
        <TouchableOpacity
          testID={`cargo-notification-${notification.id}`}
          key={notification.id}
          style={[styles.notification, { borderTopColor: colors.border }]}
          onPress={() => {
            if (!notification.read) markRead.mutate({ id: notification.id }, {
              onSuccess: () => client.invalidateQueries({ queryKey: getGetNotificationsQueryKey() }),
              onError: () => setFeedback('Xabar o‘qilgan deb belgilanmadi. Qayta urinib ko‘ring.'),
            });
            if (notification.loadId) router.push(`/cargo/${notification.loadId}`);
          }}
        >
          <View style={[styles.dot, { backgroundColor: notification.read ? colors.border : colors.primary }]} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={[styles.notificationTitle, { color: colors.text }]}>{notification.title}</Text>
            <Text style={[styles.message, { color: colors.mutedForeground }]}>{notification.message}</Text>
            <Text style={[styles.date, { color: colors.mutedForeground }]}>{new Date(notification.createdAt).toLocaleString()}</Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, borderWidth: 1, borderRadius: 14, gap: 12, marginBottom: 16 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  pushButton: { minHeight: 42, padding: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pushText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  notification: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, flexDirection: 'row', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, marginTop: 5 },
  notificationTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  message: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  date: { fontSize: 10, fontFamily: 'Inter_400Regular' },
});
