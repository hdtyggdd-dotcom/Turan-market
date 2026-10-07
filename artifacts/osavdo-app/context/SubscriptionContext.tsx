import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';
import { useAuth } from './AuthContext';
import { assertSandboxKey, createSubscriptionQueue } from '@/services/subscription-session';

const enqueue = createSubscriptionQueue();
const ENTITLEMENT = 'usta_access';
type SubscriptionState = {
  owner: string | null;
  customer: CustomerInfo | null;
  packages: PurchasesPackage[];
  loading: boolean;
  error: string | null;
};
export interface SubscriptionValue {
  isTest: true;
  active: boolean;
  loading: boolean;
  busy: boolean;
  packages: PurchasesPackage[];
  error: string | null;
  message: string | null;
  refresh: () => Promise<void>;
  purchase: (pkg: PurchasesPackage) => Promise<void>;
  restore: () => Promise<void>;
}
const Context = createContext<SubscriptionValue | null>(null);
const empty = (owner: string | null): SubscriptionState => ({ owner, customer: null, packages: [], loading: !!owner, error: null });

// Deliberately scoped to the subscription page: no paywall, login/onboarding
// change or anonymous RevenueCat customer is introduced elsewhere in the app.
export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const owner = user?.role === 'seller' ? user.id : null;
  const current = useRef(owner);
  current.current = owner;
  const mounted = useRef(true);
  const [state, setState] = useState(() => empty(owner));
  const [busyOwner, setBusyOwner] = useState<string | null>(null);
  const busyRef = useRef<string | null>(null);
  const [notice, setNotice] = useState<{ owner: string; text: string } | null>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const run = useCallback(async <T,>(target: string, operation: () => Promise<T>) => {
    const isCurrent = () => mounted.current && current.current === target;
    return enqueue(isCurrent, async () => {
      const key = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
      assertSandboxKey(process.env.EXPO_PUBLIC_REVENUECAT_MODE, key);
      const sdkOwner = `turan:${target}`;
      if (!await Purchases.isConfigured()) {
        await Purchases.setLogLevel(LOG_LEVEL.ERROR);
        Purchases.configure({ apiKey: key, appUserID: sdkOwner });
      } else if (await Purchases.getAppUserID() !== sdkOwner) {
        // Never alias two identified Turan accounts through logIn().
        await Purchases.logOut();
        if (!isCurrent()) throw new Error("Akkaunt o‘zgardi.");
        await Purchases.logIn(sdkOwner);
      }
      if (!isCurrent()) throw new Error("Akkaunt o‘zgardi.");
      return operation();
    });
  }, []);
  const refresh = useCallback(async () => {
    if (!owner) return;
    const target = owner;
    try {
      const result = await run(target, async () => {
        // The browser SDK rejects this method asynchronously outside its
        // wrapper's promise. Web getCustomerInfo already reads server state.
        if (Platform.OS !== 'web') await Purchases.invalidateCustomerInfoCache();
        const [customer, offerings] = await Promise.all([Purchases.getCustomerInfo(), Purchases.getOfferings()]);
        const packages = offerings.all.usta_test?.availablePackages ?? [];
        if (!packages.length) throw new Error("Sinov obunasi topilmadi. Keyinroq qayta urinib ko‘ring.");
        return { customer, packages };
      });
      if (mounted.current && current.current === target) setState({ owner: target, ...result, loading: false, error: null });
    } catch (error) {
      if (mounted.current && current.current === target) setState({ ...empty(target), loading: false, error: messageOf(error) });
    }
  }, [owner, run]);
  useEffect(() => {
    setState(empty(owner));
    setNotice(null);
    void refresh();
  }, [owner, refresh]);

  const act = useCallback(async (kind: 'purchase' | 'restore', pkg?: PurchasesPackage) => {
    if (!owner || busyRef.current) return;
    const target = owner;
    // Do not accept an arbitrary stale or caller-invented package.
    if (kind === 'purchase' && (!pkg || state.owner !== target || !state.packages.some((item) => item === pkg))) return;
    busyRef.current = target;
    setBusyOwner(target);
    setNotice(null);
    try {
      const customer = await run(target, async () => {
        if (kind === 'restore') return Purchases.restorePurchases();
        const existing = await Purchases.getCustomerInfo();
        if (existing.entitlements.active[ENTITLEMENT]) return existing;
        return (await Purchases.purchasePackage(pkg!)).customerInfo;
      });
      if (mounted.current && current.current === target) {
        setState((previous) => ({ ...previous, owner: target, customer, error: null }));
        setNotice({ owner: target, text: customer.entitlements.active[ENTITLEMENT]
          ? 'Sinov obunasi faol. Haqiqiy pul yechilmadi.'
          : 'Bu akkaunt uchun faol sinov obunasi topilmadi.' });
      }
    } catch (error) {
      if (mounted.current && current.current === target) {
        const cancelled = (error as { userCancelled?: boolean })?.userCancelled;
        setNotice({ owner: target, text: cancelled ? 'Sinov xaridi bekor qilindi.' : messageOf(error) });
      }
    } finally {
      if (busyRef.current === target) busyRef.current = null;
      if (mounted.current) setBusyOwner(null);
    }
  }, [owner, state, run]);
  const visible = state.owner === owner ? state : empty(owner);
  const value: SubscriptionValue = {
    isTest: true,
    active: !!visible.customer?.entitlements.active[ENTITLEMENT],
    loading: visible.loading,
    busy: busyOwner === owner && !!owner,
    packages: visible.packages,
    error: visible.error,
    message: notice?.owner === owner ? notice.text : null,
    refresh,
    purchase: (pkg) => act('purchase', pkg),
    restore: () => act('restore'),
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
function messageOf(error: unknown) {
  return error instanceof Error ? error.message : 'Obunani tekshirishda xato. Internetni tekshirib qayta urinib ko‘ring.';
}
export function useSubscription() {
  const context = useContext(Context);
  if (!context) throw new Error('SubscriptionProvider is required.');
  return context;
}
