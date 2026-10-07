import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setBaseUrl, setAuthTokenGetter } from '@workspace/api-client-react';

// Also imported by the headless GPS task: it must not depend on mounted providers.
setBaseUrl(Platform.OS === 'web' && !__DEV__ && typeof window !== 'undefined'
  ? window.location.origin
  : `https://${process.env.EXPO_PUBLIC_DOMAIN}`);
setAuthTokenGetter(() => AsyncStorage.getItem('osavdo_token'));
