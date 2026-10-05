import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Listing } from '@workspace/api-client-react';
import { useAuth } from './AuthContext';

export interface CartItem {
  listing: Listing;
  quantity: number;
  requestId: string;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  ready: boolean;
  error: string | null;
  addItem: (listing: Listing, quantity?: number) => Promise<void>;
  refreshItem: (listing: Listing) => Promise<void>;
  setQuantity: (listingId: string, quantity: number) => Promise<void>;
  removeItem: (listingId: string) => Promise<void>;
  clear: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);
const MAX_QUANTITY = 999;
const makeRequestId = () => `cart_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;

function decodeCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || !value.every((item) =>
    item && Number.isSafeInteger(item.quantity) && item.quantity > 0 && item.quantity <= MAX_QUANTITY &&
    item.listing && typeof item.listing.id === 'string' && typeof item.listing.userId === 'string' &&
    typeof item.listing.title === 'string' && Number.isFinite(item.listing.price) &&
    item.listing.price >= 0 && Array.isArray(item.listing.images) &&
    item.listing.images.every((image: unknown) => typeof image === 'string')
  )) {
    throw new Error('Saqlangan savatcha ma’lumotlari o‘qilmadi.');
  }
  return value.map((item) => ({
    ...item,
    requestId: typeof item.requestId === 'string' ? item.requestId : makeRequestId(),
  })) as CartItem[];
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const owner = user?.id ?? null;
  const [state, setState] = useState<{ owner: string | null; items: CartItem[]; ready: boolean; error: string | null }>({
    owner: null, items: [], ready: false, error: null,
  });
  const current = useRef(state);
  const writes = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    const initial = { owner, items: [] as CartItem[], ready: !owner, error: null };
    current.current = initial;
    setState(initial);
    if (owner) {
      // Complete earlier writes before reading the same account on re-login.
      writes.current.then(() => AsyncStorage.getItem(`turan_cart:${owner}`))
        .then(async (raw) => {
          if (cancelled) return;
          const loaded = { owner, items: decodeCart(raw), ready: true, error: null };
          await AsyncStorage.setItem(`turan_cart:${owner}`, JSON.stringify(loaded.items));
          if (cancelled) return;
          current.current = loaded;
          setState(loaded);
        })
        .catch(() => {
          if (cancelled) return;
          const failed = { ...initial, ready: false, error: 'Savatcha yuklanmadi. Ilovani qayta ochib ko‘ring.' };
          current.current = failed;
          setState(failed);
        });
    }
    return () => { cancelled = true; };
  }, [owner]);

  const mutate = useCallback((update: (items: CartItem[]) => CartItem[]) => {
    const operation = writes.current.then(async () => {
      if (!owner || current.current.owner !== owner || !current.current.ready) {
        throw new Error('Savatcha tayyor emas. Avval akkauntingizga kiring.');
      }
      const nextItems = update(current.current.items);
      await AsyncStorage.setItem(`turan_cart:${owner}`, JSON.stringify(nextItems));
      if (current.current.owner === owner) {
        const next = { owner, items: nextItems, ready: true, error: null };
        current.current = next;
        setState(next);
      }
    });
    writes.current = operation.catch((error: unknown) => {
      if (current.current.owner === owner) {
        const next = { ...current.current, error: error instanceof Error ? error.message : 'Savatchani saqlab bo‘lmadi.' };
        current.current = next;
        setState(next);
      }
    });
    return operation;
  }, [owner]);

  const addItem = useCallback((listing: Listing, quantity = 1) => mutate((items) => {
    if (listing.userId === owner) throw new Error('O‘z mahsulotingizni savatchaga qo‘sha olmaysiz.');
    if (listing.status !== 'active') throw new Error('Bu mahsulot hozir sotuvda emas.');
    if (!Number.isFinite(listing.price) || listing.price < 0) throw new Error('Mahsulot narxi noto‘g‘ri.');
    const existing = items.find((item) => item.listing.id === listing.id);
    if (!Number.isSafeInteger(quantity) || quantity < 1 || (existing?.quantity ?? 0) + quantity > MAX_QUANTITY) {
      throw new Error('Bir mahsulotdan 1 dan 999 gacha qo‘shish mumkin.');
    }
    return existing
      ? items.map((item) => item.listing.id === listing.id ? { ...item, listing, quantity: item.quantity + quantity } : item)
      : [...items, { listing, quantity, requestId: makeRequestId() }];
  }), [mutate, owner]);
  const refreshItem = useCallback((listing: Listing) =>
    mutate((items) => items.map((item) => item.listing.id === listing.id ? { ...item, listing } : item)), [mutate]);

  const setQuantity = useCallback((listingId: string, quantity: number) => mutate((items) => {
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      throw new Error('Miqdor 1 dan 999 gacha bo‘lishi kerak.');
    }
    return items.map((item) => item.listing.id === listingId ? { ...item, quantity } : item);
  }), [mutate]);
  const removeItem = useCallback((listingId: string) =>
    mutate((items) => items.filter((item) => item.listing.id !== listingId)), [mutate]);
  const clear = useCallback(() => mutate(() => []), [mutate]);
  const items = state.owner === owner ? state.items : [];

  return (
    <CartContext.Provider value={{
      items, count: items.reduce((total, item) => total + item.quantity, 0),
      ready: state.owner === owner && state.ready,
      error: state.owner === owner ? state.error : null,
      addItem, refreshItem, setQuantity, removeItem, clear,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
}
