import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { unregisterPushToken } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';

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
  signOut: () => Promise<void>;
  updateUser: (user: UserProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'osavdo_token';
const USER_KEY = 'osavdo_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [[, storedToken], [, storedUser]] = await AsyncStorage.multiGet([
          TOKEN_KEY,
          USER_KEY,
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser) as UserProfile);
        }
      } catch {
        // ignore storage errors
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (t: string, u: UserProfile) => {
    queryClient.clear();
    await AsyncStorage.multiSet([
      [TOKEN_KEY, t],
      [USER_KEY, JSON.stringify(u)],
    ]);
    setToken(t);
    setUser(u);
  }, [queryClient]);

  const signOut = useCallback(async () => {
    const pushToken = await AsyncStorage.getItem('osavdo_cargo_push_token');
    // Do not leave a device subscribed to the previous account after logout.
    if (pushToken) {
      try {
        await unregisterPushToken({ token: pushToken });
      } catch {
        Alert.alert('Chiqish amalga oshmadi', 'Push obunasini xavfsiz o‘chirish uchun internetga ulanib, qayta urinib ko‘ring.');
        return;
      }
      await AsyncStorage.removeItem('osavdo_cargo_push_token');
    }
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const updateUser = useCallback(async (u: UserProfile) => {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
