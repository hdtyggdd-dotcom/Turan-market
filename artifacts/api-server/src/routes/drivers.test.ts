import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import express from "express";
import type { Server } from "node:http";
import { createDriversRouter } from "./drivers.js";
import { createCargoRouter } from "./cargo.js";
import { users, driverProfiles, cargoLoads, cargoOffers, generateToken, type StoredDriverProfile } from "../data/store.js";
import { isOperationalDriver } from "../lib/driver-trust.js";

const driverId = "verification-regression-driver";
const ownerId = "verification-regression-owner";
const adminId = "verification-regression-admin";
let server: Server;
let base: string;
let failSave = false;
type WriteBlock = { entered: Promise<void>; signal: () => void; wait: Promise<void>; release: () => void };
let cargoWriteBlock: WriteBlock | null = null;
let driverWriteBlock: WriteBlock | null = null;
const commitOrder: string[] = [];
function blockWrite(): WriteBlock {
  let signal!: () => void, release!: () => void;
  return { entered: new Promise<void>(resolve => { signal = resolve; }), signal: () => signal(),
    wait: new Promise<void>(resolve => { release = resolve; }), release: () => release() };
}
const writes: unknown[] = [];
const files = new Map<string, Buffer>();
let fileCounter = 0;
const savedSnapshot: StoredDriverProfile = structuredClone(driverProfiles[0]!);

async function request(path: string, userId: string, method = "GET", body?: unknown) {
  const response = await fetch(`${base}/api${path}`, {
    method, headers: { Authorization: `Bearer ${generateToken(userId)}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, data: await response.json() as any };
}

before(async () => {
  users.push({ ...users[0]!, id: adminId, role: "admin" });
  users.push({ ...users[0]!, id: ownerId, role: "driver", verificationStatus: "none" });
  driverProfiles.push({
    ...savedSnapshot, id: driverId, userId: ownerId, vehiclePlate: "PENDING", rating: 0, ratingCount: 0,
    capacityKg: 0, capacityM3: 0, sharedLoadAvailableKg: 0, sharedLoadAvailableM3: 0,
    reviewStatus: "none", documents: [], ratingHistory: [],
  });
  const app = express();
  app.use(express.json({ limit: "8mb" }));
  app.use("/api", createDriversRouter(async changes => {
    if (failSave) { failSave = false; throw new Error("Injected database failure"); }
    if (driverWriteBlock) { driverWriteBlock.signal(); await driverWriteBlock.wait; }
    commitOrder.push("driver");
    writes.push(structuredClone(changes));
  }, {
    async save(bytes) { const path = `private-test-${++fileCounter}`; files.set(path, bytes); return path; },
    async remove(path) { files.delete(path); },
    async readUrl(path) { assert(files.has(path)); return "https://example.test/private-read"; },
  }));
  app.use("/api", createCargoRouter(async () => {
    if (cargoWriteBlock) { cargoWriteBlock.signal(); await cargoWriteBlock.wait; }
    commitOrder.push("cargo");
  }));
  app.use((_error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({ error: "save_failed" });
  });
  server = app.listen(0);
  await new Promise<void>(resolve => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  users.splice(users.findIndex(user => user.id === adminId), 1);
  users.splice(users.findIndex(user => user.id === ownerId), 1);
  driverProfiles.splice(driverProfiles.findIndex(profile => profile.id === driverId), 1);
  for (const id of ["verification-trip", "verification-open", "verification-race-accept", "verification-race-reject", "verification-race-document"]) {
    const index = cargoLoads.findIndex(load => load.id === id); if (index >= 0) cargoLoads.splice(index, 1);
  }
  const index = cargoOffers.findIndex(offer => offer.id === "verification-offer"); if (index >= 0) cargoOffers.splice(index, 1);
  for (let index = cargoOffers.length - 1; index >= 0; index--) {
    if (cargoOffers[index]!.id.startsWith("verification-race-")) cargoOffers.splice(index, 1);
  }
});

test("driver verification is private, revision-safe, persistent and authoritative for cargo access", async () => {
  const profile = driverProfiles.find(item => item.id === driverId)!;
  assert.equal(isOperationalDriver(savedSnapshot), false, "legacy badges alone must not confer trust");
  assert.equal((await request("/drivers/me/verification", "u1")).status, 403);
  assert.equal((await request("/admin/drivers", ownerId)).status, 403);
  const input = {
    revision: 0, vehicleTypeId: "gazelle", vehiclePlate: "01 test 123", capacityKg: 1000, capacityM3: 8,
    sharedLoadAvailableKg: 500, sharedLoadAvailableM3: 4, availableFrom: "2026-10-06T09:00:00.000Z", currentRegionId: "r1", bio: "Test driver",
  };
  assert.equal((await request("/drivers/me/verification", ownerId, "PUT", { ...input, capacityKg: 4000 })).status, 400);
  failSave = true;
  assert.equal((await request("/drivers/me/verification", ownerId, "PUT", input)).status, 500);
  assert.equal(profile.vehiclePlate, "PENDING");
  assert.equal((await request("/drivers/me/verification", ownerId, "PUT", input)).status, 200);
  assert.equal(profile.reviewStatus, "pending");
  assert.equal(users.find(user => user.id === ownerId)?.verificationStatus, "pending");
  assert.equal((await request("/drivers/me/verification", ownerId, "PUT", input)).status, 409);
  assert.equal((await request(`/admin/drivers/${driverId}/verification`, adminId, "PATCH", {
    status: "approved", revision: profile.revision, reason: "", documents: [],
  })).status, 400);
  const data = Buffer.from([255, 216, 255, 224, 0, 0, 255, 217]).toString("base64");
  assert.equal((await request("/drivers/me/documents", ownerId, "POST", { kind: "identity", data: "not-a-picture", mimeType: "image/jpeg" })).status, 400);
  failSave = true;
  assert.equal((await request("/drivers/me/documents", ownerId, "POST", { kind: "identity", data, mimeType: "image/jpeg" })).status, 500);
  assert.equal(files.size, 0, "failed metadata commit must delete unattached bytes");
  for (const kind of ["identity", "license", "registration"]) {
    const upload = await request("/drivers/me/documents", ownerId, "POST", { kind, data, mimeType: "image/jpeg" });
    assert.equal(upload.status, 201);
    assert(!JSON.stringify(upload.data).includes("objectPath"));
  }
  const docId = profile.documents![0]!.id;
  assert.equal((await request(`/drivers/${driverId}/documents/${docId}`, "u1")).status, 403);
  assert.equal((await request(`/drivers/${driverId}/documents/${docId}`, ownerId)).status, 200);
  assert.equal((await request(`/drivers/${driverId}/documents/${docId}`, adminId)).status, 200);
  assert.equal((await request(`/admin/drivers/${driverId}/verification`, ownerId, "PATCH", {
    status: "approved", revision: profile.revision, reason: "", documents: [],
  })).status, 403);
  const approval = { status: "approved", revision: profile.revision, reason: "Checked originals", documents: profile.documents!.map(doc => ({ id: doc.id, status: "approved" })) };
  assert.equal((await request(`/admin/drivers/${driverId}/verification`, adminId, "PATCH", approval)).status, 200);
  assert(isOperationalDriver(profile));
  assert.equal((await request(`/admin/drivers/${driverId}/verification`, adminId, "PATCH", approval)).status, 409);
  const publicProfile = (await request(`/drivers/${driverId}`, "u1")).data;
  assert.equal(publicProfile.operational, true);
  assert.equal(publicProfile.capacityKg, 1000);
  assert.equal(publicProfile.verifiedDocuments.length, 3);
  assert(!JSON.stringify(publicProfile).includes("private-test"));
  assert(!("documents" in publicProfile));
  assert(!("reviewHistory" in publicProfile));
  assert(!("reviewReason" in publicProfile));
  assert.equal(publicProfile.user.regionId, null);
  const queue = await request("/admin/drivers", adminId);
  assert.equal(queue.status, 200);
  assert(queue.data.some((item: { id: string }) => item.id === driverId));
  cargoLoads.push({
    ...cargoLoads[0]!, id: "verification-open", shipperId: "u1", cargoType: "general", status: "open",
    weightKg: 1100, volumeM3: 3, sharedLoadAllowed: false, pickupDate: "2099-10-06",
  });
  assert.equal((await request("/cargo-loads/verification-open/offers", ownerId, "POST", { amountUzs: 1000 })).status, 422, "use actual approved vehicle capacity, not type maximum");
  const oldRevision = profile.revision;
  await request("/drivers/me/documents", ownerId, "POST", { kind: "identity", data, mimeType: "image/jpeg" });
  assert.equal(profile.reviewStatus, "pending");
  assert.equal(files.size, 3, "replaced bytes cleaned up");
  assert(!isOperationalDriver(profile));
  assert.equal((await request(`/drivers/${driverId}/documents/${docId}`, adminId)).status, 404);
  assert.equal((await request(`/admin/drivers/${driverId}/verification`, adminId, "PATCH", { ...approval, revision: oldRevision })).status, 409);
  assert.equal((await request("/cargo-loads/verification-open/offers", ownerId, "POST", { amountUzs: 1000 })).status, 403);
  assert.equal((await request(`/admin/drivers/${driverId}/verification`, adminId, "PATCH", {
    status: "rejected", revision: profile.revision, reason: "", documents: [],
  })).status, 400);
  assert.equal((await request(`/admin/drivers/${driverId}/verification`, adminId, "PATCH", {
    status: "rejected", revision: profile.revision, reason: "Unreadable identity", documents: [{ id: profile.documents!.find(doc => doc.kind === "identity")!.id, status: "rejected" }],
  })).status, 200);
  assert.equal(profile.reviewReason, "Unreadable identity");
  assert.equal(profile.reviewHistory!.length, 2);
  assert(writes.length > 0);
});

test("trip rating history accepts only a single delivered-trip owner review", async () => {
  const profile = driverProfiles.find(item => item.id === driverId)!;
  cargoLoads.push({ ...cargoLoads[0]!, id: "verification-trip", shipperId: "u1", status: "in_transit" });
  cargoOffers.push({
    id: "verification-offer", loadId: "verification-trip", driverId, status: "accepted", amountUzs: 1000,
    message: null, counterAmountUzs: null, counterMessage: null, createdAt: "", updatedAt: "",
  });
  assert.equal((await request("/cargo-loads/verification-trip/driver-rating", "u2", "POST", { score: 5 })).status, 403);
  assert.equal((await request("/cargo-loads/verification-trip/driver-rating", "u1", "POST", { score: 5 })).status, 409);
  cargoLoads.find(load => load.id === "verification-trip")!.status = "delivered";
  assert.equal((await request("/cargo-loads/verification-trip/driver-rating", "u1", "POST", { score: 4.5 })).status, 400);
  failSave = true;
  assert.equal((await request("/cargo-loads/verification-trip/driver-rating", "u1", "POST", { score: 5 })).status, 500);
  assert.equal(profile.ratingCount, 0);
  const results = await Promise.all([
    request("/cargo-loads/verification-trip/driver-rating", "u1", "POST", { score: 5, comment: "Delivered safely" }),
    request("/cargo-loads/verification-trip/driver-rating", "u1", "POST", { score: 4 }),
  ]);
  assert.deepEqual(results.map(item => item.status).sort(), [201, 409]);
  assert.equal(profile.ratingCount, 1);
  assert.equal(profile.rating, 5);
  const publicProfile = (await request(`/drivers/${driverId}`, "u1")).data;
  assert.equal(publicProfile.ratingHistory.length, 1);
  assert.equal(publicProfile.ratingHistory[0].comment, "Delivered safely");
});

async function approveAndCreateRaceLoad(id: string) {
  const profile = driverProfiles.find(item => item.id === driverId)!;
  assert.equal((await request(`/admin/drivers/${driverId}/verification`, adminId, "PATCH", {
    revision: profile.revision, status: "approved", reason: "Checked",
    documents: profile.documents!.map(doc => ({ id: doc.id, status: "approved" })),
  })).status, 200);
  cargoLoads.push({
    ...cargoLoads[0]!, id, shipperId: "u1", cargoType: "general", status: "open",
    weightKg: 100, volumeM3: 1, sharedLoadAllowed: false, pickupDate: "2099-10-06",
  });
  const offer = {
    id: `${id}-offer`, loadId: id, driverId, status: "pending" as const, amountUzs: 1000,
    message: null, counterAmountUzs: null, counterMessage: null, createdAt: "", updatedAt: "",
  };
  cargoOffers.push(offer);
  commitOrder.length = 0;
  return { profile, offer, load: cargoLoads.find(load => load.id === id)! };
}

test("moderator rejection waits for an earlier acceptance to commit and publish", async () => {
  const { profile, offer, load } = await approveAndCreateRaceLoad("verification-race-accept");
  const block = blockWrite();
  cargoWriteBlock = block;
  const accepting = request(`/cargo-loads/${load.id}/offers/${offer.id}/accept`, "u1", "POST");
  await block.entered;
  let rejected = false;
  const rejection = request(`/admin/drivers/${driverId}/verification`, adminId, "PATCH", {
    revision: profile.revision, status: "rejected", reason: "Revoked", documents: [],
  }).then(result => { rejected = true; return result; });
  try {
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(rejected, false, "revocation must not commit while acceptance holds the eligibility boundary");
    assert.equal(profile.reviewStatus, "approved");
    assert.equal(load.status, "open", "candidate assignment must remain invisible before commit");
  } finally { cargoWriteBlock = null; block.release(); }
  assert.equal((await accepting).status, 200);
  assert.equal((await rejection).status, 200);
  assert.deepEqual(commitOrder, ["cargo", "driver"]);
  assert.equal(load.status, "accepted");
  assert.equal(isOperationalDriver(profile), false);
});

test("an earlier revocation blocks a queued acceptance before eligibility is evaluated", async () => {
  const { profile, offer, load } = await approveAndCreateRaceLoad("verification-race-reject");
  const block = blockWrite();
  driverWriteBlock = block;
  const rejecting = request(`/admin/drivers/${driverId}/verification`, adminId, "PATCH", {
    revision: profile.revision, status: "rejected", reason: "Revoked", documents: [],
  });
  await block.entered;
  const accepting = request(`/cargo-loads/${load.id}/offers/${offer.id}/accept`, "u1", "POST");
  try {
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(load.status, "open");
  } finally { driverWriteBlock = null; block.release(); }
  assert.equal((await rejecting).status, 200);
  assert.equal((await accepting).status, 409);
  assert.deepEqual(commitOrder, ["driver"]);
  assert.equal(load.status, "open");
  assert.equal(offer.status, "pending");
});

test("document replacement ahead of acceptance removes operational eligibility atomically", async () => {
  const { profile, offer, load } = await approveAndCreateRaceLoad("verification-race-document");
  const block = blockWrite();
  driverWriteBlock = block;
  const replacing = request("/drivers/me/documents", ownerId, "POST", {
    kind: "identity", mimeType: "image/jpeg", data: Buffer.from([255, 216, 255, 224, 0, 0, 255, 217]).toString("base64"),
  });
  await block.entered;
  const accepting = request(`/cargo-loads/${load.id}/offers/${offer.id}/accept`, "u1", "POST");
  try {
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(load.status, "open");
    assert.equal(profile.reviewStatus, "approved", "document changes publish only after durable commit");
  } finally { driverWriteBlock = null; block.release(); }
  assert.equal((await replacing).status, 201);
  assert.equal((await accepting).status, 409);
  assert.deepEqual(commitOrder, ["driver"]);
  assert.equal(profile.reviewStatus, "pending");
  assert.equal(load.status, "open");
});
