import './api-config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { ApiError, getCargoTracking, updateCargoLocation } from '@workspace/api-client-react';

const TASK = 'osavdo-cargo-background-location';
const SESSION = 'osavdo_cargo_background_session';
const AUTH_SESSION = 'osavdo_auth_session';
type SharingSession = { loadId: string; userId: string; authSession: string; consentId: string; lastSentAt: number };
let inFlight: AbortController | null = null;
let processing = false;
let controls: Promise<unknown> = Promise.resolve();

function exclusive<T>(operation: () => Promise<T>): Promise<T> {
  const result = controls.then(operation, operation);
  controls = result.catch(() => {});
  return result;
}

async function readSession(): Promise<SharingSession | null> {
  const value = await AsyncStorage.getItem(SESSION);
  if (!value) return null;
  try {
    const session = JSON.parse(value) as SharingSession;
    return session.loadId && session.userId && session.authSession && session.consentId ? session : null;
  } catch { return null; }
}

async function authFor(session: SharingSession): Promise<string | null> {
  const [[, token], [, user], [, authSession]] = await AsyncStorage.multiGet([
    'osavdo_token', 'osavdo_user', AUTH_SESSION,
  ]);
  try {
    return token && user && JSON.parse(user).id === session.userId &&
      authSession === session.authSession ? token : null;
  } catch { return null; }
}

async function stopUnlocked() {
  // Erase consent first, even when OS cleanup fails. No queued GPS is retained.
  try {
    await AsyncStorage.removeItem(SESSION);
  } finally {
    // Still try OS cleanup if device storage fails, and surface either failure.
    inFlight?.abort();
    if (Platform.OS !== 'web' && await TaskManager.isAvailableAsync() &&
        await Location.hasStartedLocationUpdatesAsync(TASK)) {
      await Location.stopLocationUpdatesAsync(TASK);
    }
  }
}

export function stopCargoBackgroundSharing(loadId?: string) {
  return exclusive(async () => {
    const session = await readSession();
    if (!loadId || session?.loadId === loadId) await stopUnlocked();
  });
}

export function getCargoBackgroundSharing(): Promise<string | null> {
  // Inspection and orphan recovery must see the committed start/stop state,
  // not the temporary no-session/no-native-task state during permission prompts.
  return exclusive(async () => {
    const session = await readSession();
    if (!session) {
      await stopUnlocked();
      return null;
    }
    if (!await authFor(session) || !await TaskManager.isAvailableAsync() ||
        !(await Location.getBackgroundPermissionsAsync()).granted ||
        !await Location.hasStartedLocationUpdatesAsync(TASK)) {
      await stopUnlocked();
      return null;
    }
    return session.loadId;
  });
}

export async function cargoBackgroundAvailable() {
  return Platform.OS !== 'web' && await TaskManager.isAvailableAsync();
}

export function startCargoBackgroundSharing(loadId: string, userId: string) {
  return exclusive(async () => {
    if (!await cargoBackgroundAvailable()) {
      throw new Error('Fon GPS uchun alohida o‘rnatilgan Android/iOS ilovasi kerak. Brauzer va Expo Go qo‘llamaydi.');
    }
    const existing = await readSession();
    if (existing && existing.loadId !== loadId) {
      throw new Error('Avval boshqa yukdagi fon GPS ulashishni to‘xtating.');
    }
    if (!(await Location.requestForegroundPermissionsAsync()).granted) {
      throw new Error('Joylashuv ruxsati berilmadi. Ilova sozlamalarini tekshiring.');
    }
    // Called only following the dedicated consent dialog, never on mount.
    if (!(await Location.requestBackgroundPermissionsAsync()).granted) {
      throw new Error('Fon GPS uchun sozlamalarda joylashuvni “Har doim” ruxsatiga o‘tkazing.');
    }
    let authSession = await AsyncStorage.getItem(AUTH_SESSION);
    if (!authSession) {
      authSession = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await AsyncStorage.setItem(AUTH_SESSION, authSession);
    }
    const session: SharingSession = {
      loadId, userId, authSession,
      consentId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      lastSentAt: 0,
    };
    const token = await authFor(session);
    if (!token) throw new Error('Hisobga qayta kiring.');
    const tracking = await getCargoTracking(loadId, { headers: { Authorization: `Bearer ${token}` } });
    if (!tracking.canUpdate) throw new Error('Ushbu yuk uchun GPS ulashib bo‘lmaydi.');
    await AsyncStorage.setItem(SESSION, JSON.stringify(session));
    try {
      await Location.startLocationUpdatesAsync(TASK, {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 100,
        timeInterval: 60_000,
        deferredUpdatesInterval: 60_000,
        deferredUpdatesDistance: 100,
        activityType: Location.ActivityType.AutomotiveNavigation,
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'Yuk GPS kuzatuvi yoqilgan',
          notificationBody: 'GPS yuk egasiga ulashilmoqda. Ilovada to‘xtatishingiz mumkin.',
          killServiceOnDestroy: true,
        },
      });
    } catch (error) {
      await stopUnlocked();
      throw error;
    }
  });
}

async function handleLocation(data?: { locations: Location.LocationObject[] }, error?: unknown) {
  // An orphaned OS callback must also wait for any consent/start in progress.
  const session = await exclusive(async () => {
    const current = await readSession();
    if (!current) await stopUnlocked();
    return current;
  });
  if (!session) return;
  const token = await authFor(session);
  if (!token || error || !(await Location.getBackgroundPermissionsAsync()).granted) {
    await stopCargoBackgroundSharing(session.loadId);
    return;
  }
  const position = data?.locations?.reduce<Location.LocationObject | undefined>(
    (latest, item) => !latest || item.timestamp > latest.timestamp ? item : latest, undefined,
  );
  if (!position || Date.now() - position.timestamp > 180_000 ||
      Date.now() - session.lastSentAt < 60_000) return;
  const controller = new AbortController();
  inFlight = controller;
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const options = { signal: controller.signal, headers: { Authorization: `Bearer ${token}` } };
    const tracking = await getCargoTracking(session.loadId, options);
    if (!tracking.canUpdate) {
      await stopCargoBackgroundSharing(session.loadId);
      return;
    }
    // Recheck consent/auth after the network round trip; never use the next account's token.
    const current = await readSession();
    if (current?.consentId !== session.consentId ||
        await authFor(session) !== token) return;
    await updateCargoLocation(session.loadId, {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      sampledAt: new Date(position.timestamp).toISOString(),
    }, options);
    // Never recreate consent after a stop while a request was in flight.
    await exclusive(async () => {
      const latest = await readSession();
      if (latest?.consentId === session.consentId) {
        await AsyncStorage.setItem(SESSION, JSON.stringify({ ...latest, lastSentAt: Date.now() }));
      }
    });
  } catch (err) {
    if (err instanceof ApiError && [401, 403, 404, 409, 410].includes(err.status)) {
      await stopCargoBackgroundSharing(session.loadId);
    }
    // Offline/transient errors drop this fix. Never replay old coordinates as live.
  } finally {
    clearTimeout(timeout);
    if (inFlight === controller) inFlight = null;
  }
}

// Registered at module scope so Expo can execute it without any React screen.
if (Platform.OS !== 'web') {
  TaskManager.defineTask<{ locations: Location.LocationObject[] }>(TASK, async ({ data, error }) => {
    if (processing) return;
    processing = true;
    try { await handleLocation(data, error); }
    catch {
      // Fail closed if persistent consent/auth or native permission cannot be read.
      await stopCargoBackgroundSharing().catch(() => {});
    } finally { processing = false; }
  });
}

export async function reconcileCargoBackgroundSharing() {
  const loadId = await getCargoBackgroundSharing();
  if (!loadId) return;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const tracking = await getCargoTracking(loadId, { signal: controller.signal });
    if (!tracking.canUpdate) await stopCargoBackgroundSharing(loadId);
  } catch (error) {
    if (error instanceof ApiError && [401, 403, 404, 409, 410].includes(error.status)) {
      await stopCargoBackgroundSharing(loadId);
    }
  } finally { clearTimeout(timeout); }
}
