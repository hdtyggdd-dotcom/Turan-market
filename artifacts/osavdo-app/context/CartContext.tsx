import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getCart, addCartItem, updateCartItem, removeCartItem, clearCart, mergeCart,
  type Listing, type Cart, type CartItem, type CartAddInput,
  type CartQuantityInput, type CartRemoveInput, type CartClearInput, type CartMergeInput,
} from '@workspace/api-client-react';
import { useAuth } from './AuthContext';

export type { CartItem } from '@workspace/api-client-react';
type Pending =
  | { action: 'add'; data: CartAddInput }
  | { action: 'quantity'; listingId: string; data: CartQuantityInput }
  | { action: 'remove'; listingId: string; data: CartRemoveInput }
  | { action: 'clear'; data: CartClearInput };

interface CartContextValue {
  items: CartItem[];
  count: number;
  ready: boolean;
  syncing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addItem: (listing: Listing, quantity?: number) => Promise<void>;
  refreshItem: (listing: Listing, expected?: CartItem) => Promise<void>;
  setQuantity: (listingId: string, quantity: number, requestId?: string) => Promise<void>;
  removeItem: (listingId: string, expected?: CartItem) => Promise<void>;
  clear: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);
const makeId = () => `cart_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
type State = Cart & { owner: string | null; ready: boolean; syncing: boolean; error: string | null };
const empty = (owner: string | null): State => ({ owner, items: [], revision: 0, ready: !owner, syncing: false, error: null });

function decodeLegacy(raw: string): CartItem[] {
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || !value.every(item =>
    item && Number.isSafeInteger(item.quantity) && item.quantity > 0 && item.quantity <= 999 &&
    item.listing && typeof item.listing.id === 'string' && typeof item.listing.userId === 'string' &&
    typeof item.listing.title === 'string' && Number.isFinite(item.listing.price) &&
    item.listing.price >= 0 && Array.isArray(item.listing.images) &&
    item.listing.images.every((image: unknown) => typeof image === 'string') &&
    (item.requestId === undefined || (typeof item.requestId === 'string' && /^[A-Za-z0-9_-]{8,160}$/.test(item.requestId)))
  )) throw new Error('Eski savatcha o‘qilmadi; qurilmadagi ma’lumot o‘chirilmagan.');
  return value.map(item => ({ ...item, requestId: item.requestId ?? makeId() })) as CartItem[];
}

function send(pending: Pending, options: RequestInit): Promise<Cart> {
  switch (pending.action) {
    case 'add': return addCartItem(pending.data, options);
    case 'quantity': return updateCartItem(pending.listingId, pending.data, options);
    case 'remove': return removeCartItem(pending.listingId, pending.data, options);
    case 'clear': return clearCart(pending.data, options);
  }
}
const message = (error: unknown) => error instanceof Error ? error.message : 'Savatcha yangilanmadi.';
const definitive = (error: unknown) => {
  const status = (error as { status?: number })?.status;
  // Authentication expiry and throttling are recoverable, not rejected intent.
  return status !== undefined && [400, 403, 404, 409, 422].includes(status);
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, token, expireSession } = useAuth();
  const owner = user?.id ?? null;
  const [state, setState] = useState<State>(() => empty(null));
  const current = useRef(state);
  const session = useRef({ owner, token, generation: 0 });
  if (session.current.owner !== owner || session.current.token !== token) {
    session.current = { owner, token, generation: session.current.generation + 1 };
  }
  const generation = session.current.generation;
  const writes = useRef<Promise<void>>(Promise.resolve());
  const active = useCallback(() => session.current.generation === generation, [generation]);
  const publish = useCallback((next: State) => {
    if (active()) { current.current = next; setState(next); }
  }, [active]);
  // Explicit credentials bind queued requests to their original account, even after logout.
  const options = useCallback((): RequestInit => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);
  const queue = useCallback((work: () => Promise<void>) => {
    const operation = writes.current.then(work);
    writes.current = operation.catch(() => {});
    return operation;
  }, []);

  const refreshNow = useCallback(async () => {
    if (!owner || !token || !active()) return;
    const pendingKey = `turan_cart_pending:${owner}`;
    try {
      publish({ ...current.current, syncing: true });
      const legacyKey = `turan_cart:${owner}`;
      const migrationKey = `turan_cart_migration:${owner}`;
      const [legacy, savedMigration] = await AsyncStorage.multiGet([legacyKey, migrationKey]);
      let migration: CartMergeInput | null = savedMigration[1] ? JSON.parse(savedMigration[1]) : null;
      if (!migration && legacy[1]) {
        migration = { items: decodeLegacy(legacy[1]), operationId: makeId() };
        // Persist generated identities BEFORE sending, including for old ID-less carts.
        await AsyncStorage.setItem(migrationKey, JSON.stringify(migration));
      }
      if (!active()) return;
      if (migration) {
        await mergeCart(migration, options());
        // A cleanup failure is safe: the same durable receipt is retried, not re-imported.
        await AsyncStorage.removeItem(legacyKey);
        await AsyncStorage.removeItem(migrationKey);
      }
      const rawPending = await AsyncStorage.getItem(pendingKey);
      if (!active()) return;
      if (rawPending) {
        try { await send(JSON.parse(rawPending) as Pending, options()); }
        catch (error) {
          if (definitive(error)) await AsyncStorage.removeItem(pendingKey);
          throw error;
        }
        await AsyncStorage.removeItem(pendingKey);
      }
      if (!active()) return;
      const cart = await getCart(options());
      publish({ ...cart, owner, ready: true, syncing: false, error: null });
    } catch (error) {
      if ((error as { status?: number }).status === 401 && token && active()) await expireSession(token);
      publish({ ...current.current, owner, ready: false, syncing: false,
        error: `${message(error)} Eski savatcha va noaniq so‘rovlar qurilmada saqlanadi. Qayta urinib ko‘ring.` });
      throw error;
    }
  }, [owner, token, active, publish, options, expireSession]);
  const refresh = useCallback(() => queue(refreshNow), [queue, refreshNow]);

  useEffect(() => {
    const initial = empty(owner);
    current.current = initial;
    setState(initial);
    void refresh().catch(() => {});
    if (!owner) return;
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') void refresh().catch(() => {});
    }, 15000);
    const subscription = AppState.addEventListener('change', status => {
      if (status === 'active') void refresh().catch(() => {});
    });
    return () => { clearInterval(interval); subscription.remove(); };
  }, [owner, refresh]);

  const mutate = useCallback((prepare: (cart: Cart) => Pending) => queue(async () => {
    if (!owner || !token || !active()) throw new Error('Savatdan foydalanish uchun qayta kiring.');
    const key = `turan_cart_pending:${owner}`;
    const previous = await AsyncStorage.getItem(key);
    if (current.current.owner !== owner || !current.current.ready || previous) {
      await refreshNow();
      if (!active()) throw new Error('Kirish ruxsati yangilanishi kerak. Qayta kiring.');
      if (previous) throw new Error('Oldingi savatcha so‘rovi qayta tekshirildi. Savatdagi miqdorni tekshiring; zarur bo‘lsa keyin yangi mahsulot qo‘shing.');
    }
    let journaled = false;
    try {
      const pending = prepare(current.current);
      publish({ ...current.current, syncing: true });
      // Do not replace an uncertain mutation with a different user action.
      if (await AsyncStorage.getItem(key)) throw new Error('Oldingi so‘rov holati noaniq. Savatchani yangilang.');
      await AsyncStorage.setItem(key, JSON.stringify(pending));
      journaled = true;
      if (!active()) return; // Next login replays the original account's journal.
      const cart = await send(pending, options());
      await AsyncStorage.removeItem(key);
      publish({ ...cart, owner, ready: true, syncing: false, error: null });
    } catch (error) {
      if ((error as { status?: number }).status === 401 && active()) await expireSession(token);
      let certain = definitive(error);
      if (journaled && certain) {
        try { await AsyncStorage.removeItem(key); } catch { certain = false; }
      }
      publish({ ...current.current, syncing: false, ready: current.current.ready && (!journaled || certain),
        error: `${message(error)}${journaled && !certain ? ' So‘rov holati noaniq. Savatchani yangilab, aynan shu so‘rovni qayta tekshiring.' : ''}` });
      throw error;
    }
  }), [owner, token, active, options, publish, queue, refreshNow, expireSession]);

  const addItem = useCallback((listing: Listing, quantity = 1) => mutate(() => {
    if (listing.userId === owner) throw new Error('O‘z mahsulotingizni savatchaga qo‘sha olmaysiz.');
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 999) throw new Error('Miqdor 1 dan 999 gacha bo‘lishi kerak.');
    return { action: 'add', data: { listingId: listing.id, quantity, requestId: makeId(), operationId: makeId() } };
  }), [mutate, owner]);
  const setQuantity = useCallback((listingId: string, quantity: number, requestId?: string) => mutate(cart => {
    const item = cart.items.find(item => item.listing.id === listingId && (!requestId || item.requestId === requestId));
    if (!item || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 999) throw new Error('Miqdor 1 dan 999 gacha bo‘lishi kerak.');
    return { action: 'quantity', listingId, data: { quantity, requestId: item.requestId, revision: cart.revision, operationId: makeId() } };
  }), [mutate]);
  const refreshItem = useCallback((listing: Listing, expected?: CartItem) => mutate(cart => {
    const item = cart.items.find(item => item.listing.id === listing.id && (!expected || item.requestId === expected.requestId));
    if (!item) throw new Error('Mahsulot savatchada topilmadi.');
    return { action: 'quantity', listingId: listing.id, data: { quantity: item.quantity, requestId: item.requestId, revision: cart.revision, operationId: makeId(), refreshListing: true } };
  }), [mutate]);
  const removeItem = useCallback((listingId: string, expected?: CartItem) => mutate(cart => {
    const item = expected ?? cart.items.find(item => item.listing.id === listingId);
    if (!item) throw new Error('Mahsulot savatchada topilmadi.');
    return { action: 'remove', listingId, data: { requestId: item.requestId, quantity: item.quantity, operationId: makeId() } };
  }), [mutate]);
  const clear = useCallback(() => mutate(cart => ({
    action: 'clear', data: { revision: cart.revision, operationId: makeId() },
  })), [mutate]);
  const items = state.owner === owner ? state.items : [];
  return (
    <CartContext.Provider value={{
      items, count: items.reduce((total, item) => total + item.quantity, 0),
      ready: state.owner === owner && state.ready, syncing: state.owner === owner && state.syncing,
      error: state.owner === owner ? state.error : null,
      refresh, addItem, refreshItem, setQuantity, removeItem, clear,
    }}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
}
