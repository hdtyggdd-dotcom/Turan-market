import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setBaseUrl, setAuthTokenGetter } from '@workspace/api-client-react';

setBaseUrl(Platform.OS === 'web' && !__DEV__ && typeof window !== 'undefined' && !process.env.EXPO_PUBLIC_DOMAIN
setBaseUrl(Platform.OS === 'web' && !__DEV__ && typeof window !== 'undefined'
  ? window.location.origin
  : `https://${process.env.EXPO_PUBLIC_DOMAIN}`);
setAuthTokenGetter(() => AsyncStorage.getItem('osavdo_token'));
