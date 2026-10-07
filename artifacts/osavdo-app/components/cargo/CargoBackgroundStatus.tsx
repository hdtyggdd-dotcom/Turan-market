import React, { useEffect, useState } from 'react';
import { Alert, Platform, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { getCargoBackgroundSharing, stopCargoBackgroundSharing } from '@/services/cargo-background-location';

/** Stop remains reachable after leaving a cargo screen. */
export function CargoBackgroundStatus() {
  const { user } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [loadId, setLoadId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let active = true;
    const check = async () => {
      const id = await getCargoBackgroundSharing();
      if (active) setLoadId(id);
    };
    void check().catch(() => {});
    const timer = setInterval(() => { void check().catch(() => {}); }, 3_000);
    return () => { active = false; clearInterval(timer); };
  }, [user?.id]);
  if (!loadId) return null;
  return <TouchableOpacity
    testID="stop-background-gps-global"
    disabled={busy}
    onPress={async () => {
      setBusy(true);
      try { await stopCargoBackgroundSharing(loadId); setLoadId(null); }
      catch { Alert.alert('GPS', 'Joylashuvni ilova sozlamalarida o‘chiring.'); }
      finally { setBusy(false); }
    }}
    style={{ position: 'absolute', top: insets.top, alignSelf: 'center', padding: 10,
      borderRadius: 8, backgroundColor: colors.secondary, zIndex: 100 }}
  >
    <Text style={{ color: colors.secondaryForeground, fontSize: 13 }}>
      {busy ? 'To‘xtatilmoqda...' : 'Fon GPS yoqilgan — to‘xtatish'}
    </Text>
  </TouchableOpacity>;
}
