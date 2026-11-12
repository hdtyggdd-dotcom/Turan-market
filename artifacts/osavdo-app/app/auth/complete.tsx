import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { ActionAccessGate } from '@/components/ActionAccessGate';
import { safeActionReturn } from '@/services/action-access';

export default function CompleteProfile() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const target = safeActionReturn(returnTo);
  return <ActionAccessGate target={target}><Redirect href={target as '/(tabs)'} /></ActionAccessGate>;
}
