import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";

// Execute the actual headless module with only the native/HTTP boundaries mocked.
// These tests do not claim to prove native OS scheduling.
const entry = fileURLToPath(new URL("../../../osavdo-app/services/cargo-background-location.ts", import.meta.url));
const moduleNames = new Set([
  "@react-native-async-storage/async-storage", "react-native", "expo-task-manager",
  "expo-location", "@workspace/api-client-react",
]);
const compiled = await build({
  entryPoints: [entry], bundle: true, write: false, platform: "node", format: "cjs",
  plugins: [{
    name: "native-test-boundaries",
    setup(builder) {
      builder.onResolve({ filter: /.*/ }, args =>
        moduleNames.has(args.path) ? { path: args.path, namespace: "test-mock" } : undefined);
      builder.onLoad({ filter: /.*/, namespace: "test-mock" }, args => ({
        contents: `module.exports = globalThis.__cargoMocks[${JSON.stringify(args.path)}];`,
      }));
    },
  }],
});
const code = compiled.outputFiles[0]!.text;
type Session = { consentId: string; userId: string; authSession: string; loadId: string; lastSentAt: number };
type LocationEvent = { data?: { locations: Array<{ timestamp: number; coords: { latitude: number; longitude: number } }> }; error?: unknown };
type Api = {
  startCargoBackgroundSharing: (id: string, userId: string) => Promise<void>;
  stopCargoBackgroundSharing: (id?: string) => Promise<void>;
  getCargoBackgroundSharing: () => Promise<string | null>;
  reconcileCargoBackgroundSharing: () => Promise<void>;
};
class TestApiError extends Error { constructor(public status: number) { super(`HTTP ${status}`); } }

function harness(os = "android") {
  const disk = new Map<string, string>([
    ["osavdo_token", "test-session-not-a-real-token"],
    ["osavdo_user", JSON.stringify({ id: "driver" })],
    ["osavdo_auth_session", "auth-session"],
  ]);
  let handler!: (event: LocationEvent) => Promise<void>;
  let available = true;
  let permission = true;
  let running = false;
  let canUpdate = true;
  let trackingError: Error | null = null;
  let beforeTracking: (() => Promise<void>) | null = null;
  let beforePermission: ((kind: string) => Promise<void>) | null = null;
  let beforeNativeStart: (() => Promise<void>) | null = null;
  const calls: Array<{ id: string; body: Record<string, unknown>; options: { signal: AbortSignal; headers: Record<string, string> } }> = [];
  const registrations: string[] = [];
  const starts: Record<string, unknown>[] = [];
  const permissionRequests: string[] = [];
  const module = { exports: {} };
  runInNewContext(code, {
    exports: module.exports, module,
    process: { env: { EXPO_PUBLIC_DOMAIN: "unit-test.invalid" } },
    __DEV__: true, AbortController, setTimeout, clearTimeout,
    __cargoMocks: {
      "react-native": { Platform: { OS: os } },
      "@react-native-async-storage/async-storage": {
        getItem: async (key: string) => disk.get(key) ?? null,
        multiGet: async (keys: string[]) => keys.map(key => [key, disk.get(key) ?? null]),
        setItem: async (key: string, value: string) => { disk.set(key, value); },
        removeItem: async (key: string) => { disk.delete(key); },
      },
      "expo-task-manager": {
        isAvailableAsync: async () => available,
        defineTask: (name: string, callback: typeof handler) => { registrations.push(name); handler = callback; },
      },
      "expo-location": {
        Accuracy: { Balanced: 3 }, ActivityType: { AutomotiveNavigation: 2 },
        requestForegroundPermissionsAsync: async () => {
          permissionRequests.push("foreground");
          if (beforePermission) await beforePermission("foreground");
          return { granted: permission };
        },
        requestBackgroundPermissionsAsync: async () => {
          permissionRequests.push("background");
          if (beforePermission) await beforePermission("background");
          return { granted: permission };
        },
        getBackgroundPermissionsAsync: async () => ({ granted: permission }),
        hasStartedLocationUpdatesAsync: async () => running,
        startLocationUpdatesAsync: async (_name: string, options: Record<string, unknown>) => {
          if (beforeNativeStart) await beforeNativeStart();
          running = true;
          starts.push(options);
        },
        stopLocationUpdatesAsync: async () => { running = false; },
      },
      "@workspace/api-client-react": {
        ApiError: TestApiError,
        setBaseUrl: () => {}, setAuthTokenGetter: () => {},
        getCargoTracking: async () => {
          if (beforeTracking) await beforeTracking();
          if (trackingError) throw trackingError;
          return { canUpdate };
        },
        updateCargoLocation: async (id: string, body: Record<string, unknown>, options: typeof calls[number]["options"]) => {
          if (options.signal.aborted) throw new Error("aborted");
          calls.push({ id, body, options });
          return { canUpdate };
        },
      },
    },
  });
  const session = () => {
    const value = disk.get("osavdo_cargo_background_session");
    return value ? JSON.parse(value) as Session : null;
  };
  return {
    api: module.exports as Api, disk, calls, registrations, starts, permissionRequests, session,
    event: async (timestamp = Date.now()) => handler({ data: { locations: [
      { timestamp: timestamp - 1000, coords: { latitude: 40, longitude: 68 } },
      { timestamp, coords: { latitude: 41, longitude: 69 } },
    ] } }),
    errorEvent: async () => handler({ error: new Error("permission revoked") }),
    running: () => running,
    setAvailable: (value: boolean) => { available = value; },
    setPermission: (value: boolean) => { permission = value; },
    setCanUpdate: (value: boolean) => { canUpdate = value; },
    setTrackingError: (value: Error | null) => { trackingError = value; },
    setBeforeTracking: (value: (() => Promise<void>) | null) => { beforeTracking = value; },
    setBeforePermission: (value: ((kind: string) => Promise<void>) | null) => { beforePermission = value; },
    setBeforeNativeStart: (value: (() => Promise<void>) | null) => { beforeNativeStart = value; },
  };
}

test("headless registration requests no permissions; explicit start uses battery-aware native options", async () => {
  const h = harness();
  assert.equal(h.registrations.length, 1);
  assert.equal(h.permissionRequests.length, 0);
  assert.equal(h.running(), false);
  await h.api.startCargoBackgroundSharing("load", "driver");
  assert.deepEqual(h.permissionRequests, ["foreground", "background"]);
  assert.equal(h.running(), true);
  assert.equal(h.starts[0]?.timeInterval, 60_000);
  assert.equal(h.starts[0]?.distanceInterval, 100);
  assert.equal(h.starts[0]?.accuracy, 3);
  assert.equal(h.starts[0]?.showsBackgroundLocationIndicator, true);
  const timestamp = Date.now() - 1000;
  await h.event(timestamp);
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0]?.body.lat, 41, "newest batch fix is selected");
  assert.equal(h.calls[0]?.body.sampledAt, new Date(timestamp).toISOString());
  await h.event();
  assert.equal(h.calls.length, 1, "frequent OS events are throttled");
  assert(!JSON.stringify(h.session()).includes("test-session-not-a-real-token"), "consent stores no token copy");
  await h.api.stopCargoBackgroundSharing();
  assert.equal(h.running(), false);
  assert.equal(h.session(), null);
});

test("web, Expo Go, missing consent and denied permission never start sharing", async () => {
  const web = harness("web");
  assert.equal(web.registrations.length, 0);
  await assert.rejects(web.api.startCargoBackgroundSharing("load", "driver"));
  const h = harness();
  h.setAvailable(false);
  await assert.rejects(h.api.startCargoBackgroundSharing("load", "driver"));
  assert.equal(h.permissionRequests.length, 0);
  h.setAvailable(true);
  h.setPermission(false);
  await assert.rejects(h.api.startCargoBackgroundSharing("load", "driver"));
  assert.equal(h.running(), false);
  assert.equal(h.session(), null);
  await h.event();
  assert.equal(h.calls.length, 0);
});

test("account/session changes, revoked permission, delivery and terminal HTTP errors stop the native task", async () => {
  for (const change of ["account", "session", "permission", "delivery", "401", "403", "404", "409"]) {
    const h = harness();
    await h.api.startCargoBackgroundSharing("load", "driver");
    if (change === "account") h.disk.set("osavdo_user", JSON.stringify({ id: "someone-else" }));
    else if (change === "session") h.disk.set("osavdo_auth_session", "new-auth-session");
    else if (change === "permission") h.setPermission(false);
    else if (change === "delivery") h.setCanUpdate(false);
    else h.setTrackingError(new TestApiError(Number(change)));
    await h.event();
    assert.equal(h.calls.length, 0, change);
    assert.equal(h.running(), false, change);
    assert.equal(h.session(), null, change);
  }
});

test("offline failures drop fixes without deleting consent; stale fixes never upload", async () => {
  const h = harness();
  await h.api.startCargoBackgroundSharing("load", "driver");
  await h.event(Date.now() - 240_000);
  assert.equal(h.calls.length, 0);
  h.setTrackingError(new Error("offline"));
  await h.event();
  assert.equal(h.calls.length, 0);
  assert.equal(h.running(), true);
  assert(h.session());
  h.setTrackingError(null);
  await h.event();
  assert.equal(h.calls.length, 1);
});

test("opt-out while an HTTP request is pending prevents upload and cannot restore consent", async () => {
  const h = harness();
  await h.api.startCargoBackgroundSharing("load", "driver");
  let release!: () => void;
  let entered!: () => void;
  const wait = new Promise<void>(resolve => { release = resolve; });
  const reached = new Promise<void>(resolve => { entered = resolve; });
  h.setBeforeTracking(async () => { entered(); await wait; });
  const event = h.event();
  await reached;
  await h.api.stopCargoBackgroundSharing();
  release();
  await event;
  assert.equal(h.calls.length, 0);
  assert.equal(h.session(), null);
  assert.equal(h.running(), false);
});

test("one device tracks one cargo; nonmatching screen cleanup cannot stop another cargo", async () => {
  const h = harness();
  await h.api.startCargoBackgroundSharing("load", "driver");
  await assert.rejects(h.api.startCargoBackgroundSharing("other", "driver"));
  await h.api.stopCargoBackgroundSharing("other");
  assert.equal(await h.api.getCargoBackgroundSharing(), "load");
  h.setCanUpdate(false);
  await h.api.reconcileCargoBackgroundSharing();
  assert.equal(h.running(), false);
  assert.equal(h.session(), null);
});

for (const phase of ["foreground", "background", "tracking", "native-start"]) {
  test(`status polling during delayed ${phase} cannot cancel successful opt-in`, async () => {
    const h = harness();
    let release!: () => void;
    let entered!: () => void;
    const wait = new Promise<void>(resolve => { release = resolve; });
    const reached = new Promise<void>(resolve => { entered = resolve; });
    const pause = async () => { entered(); await wait; };
    if (phase === "tracking") h.setBeforeTracking(pause);
    else if (phase === "native-start") h.setBeforeNativeStart(pause);
    else h.setBeforePermission(async kind => { if (kind === phase) await pause(); });
    const start = h.api.startCargoBackgroundSharing("load", "driver");
    await reached;
    // Both root banner and cargo-card polls can run before the prompt resolves.
    const polls = [h.api.getCargoBackgroundSharing(), h.api.getCargoBackgroundSharing()];
    release();
    await start;
    assert.deepEqual(await Promise.all(polls), ["load", "load"]);
    assert.equal(h.running(), true);
    assert.equal(h.session()?.loadId, "load");
    h.setBeforeTracking(null);
    await h.event();
    assert.equal(h.calls.length, 1);
  });
}

test("an orphaned OS callback during startup cannot queue a stop after new consent", async () => {
  const h = harness();
  let release!: () => void;
  let entered!: () => void;
  const wait = new Promise<void>(resolve => { release = resolve; });
  const reached = new Promise<void>(resolve => { entered = resolve; });
  h.setBeforeTracking(async () => { entered(); await wait; });
  const start = h.api.startCargoBackgroundSharing("load", "driver");
  await reached;
  const event = h.event();
  release();
  await start;
  h.setBeforeTracking(null);
  await event;
  assert.equal(h.running(), true);
  assert.equal(h.session()?.loadId, "load");
  assert.equal(h.calls.length, 1);
});
