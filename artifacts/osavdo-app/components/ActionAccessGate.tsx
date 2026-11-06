import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useUpdateUser } from '@workspace/api-client-react';
import { useAuth, type UserProfile } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useColors } from '@/hooks/useColors';
import { useActionAccess } from '@/hooks/useActionAccess';
import { hasActionIdentity, hasActionLocation } from '@/services/action-access';
import { ListingLocationFields, type ListingLocationValue } from './ListingLocationFields';

export function ActionAccessGate({ children, target, role = 'buyer', requireLocation = true }: {
  children: React.ReactNode; target: string; role?: 'buyer' | 'seller' | 'driver'; requireLocation?: boolean;
}) {
  const { user, token, isLoading } = useAuth();
  const colors = useColors();
  const ensure = useActionAccess();
  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;
  if (!user || !token || !hasActionIdentity(user)) return (
    <View style={{ flex: 1, padding: 24, paddingTop: 90, gap: 16, backgroundColor: colors.background }}>
      <Text style={{ color: colors.text, fontSize: 22, fontFamily: 'Inter_700Bold' }}>Ma’lumotlaringizni kiriting</Text>
      <Text style={{ color: colors.mutedForeground, lineHeight: 22 }}>
        Mahsulotlarni akkauntsiz ko‘rish mumkin. Xarid, sotish yoki yuk tashishdan oldin ism, telefon, kirish kodi va joylashuv kerak.
      </Text>
      <TouchableOpacity testID="action-access-continue" onPress={() => ensure(target, role, requireLocation)}
        style={{ backgroundColor: colors.primary, padding: 16, borderRadius: 14 }}>
        <Text style={{ color: colors.primaryForeground, textAlign: 'center' }}>Davom etish</Text>
      </TouchableOpacity>
    </View>
  );
  if (requireLocation && !hasActionLocation(user)) return <CompleteActionLocation />;
  return <>{children}</>;
}

function CompleteActionLocation() {
  const colors = useColors();
  const { user, token, updateUser, expireSession } = useAuth();
  const { countryId } = useLocation();
  const [location, setLocation] = useState<ListingLocationValue>({ regionId: user?.regionId ?? '', districtId: user?.districtId ?? '' });
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState('');
  const mutation = useUpdateUser();
  async function save() {
    if (!user || !token || !location.regionId || !location.districtId || mutation.isPending || detecting) return;
    setError('');
    try {
      const profile = await mutation.mutateAsync({ id: user.id, data: {
        regionId: location.regionId, districtId: location.districtId,
      } });
      await updateUser(profile as UserProfile);
    } catch (failure) {
      if ((failure as { status?: number }).status === 401) await expireSession(token);
      setError('Joylashuv saqlanmadi. Qayta urinib ko‘ring.');
    }
  }
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 24, paddingTop: 90, gap: 16 }}>
      <Text style={{ color: colors.text, fontSize: 22, fontFamily: 'Inter_700Bold' }}>Joylashuvingizni tanlang</Text>
      <Text style={{ color: colors.mutedForeground }}>{user?.name} · {user?.phone}</Text>
      <Text style={{ color: colors.mutedForeground }}>Amalni davom ettirish uchun viloyat va tuman kerak. GPS yoki qo‘lda tanlang.</Text>
      <ListingLocationFields countryId={countryId ?? 'uz'} value={location} onChange={setLocation} onDetectingChange={setDetecting} />
      {!!error && <Text style={{ color: colors.destructive }}>{error}</Text>}
      <TouchableOpacity testID="action-location-save" disabled={!location.regionId || !location.districtId || detecting || mutation.isPending}
        onPress={() => { void save(); }} style={{ backgroundColor: colors.primary, padding: 16, borderRadius: 14,
          opacity: location.regionId && location.districtId && !detecting && !mutation.isPending ? 1 : 0.4 }}>
        {mutation.isPending ? <ActivityIndicator color={colors.primaryForeground} />
          : <Text style={{ color: colors.primaryForeground, textAlign: 'center' }}>Saqlash va davom etish</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}
