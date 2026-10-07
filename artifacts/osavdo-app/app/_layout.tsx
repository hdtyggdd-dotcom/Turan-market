import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
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
import '@/services/cargo-background-location';
import { reconcileCargoBackgroundSharing } from '@/services/cargo-background-location';
import { AppState } from 'react-native';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { LocationProvider } from '@/context/LocationContext';
import { I18nProvider } from '@/context/I18nContext';
import { CountrySetupModal } from '@/components/CountrySetupModal';
import { CargoBackgroundStatus } from '@/components/cargo/CargoBackgroundStatus';

SplashScreen.preventAutoHideAsync();
import { CargoPushListener } from '@/components/cargo/CargoNotifications';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function RootLayoutNav() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const check = () => { void reconcileCargoBackgroundSharing().catch(() => {}); };
    check();
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') check();
    });
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') check();
    }, 30_000);
    return () => { listener.remove(); clearInterval(timer); };
  }, []);
  return (
    <>
    <CargoPushListener />
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="subscription" options={{ headerShown: false }} />
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
    <CargoBackgroundStatus />
    </>
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
              <CartProvider>
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
              </CartProvider>
            </AuthProvider>
          </I18nProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
