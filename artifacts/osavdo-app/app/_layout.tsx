import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setBaseUrl, setAuthTokenGetter } from '@workspace/api-client-react';
import { AuthProvider } from '@/context/AuthContext';
import { LocationProvider } from '@/context/LocationContext';
import { I18nProvider } from '@/context/I18nContext';
import { CountrySetupModal } from '@/components/CountrySetupModal';

// Configure API client — generated paths already include /api prefix
setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
setAuthTokenGetter(() => AsyncStorage.getItem('osavdo_token'));

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function RootLayoutNav() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="auth/login"
        options={{ headerShown: false, animation: 'fade' }}
      />
      <Stack.Screen
        name="auth/register"
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="listing/[id]"
        options={{
          headerTitle: '',
          headerTransparent: true,
          headerBackTitle: 'Orqaga',
        }}
      />
    </Stack>
  );
}

const COUNTRY_SETUP_KEY = 'osavdo_country_setup_done';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [showCountrySetup, setShowCountrySetup] = useState(false);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      AsyncStorage.getItem(COUNTRY_SETUP_KEY).then((done) => {
        if (!done) setShowCountrySetup(true);
      });
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  function handleCountrySetupDone() {
    AsyncStorage.setItem(COUNTRY_SETUP_KEY, '1').catch(() => {});
    setShowCountrySetup(false);
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <I18nProvider>
            <AuthProvider>
              <LocationProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <KeyboardProvider>
                    <RootLayoutNav />
                    <CountrySetupModal
                      visible={showCountrySetup}
                      onDone={handleCountrySetupDone}
                    />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </LocationProvider>
            </AuthProvider>
          </I18nProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
