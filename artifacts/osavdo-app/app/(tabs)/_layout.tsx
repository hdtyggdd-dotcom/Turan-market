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

function NativeTabLayout() {
  const { t } = useI18n();

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>{t('home')}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search">
        <Icon sf={{ default: 'magnifyingglass', selected: 'magnifyingglass' }} />
        <Label>{t('search')}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="create">
        <Icon sf={{ default: 'plus.circle', selected: 'plus.circle.fill' }} />
        <Label>{t('addListing')}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="cargo">
        <Icon sf={{ default: 'box.truck', selected: 'box.truck.fill' }} />
        <Label>{t('cargo')}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <Label>{t('profile')}</Label>
      </NativeTabs.Trigger>
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
        name="search"
        options={{
          title: t('search'),
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="magnifyingglass" tintColor={color} size={24} />
            ) : (
              <Feather name="search" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: t('addListing'),
          tabBarItemStyle: {
            borderRadius: 20,
            marginHorizontal: 2,
            marginVertical: 1,
          },
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="plus.circle.fill" tintColor={color} size={26} />
            ) : (
              <Feather name="plus-circle" size={24} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="cargo"
        options={{
          title: t('cargo'),
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="box.truck.fill" tintColor={color} size={24} />
            ) : (
              <Feather name="truck" size={22} color={color} />
            ),
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
      <Tabs.Screen
        name="orders"
        options={{
          href: null,
        }}
      />
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
