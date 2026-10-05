import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import express from "express";
import type { Server } from "node:http";
import { createCargoRouter } from "./cargo.js";
import {
  cargoLoads, cargoOffers, cargoNotifications, cargoTrackingUpdates, driverProfiles, generateToken, vehicleTypes,
} from "../data/store.js";

const loadId = "tracking-regression-load";
const driver = driverProfiles.find(profile => profile.id === "driver-2")!;
const shipperId = "u1";
const outsiderId = "u2";
let server: Server;
let baseUrl: string;
const realFetch = globalThis.fetch;
const pushes: Array<Record<string, unknown>> = [];
const persisted: Array<{ collection: string; id: string; status: string }> = [];
const persistedBatches: Array<Array<{ collection: string; id: string; status: string }>> = [];
const failNextSave = new Set<string>();
const blockedSaves = new Map<string, { entered: () => void; wait: Promise<void> }>();

async function request(path: string, userId: string, method = "GET", body?: unknown) {
  const response = await realFetch(`${baseUrl}${path}`, {
    method,
    headers: { Authorization: `Bearer ${generateToken(userId)}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  // The assertions below validate heterogeneous success/error/list HTTP payloads.
  const data: any = await response.json();
  return { status: response.status, data };
}

before(async () => {
  // Existing cargo regression scenarios use explicitly vetted fixtures.
  for (const profile of driverProfiles) {
    const vehicle = vehicleTypes.find(item => item.id === profile.vehicleTypeId)!;
    profile.capacityKg = vehicle.capacityKg;
    profile.capacityM3 = vehicle.capacityM3;
    profile.reviewStatus = "approved";
    profile.documents = (["identity", "license", "registration"] as const).map(kind => ({
      id: `fixture-${profile.id}-${kind}`, kind, objectPath: "fixture-only", mimeType: "image/jpeg",
      status: "approved", submittedAt: new Date().toISOString(), reviewedAt: new Date().toISOString(),
    }));
  }
  const original = cargoLoads[0]!;
  cargoLoads.push({ ...original, id: loadId, shipperId, status: "open" });
  cargoOffers.push({
    id: "tracking-regression-offer", loadId, driverId: driver.id, amountUzs: 100000,
    message: null, status: "pending", counterAmountUzs: null, counterMessage: null,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    if (String(input) === "https://exp.host/--/api/v2/push/send") {
      const batch = JSON.parse(String(init?.body)) as Array<Record<string, unknown>>;
      pushes.push(...batch);
      return new Response(JSON.stringify({ data: batch.map(() => ({ status: "ok", id: "test-ticket" })) }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    return realFetch(input, init);
  }) as typeof fetch;
  const app = express();
  app.use(express.json());
  app.use("/api", createCargoRouter(async changes => {
    const ids = changes.map(({ item }) => item.id);
    const failing = ids.find(id => failNextSave.has(id));
    if (failing) { failNextSave.delete(failing); throw new Error("Injected save failure"); }
    const blocker = ids.map(id => blockedSaves.get(id)).find(Boolean);
    if (blocker) { blocker.entered(); await blocker.wait; }
    const batch = changes.map(({ collection, item }) => ({ collection, id: item.id, status: item.status }));
    persisted.push(...batch);
    persistedBatches.push(batch);
  }));
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({ error: "storage_failed" });
  });
  server = await new Promise<Server>(resolve => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });
  const address = server.address();
  assert(address && typeof address !== "string");
  baseUrl = `http://127.0.0.1:${address.port}/api`;
});

after(async () => {
  globalThis.fetch = realFetch;
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

test("cargo maps, assignment, tracking, GPS, inbox and push obey participant boundaries", async () => {
  let result = await request(`/cargo-loads/${loadId}/tracking`, outsiderId);
  assert.equal(result.status, 200);
  assert.equal(result.data.currentStage, null);
  assert.equal(result.data.currentLat, null);
  assert.equal(result.data.canUpdate, false);
  assert.equal(typeof result.data.pickup.lat, "number");
  assert.equal(typeof result.data.delivery.lng, "number");
  assert(!JSON.stringify(result.data).includes(cargoLoads[0]!.pickupAddress!));

  result = await request(`/cargo-loads/${loadId}/tracking`, driver.userId, "PATCH", { stage: "pickup_ready" });
  assert.equal(result.status, 403, "unassigned driver cannot update");

  const pushToken = "ExpoPushToken[regression-device]";
  assert.equal((await request("/push-tokens", shipperId, "POST", { token: pushToken })).status, 200);
  assert.equal((await request("/push-tokens", shipperId, "POST", { token: "invalid" })).status, 400);

  result = await request(`/cargo-loads/${loadId}/offers/tracking-regression-offer/accept`, shipperId, "POST");
  assert.equal(result.status, 200);
  result = await request(`/cargo-loads/${loadId}/tracking`, outsiderId);
  assert.equal(result.status, 403, "outsiders cannot see assigned GPS or notes");
  result = await request(`/cargo-loads/${loadId}/tracking`, driver.userId);
  assert.equal(result.data.currentStage, "accepted");
  assert.equal(result.data.canUpdate, true);

  assert.equal((await request(`/cargo-loads/${loadId}/tracking`, shipperId, "PATCH", { stage: "pickup_ready" })).status, 403);
  assert.equal((await request(`/cargo-loads/${loadId}/tracking`, driver.userId, "PATCH", { stage: "delivered" })).status, 409);
  assert.equal((await request(`/cargo-loads/${loadId}/location`, outsiderId, "PUT", { lat: 41, lng: 69 })).status, 403);
  assert.equal((await request(`/cargo-loads/${loadId}/location`, driver.userId, "PUT", { lat: 91, lng: 69 })).status, 400);
  assert.equal((await request(`/cargo-loads/${loadId}/location`, driver.userId, "PUT", { lat: "41", lng: 69 })).status, 400);
  const beforeLocation = cargoNotifications.length;
  result = await request(`/cargo-loads/${loadId}/location`, driver.userId, "PUT", { lat: 41.25, lng: 69.12 });
  assert.equal(result.status, 200);
  assert.equal(cargoNotifications.length, beforeLocation, "GPS does not spam the inbox");
  result = await request(`/cargo-loads/${loadId}/tracking`, shipperId);
  assert.equal(result.data.currentLat, 41.25);
  assert(result.data.locationUpdatedAt);

  for (const stage of ["pickup_ready", "picked_up", "in_transit", "border_control", "delivered"]) {
    result = await request(`/cargo-loads/${loadId}/tracking`, driver.userId, "PATCH", { stage, note: `Stage: ${stage}` });
    assert.equal(result.status, 200, `valid milestone ${stage}`);
    assert.equal(result.data.currentStage, stage);
  }
  assert.equal(cargoLoads.find(load => load.id === loadId)!.status, "delivered");
  assert(persisted.some(item => item.collection === "cargo_loads" && item.id === loadId && item.status === "delivered"));
  assert(persisted.some(item => item.collection === "cargo_offers" && item.id === "tracking-regression-offer" && item.status === "accepted"));
  assert.equal((await request(`/cargo-loads/${loadId}/tracking`, driver.userId, "PATCH", { stage: "in_transit" })).status, 409);
  assert.equal((await request(`/cargo-loads/${loadId}/location`, driver.userId, "PUT", { lat: 41, lng: 69 })).status, 409);
  const inbox = await request("/notifications", shipperId);
  const messages = inbox.data.filter((notification: { loadId: string }) => notification.loadId === loadId);
  assert.equal(messages.length, 6);
  assert.equal(messages[0].read, false);
  assert.equal((await request(`/notifications/${messages[0].id}/read`, outsiderId, "POST")).status, 404);
  assert.equal((await request(`/notifications/${messages[0].id}/read`, shipperId, "POST")).data.read, true);
  for (const userId of [shipperId, driver.userId]) {
    result = await request("/cargo-trips", userId);
    assert(result.data.some((load: { id: string }) => load.id === loadId));
  }
  result = await request("/cargo-trips", outsiderId);
  assert(!result.data.some((load: { id: string }) => load.id === loadId));
  assert.equal(pushes.length, 6, "each important milestone is sent to registered device");
  assert(pushes.every(push => push.to === pushToken && (push.data as { loadId: string }).loadId === loadId));
  assert.equal((await request("/push-tokens", shipperId, "DELETE", { token: pushToken })).data.registered, false);
});

test("domestic delivery can skip border control without skipping pickup milestones", async () => {
  const domesticId = `${loadId}-domestic`;
  cargoLoads.push({ ...cargoLoads[0]!, id: domesticId, shipperId, status: "accepted" });
  cargoOffers.push({
    ...cargoOffers.find(offer => offer.loadId === loadId)!,
    id: "domestic-offer", loadId: domesticId, status: "accepted",
  });
  for (const stage of ["pickup_ready", "picked_up", "in_transit", "delivered"]) {
    const result = await request(`/cargo-loads/${domesticId}/tracking`, driver.userId, "PATCH", { stage });
    assert.equal(result.status, 200);
  }
});

function createFixture(id: string, status: "negotiating" | "in_transit" | "accepted") {
  const load = { ...cargoLoads[0]!, id, shipperId, status, pickupDate: "2999-01-01" };
  const offer = {
    ...cargoOffers.find(item => item.loadId === loadId)!,
    id: `${id}-offer`, loadId: id, status: status === "negotiating" ? "pending" as const : "accepted" as const,
  };
  cargoLoads.push(load);
  cargoOffers.push(offer);
  return { load, offer };
}

test("failed delivery publishes no status, history, GPS or notification and remains retryable", async () => {
  const id = `${loadId}-failure`;
  const { load } = createFixture(id, "in_transit");
  const inboxCount = cargoNotifications.length;
  const persistedCount = persisted.length;
  failNextSave.add(id);
  const body = { stage: "delivered", note: "Retry-safe delivery", lat: 40, lng: 70 };
  const failed = await request(`/cargo-loads/${id}/tracking`, driver.userId, "PATCH", body);
  assert.equal(failed.status, 500);
  assert.equal(load.status, "in_transit");
  assert.equal(cargoTrackingUpdates.filter(update => update.loadId === id).length, 0);
  assert.equal(cargoNotifications.length, inboxCount);
  assert.equal(persisted.length, persistedCount);
  const visible = await request(`/cargo-loads/${id}/tracking`, shipperId);
  assert.equal(visible.data.currentStage, "in_transit");
  assert.equal(visible.data.currentLat, null);
  assert.equal(visible.data.locationUpdatedAt, null);
  const retry = await request(`/cargo-loads/${id}/tracking`, driver.userId, "PATCH", body);
  assert.equal(retry.status, 200);
  assert.equal(load.status, "delivered");
  assert.equal(retry.data.currentLat, 40);
  assert.equal(retry.data.history.length, 1);
  assert.equal(cargoNotifications.length, inboxCount + 2);
});

test("failed assignment leaves every offer unchanged and retry commits a single atomic batch", async () => {
  const id = `${loadId}-assignment-failure`;
  const { load, offer } = createFixture(id, "negotiating");
  const competing = { ...offer, id: `${id}-competitor`, driverId: "driver-1" };
  cargoOffers.push(competing);
  const inboxCount = cargoNotifications.length;
  const batchCount = persistedBatches.length;
  failNextSave.add(id);
  const path = `/cargo-loads/${id}/offers/${offer.id}/accept`;
  assert.equal((await request(path, shipperId, "POST")).status, 500);
  assert.equal(load.status, "negotiating");
  assert.equal(offer.status, "pending");
  assert.equal(competing.status, "pending");
  assert.equal(cargoTrackingUpdates.filter(update => update.loadId === id).length, 0);
  assert.equal(cargoNotifications.length, inboxCount);
  assert.equal(persistedBatches.length, batchCount);
  const beforeRetry = await request(`/cargo-loads/${id}/tracking`, shipperId);
  assert.equal(beforeRetry.data.assigned, false);
  assert.equal((await request(path, shipperId, "POST")).status, 200);
  assert.equal(load.status, "accepted");
  assert.equal(offer.status, "accepted");
  assert.equal(competing.status, "rejected");
  assert.equal(persistedBatches.length, batchCount + 1);
  assert.deepEqual(persistedBatches.at(-1)?.map(item => [item.id, item.status]).sort(), [
    [id, "accepted"], [offer.id, "accepted"], [competing.id, "rejected"],
  ].sort());
  assert.equal(cargoNotifications.length, inboxCount + 2);
});

test("parallel milestones wait for the prior commit and readers never see candidate state", async () => {
  const id = `${loadId}-serial`;
  createFixture(id, "accepted");
  let release!: () => void;
  let entered!: () => void;
  const enteredPromise = new Promise<void>(resolve => { entered = resolve; });
  blockedSaves.set(id, {
    entered,
    wait: new Promise<void>(resolve => { release = resolve; }),
  });
  const first = request(`/cargo-loads/${id}/tracking`, driver.userId, "PATCH", { stage: "pickup_ready" });
  await enteredPromise;
  let secondFinished = false;
  const second = request(`/cargo-loads/${id}/tracking`, driver.userId, "PATCH", { stage: "picked_up" })
    .then(result => { secondFinished = true; return result; });
  try {
    const visible = await request(`/cargo-loads/${id}/tracking`, shipperId);
    assert.equal(visible.data.currentStage, "accepted");
    assert.equal(visible.data.history.length, 0);
    await new Promise(resolve => setTimeout(resolve, 25));
    assert.equal(secondFinished, false, "next milestone must not validate against uncommitted state");
  } finally {
    blockedSaves.delete(id);
    release();
  }
  assert.equal((await first).status, 200);
  assert.equal((await second).status, 200);
  const final = await request(`/cargo-loads/${id}/tracking`, shipperId);
  assert.equal(final.data.currentStage, "picked_up");
  assert.deepEqual(final.data.history.map((update: { stage: string }) => update.stage), ["pickup_ready", "picked_up"]);
});

test("parallel assignments cannot accept two drivers or partially publish competing offers", async () => {
  const id = `${loadId}-serial-assignment`;
  const { offer } = createFixture(id, "negotiating");
  const competing = { ...offer, id: `${id}-competitor`, driverId: "driver-1" };
  cargoOffers.push(competing);
  let release!: () => void;
  let entered!: () => void;
  const enteredPromise = new Promise<void>(resolve => { entered = resolve; });
  blockedSaves.set(id, { entered, wait: new Promise<void>(resolve => { release = resolve; }) });
  const first = request(`/cargo-loads/${id}/offers/${offer.id}/accept`, shipperId, "POST");
  await enteredPromise;
  const second = request(`/cargo-loads/${id}/offers/${competing.id}/accept`, shipperId, "POST");
  try {
    assert.equal(offer.status, "pending");
    assert.equal(competing.status, "pending");
    assert.equal((await request(`/cargo-loads/${id}/tracking`, shipperId)).data.assigned, false);
  } finally {
    blockedSaves.delete(id);
    release();
  }
  assert.equal((await first).status, 200);
  assert.equal((await second).status, 409);
  assert.equal(cargoOffers.filter(item => item.loadId === id && item.status === "accepted").length, 1);
  assert.equal(cargoTrackingUpdates.filter(item => item.loadId === id).length, 1);
});
