import React from 'react';
import { Platform, StyleSheet, useColorScheme, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Redirect, Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { ActivityIndicator } from 'react-native';
import { useCart } from '@/context/CartContext';

function NativeTabLayout() {
  const { t } = useI18n();

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>{t('home')}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="categories">
        <Icon sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }} />
        <Label>Kategoriyalar</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search">
        <Icon sf={{ default: 'plus.magnifyingglass', selected: 'plus.magnifyingglass' }} />
        <Label>Izlash / E’lon</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="cart">
        <Icon sf={{ default: 'cart', selected: 'cart.fill' }} />
        <Label>Savat</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <Label>{t('profile')}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="create" hidden />
      <NativeTabs.Trigger name="cargo" hidden />
      <NativeTabs.Trigger name="orders" hidden />
      <NativeTabs.Trigger name="my-products" hidden />
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const { t } = useI18n();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  const { count } = useCart();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
           left: 12,
           right: 12,
           bottom: isWeb ? 12 : 10,
           height: isWeb ? 68 : 70,
           backgroundColor: isIOS ? 'transparent' : colors.card,
           borderTopWidth: 0,
           borderWidth: 1,
           borderColor: colors.border,
           borderRadius: 24,
           paddingHorizontal: 5,
           paddingTop: 5,
           paddingBottom: 5,
          elevation: 0,
           shadowColor: colors.text,
           shadowOpacity: 0.1,
           shadowRadius: 16,
           shadowOffset: { width: 0, height: 6 },
           overflow: 'hidden',
        },
         tabBarItemStyle: {
           borderRadius: 18,
           marginHorizontal: 2,
           marginVertical: 3,
         },
         tabBarActiveBackgroundColor: colors.secondary,
         tabBarLabelStyle: {
           fontSize: 10,
           fontFamily: 'Inter_600SemiBold',
           marginBottom: 1,
         },
         tabBarHideOnKeyboard: true,
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint={isDark ? 'dark' : 'light'}
               style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
            />
          ) : isWeb ? (
             <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card, borderRadius: 24 }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house" tintColor={color} size={24} />
            ) : (
              <Feather name="home" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Kategoriyalar',
          tabBarIcon: ({ color }) => <Feather name="grid" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Izlash / E’lon',
          tabBarIcon: ({ color }) => <Feather name="plus-square" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Savat',
          tabBarBadge: count > 0 ? count : undefined,
          tabBarIcon: ({ color }) => <Feather name="shopping-cart" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person" tintColor={color} size={24} />
            ) : (
              <Feather name="user" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen name="create" options={{ href: null }} />
      <Tabs.Screen name="cargo" options={{ href: null }} />
      <Tabs.Screen name="orders" options={{ href: null }} />
      <Tabs.Screen name="my-products" options={{ href: null }} />

    </Tabs>
  );
}

export default function TabLayout() {
  const { token, isLoading } = useAuth();
  const colors = useColors();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!token) {
    return <Redirect href="/auth/login" />;
  }

  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
