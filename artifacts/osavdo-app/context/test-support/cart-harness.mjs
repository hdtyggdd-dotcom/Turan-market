import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import React from 'react';
import { act, create } from 'react-test-renderer';

// Compile the REAL provider, substituting only its platform/auth/network imports.
// No copied hooks, production test switches, live accounts, or native-module loading.
const require = createRequire(import.meta.url);
const replacements = {
  'react-native': 'export const AppState = dependencies.appState;',
  '@react-native-async-storage/async-storage': 'export default dependencies.storage;',
  './AuthContext': 'export const useAuth = () => dependencies.auth;',
  '@workspace/api-client-react': [
    'getCart', 'addCartItem', 'updateCartItem', 'removeCartItem', 'clearCart', 'mergeCart',
  ].map(name => `export const ${name} = dependencies.api.${name};`).join('\n'),
};
const bundle = await build({
  entryPoints: [new URL('../CartContext.tsx', import.meta.url).pathname],
  bundle: true, write: false, platform: 'node', format: 'cjs',
  external: ['react'], jsx: 'transform',
  plugins: [{
    name: 'cart-boundaries',
    setup(plugin) {
      plugin.onResolve({ filter: /.*/ }, args => {
        if (Object.hasOwn(replacements, args.path)) {
          return { path: args.path, namespace: 'cart-test' };
        }
      });
      plugin.onLoad({ filter: /.*/, namespace: 'cart-test' }, args => ({
        contents: replacements[args.path], loader: 'js',
      }));
    },
  }],
});
const loadProvider = new Function('require', 'module', 'exports', 'dependencies',
  bundle.outputFiles[0].text);

export const account = (id, token = `token-${id}`) => ({ user: { id }, token });
export const keys = owner => ({
  legacy: `turan_cart:${owner}`,
  migration: `turan_cart_migration:${owner}`,
  pending: `turan_cart_pending:${owner}`,
});
export const product = (id = 'product-one') => ({
  id, userId: 'seller', title: id, price: 10, images: [],
});
export const item = (id = 'product-one', quantity = 2) => ({
  listing: product(id), quantity, requestId: `request-${id}`,
});
export const httpError = status => Object.assign(new Error(`HTTP ${status}`), { status });
export function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

// One-shot failures/gates execute in the precise call selected, never via sleeps.
function controls() {
  const scripts = new Map();
  return {
    once(name, handler) {
      const list = scripts.get(name) ?? [];
      list.push(handler);
      scripts.set(name, list);
    },
    async before(name, detail) {
      const handler = scripts.get(name)?.shift();
      if (handler) await handler(detail);
    },
    fail(name, error = new Error('storage unavailable')) {
      this.once(name, () => { throw error; });
    },
    hold(name) {
      const entered = deferred();
      const released = deferred();
      this.once(name, detail => { entered.resolve(detail); return released.promise; });
      return { entered: entered.promise, release: released.resolve, reject: released.reject };
    },
  };
}

export async function harness(t, initial = account('alice')) {
  // This flag is required by React act; tests run sequentially in this file.
  const oldActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const originalError = console.error;
  t.mock.method(console, 'error', (...args) => {
    // Renderer 19's expected deprecation notice only; do not hide React warnings.
    if (String(args[0]).startsWith('react-test-renderer is deprecated.')) return;
    originalError(...args);
  });
  // Generated identities are unique but reproducible within each isolated test.
  let idSequence = 0;
  t.mock.method(Date, 'now', () => 1800000000000);
  t.mock.method(Math, 'random', () => ++idSequence / 1000);
  t.mock.timers.enable({ apis: ['setInterval'] });
  const trace = [];
  const disk = new Map();
  const storageControl = controls();
  const apiControl = controls();
  const expired = [];
  const snapshots = [];
  const listeners = new Set();
  const credentials = new Map();
  const carts = new Map();
  const receipts = new Map();
  const effects = [];
  let renderer;
  let value;
  const dependencies = {
    auth: null,
    appState: {
      currentState: 'active',
      addEventListener(event, listener) {
        assert.equal(event, 'change');
        listeners.add(listener);
        return { remove: () => listeners.delete(listener) };
      },
    },
    storage: {},
    api: {},
  };
  for (const method of ['getItem', 'setItem', 'removeItem', 'multiGet']) {
    dependencies.storage[method] = async (key, data) => {
      trace.push({ boundary: 'storage', method, key, data });
      await storageControl.before(`${method}:${Array.isArray(key) ? key[0] : key}`, { key, data });
      if (method === 'getItem') return disk.get(key) ?? null;
      if (method === 'setItem') { disk.set(key, data); return; }
      if (method === 'removeItem') { disk.delete(key); return; }
      return key.map(entry => [entry, disk.get(entry) ?? null]);
    };
  }
  const cartFor = owner => carts.get(owner) ?? { items: [], revision: 0 };
  for (const method of [
    'getCart', 'addCartItem', 'updateCartItem', 'removeCartItem', 'clearCart', 'mergeCart',
  ]) {
    dependencies.api[method] = async (...args) => {
      const options = args.at(-1);
      const token = options.headers.Authorization.replace('Bearer ', '');
      assert(credentials.has(token), `Unexpected credential: ${token}`);
      const owner = credentials.get(token);
      const body = method === 'getCart' ? undefined : args.at(-2);
      const call = { boundary: 'api', method, owner, token, body: structuredClone(body) };
      trace.push(call);
      // Script can reject before commit, or gate the response after commit.
      await apiControl.before(method, call);
      const receiptKey = `${owner}:${body?.operationId}`;
      if (method !== 'getCart' && !receipts.has(receiptKey)) {
        const cart = structuredClone(cartFor(owner));
        if (method === 'addCartItem') {
          const existing = cart.items.find(entry => entry.listing.id === body.listingId);
          if (existing) existing.quantity += body.quantity;
          else cart.items.push({ listing: product(body.listingId), quantity: body.quantity, requestId: body.requestId });
        } else if (method === 'mergeCart') {
          for (const incoming of body.items) {
            const existing = cart.items.find(entry => entry.listing.id === incoming.listing.id);
            if (existing) existing.quantity = Math.max(existing.quantity, incoming.quantity);
            else cart.items.push(structuredClone(incoming));
          }
        } else if (method === 'updateCartItem') {
          cart.items.find(entry => entry.requestId === body.requestId).quantity = body.quantity;
        } else if (method === 'removeCartItem') {
          cart.items = cart.items.filter(entry => entry.requestId !== body.requestId);
        } else if (method === 'clearCart') cart.items = [];
        cart.revision += 1;
        carts.set(owner, cart);
        receipts.set(receiptKey, structuredClone(cart));
        effects.push(call);
      }
      const result = structuredClone(method === 'getCart' ? cartFor(owner) : receipts.get(receiptKey));
      await apiControl.before(`${method}:response`, call);
      return result;
    };
  }
  const mod = { exports: {} };
  loadProvider(require, mod, mod.exports, dependencies);
  const { CartProvider, useCart } = mod.exports;
  function Probe() {
    value = useCart();
    snapshots.push({
      owner: dependencies.auth.user?.id ?? null,
      items: structuredClone(value.items), ready: value.ready,
      syncing: value.syncing, error: value.error,
    });
    return null;
  }
  const tree = () => React.createElement(CartProvider, null, React.createElement(Probe));
  function auth(session) {
    if (session.token) credentials.set(session.token, session.user.id);
    dependencies.auth = {
      ...session,
      expireSession: async token => { expired.push(token); },
    };
  }
  auth(initial);
  t.after(async () => {
    try {
      if (renderer) await act(async () => { renderer.unmount(); });
      assert.equal(listeners.size, 0, 'AppState listener must be cleaned up');
    } finally {
      globalThis.IS_REACT_ACT_ENVIRONMENT = oldActEnvironment;
    }
  });
  return {
    disk, trace, storage: storageControl, api: apiControl, expired, snapshots, effects,
    carts, receipts,
    get value() { return value; },
    calls(method) { return trace.filter(entry => entry.boundary === 'api' && entry.method === method); },
    async mount() { await act(async () => { renderer = create(tree()); }); },
    async unmount() { await act(async () => { renderer.unmount(); renderer = null; }); },
    async login(session) {
      await act(async () => { auth(session); renderer.update(tree()); });
    },
    async run(work) {
      let result;
      await act(async () => { result = await work(); });
      return result;
    },
    // Capture rejection immediately to avoid unhandled-rejection timing in gates.
    async start(work) {
      let result;
      await act(async () => {
        result = work().then(value => ({ value }), error => ({ error }));
      });
      return { result };
    },
    async foreground() {
      await act(async () => {
        dependencies.appState.currentState = 'active';
        for (const listener of listeners) listener('active');
      });
    },
    async tick() { await act(async () => { t.mock.timers.tick(15000); }); },
  };
}
