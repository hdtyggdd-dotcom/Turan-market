import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { hasActionIdentity, hasActionLocation, safeActionReturn } from '@/services/action-access';

export function useActionAccess() {
  const { user, token } = useAuth();
  const router = useRouter();
  return (target: string, role: 'buyer' | 'seller' | 'driver' = 'buyer', requireLocation = true) => {
    const returnTo = safeActionReturn(target);
    if (!user || !token || !hasActionIdentity(user)) {
      router.push({ pathname: '/auth/register', params: { returnTo, role } });
      return false;
    }
    if (requireLocation && !hasActionLocation(user)) {
      router.push({ pathname: '/auth/complete', params: { returnTo } });
      return false;
    }
    return true;
  };
}
