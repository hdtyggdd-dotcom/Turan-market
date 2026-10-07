import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMe, unregisterPushToken } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { stopCargoBackgroundSharing } from '@/services/cargo-background-location';

export interface UserProfile {
  id: string;
  phone: string;
  name: string;
  role: 'buyer' | 'seller' | 'driver' | 'admin';
  sellerBadge: 'manufacturer' | 'reseller' | null;
  verificationStatus: 'none' | 'pending' | 'approved' | 'rejected';
  regionId: string | null;
  districtId: string | null;
  neighborhoodId: string | null;
  rating: number | null;
  totalSales: number;
  createdAt: string;
  region?: { id: string; name: string; nameRu: string } | null;
  district?: { id: string; name: string; nameRu: string } | null;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  signIn: (token: string, user: UserProfile) => Promise<void>;
  signOut: () => Promise<boolean>;
  finishAccountDeletion: () => Promise<void>;
  updateUser: (user: UserProfile) => Promise<void>;
  expireSession: (expectedToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'osavdo_token';
const USER_KEY = 'osavdo_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const authWrites = useRef<Promise<void>>(Promise.resolve());
  const storeSession = useCallback((work: () => Promise<void>) => {
    const write = authWrites.current.then(work);
    authWrites.current = write.catch(() => {});
    return write;
  }, []);
  const identityRef = useRef<string | undefined>(user?.id);
  const sessionVersion = useRef(0);
  identityRef.current = user?.id;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootVersion = sessionVersion.current;
    (async () => {
      try {
        const [[, storedToken], [, storedUser]] = await AsyncStorage.multiGet([
          TOKEN_KEY,
          USER_KEY,
        ]);
        if (storedToken && storedUser) {
          const cached = JSON.parse(storedUser) as UserProfile;
          try {
            const fresh = await getMe({ headers: { Authorization: `Bearer ${storedToken}` } });
            if (sessionVersion.current === bootVersion) Object.assign(cached, fresh);
          } catch (error) {
            if ((error as { status?: number }).status === 410) {
              if (sessionVersion.current !== bootVersion) return;
              await stopCargoBackgroundSharing();
              await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, 'osavdo_auth_session', 'osavdo_cargo_push_token', 'osavdo_location',
                `turan_cart:${cached.id}`, `turan_cart_pending:${cached.id}`, `turan_cart_migration:${cached.id}`, `turan_account_deletion:${cached.id}`, `turan_purchase:${cached.id}`]);
              return;
            }
            if ((error as { status?: number }).status === 401) {
              if (sessionVersion.current !== bootVersion) return;
              await storeSession(async () => {
                if (sessionVersion.current === bootVersion) await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, 'osavdo_auth_session']);
              });
              await stopCargoBackgroundSharing();
              return; // Keep this owner's cart/migration/uncertain-operation journals.
            }
            // Network failure is not proof of either expiry or account deletion.
          }
          if (sessionVersion.current !== bootVersion) return;
          setToken(storedToken);
          setUser(cached);
        }
      } catch {
        // ignore storage errors
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (t: string, u: UserProfile) => {
    const version = ++sessionVersion.current;
    await stopCargoBackgroundSharing();
    queryClient.clear();
    await storeSession(() => AsyncStorage.multiSet([
      [TOKEN_KEY, t],
      [USER_KEY, JSON.stringify(u)],
      ['osavdo_auth_session', `${Date.now()}-${Math.random().toString(36).slice(2)}`],
    ]));
    if (sessionVersion.current !== version) return;
    tokenRef.current = t;
    setToken(t);
    setUser(u);
  }, [queryClient, storeSession]);

  const expireSession = useCallback(async (expectedToken: string) => {
    if (tokenRef.current !== expectedToken) return;
    const version = ++sessionVersion.current;
    tokenRef.current = null;
    setToken(null);
    setUser(null);
    queryClient.clear();
    await storeSession(async () => {
      if (sessionVersion.current === version) await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, 'osavdo_auth_session']);
    });
    if (sessionVersion.current === version) await stopCargoBackgroundSharing();
  }, [queryClient, storeSession]);

  const signOut = useCallback(async () => {
    await stopCargoBackgroundSharing();
    const pushToken = await AsyncStorage.getItem('osavdo_cargo_push_token');
    // Do not leave a device subscribed to the previous account after logout.
    if (pushToken) {
      try {
        await unregisterPushToken({ token: pushToken });
      } catch (error) {
        if ((error as { status?: number }).status !== 410) {
          Alert.alert('Chiqish amalga oshmadi', 'Push obunasini xavfsiz o‘chirish uchun internetga ulanib, qayta urinib ko‘ring.');
          return false;
        }
      }
      await AsyncStorage.removeItem('osavdo_cargo_push_token');
    }
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, 'osavdo_auth_session']);
    sessionVersion.current++;
    tokenRef.current = null;
    setToken(null);
    setUser(null);
    queryClient.clear();
    return true;
  }, [queryClient]);

  const updateUser = useCallback(async (u: UserProfile) => {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const finishAccountDeletion = useCallback(async () => {
    const owner = user?.id;
    if (identityRef.current !== owner) return;
    sessionVersion.current++;
    let backgroundError: unknown;
    try { await stopCargoBackgroundSharing(); } catch (error) { backgroundError = error; }
    if (identityRef.current !== owner) return;
    setToken(null);
    setUser(null);
    queryClient.clear();
    const keys = [TOKEN_KEY, USER_KEY, 'osavdo_auth_session', 'osavdo_cargo_push_token', 'osavdo_location'];
    if (owner) keys.push(`turan_cart:${owner}`, `turan_cart_pending:${owner}`, `turan_cart_migration:${owner}`, `turan_account_deletion:${owner}`, `turan_purchase:${owner}`);
    // No unregister HTTP call: the deleted account is already unauthorized.
    await AsyncStorage.multiRemove(keys);
    if (backgroundError) throw new Error("Akkaunt serverda yopildi. Telefonning fon GPS holatini tekshiring va joylashuv ruxsatini o‘chiring.");
  }, [user?.id, queryClient]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut, finishAccountDeletion, updateUser, expireSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
