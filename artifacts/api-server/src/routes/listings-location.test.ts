import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import type { Server } from "node:http";
import express from "express";
import { createListingsRouter } from "./listings.js";
import { listings, users, generateToken } from "../data/store.js";

let server: Server;
let base: string;
let writes = 0;
const createdIds = new Set<string>();
const actor = users[0];
const originalProfile = { regionId: actor.regionId, districtId: actor.districtId };
before(async () => {
  const app = express().use(express.json()).use(createListingsRouter({
    persistItem: async () => { writes++; },
  }));
  server = await new Promise<Server>(resolve => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const address = server.address();
  assert(address && typeof address === "object");
  base = `http://127.0.0.1:${address.port}`;
});
after(async () => {
  for (let i = listings.length - 1; i >= 0; i--) if (createdIds.has(listings[i].id)) listings.splice(i, 1);
  await new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
});
async function submit(data: Record<string, unknown>, id?: string) {
  const response = await fetch(base + "/listings" + (id ? "/" + id : ""), {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${generateToken(actor.id)}` },
    body: JSON.stringify(data),
  });
  const result = await response.json() as { id: string; regionId: string; districtId: string; title: string; listingType: string; error: string };
  if (!id && response.status === 201) createdIds.add(result.id);
  return { status: response.status, result };
}
const product = { title: "Location coverage fixture", price: 100, images: [], categoryId: "cat1" };

test("posting asks for explicit region and district; never substitutes profile or GPS guesses", async () => {
  const count = listings.length;
  for (const input of [
    {}, { regionId: "r1" }, { districtId: "d1" },
    { regionId: "r2", districtId: "d1" },
    { regionId: "r1", districtId: "r1" },
    { regionId: "missing", districtId: "d1" },
    { regionId: "r10", districtId: "d192" },
    { regionId: "r1", districtId: "d1", neighborhoodId: "missing" },
  ]) {
    const response = await submit({ ...product, ...input });
    assert.equal(response.status, 400);
    assert.equal(response.result.error, "invalid_location");
  }
  assert.equal(writes, 0);
  assert.equal(listings.length, count);
});

test("both goods and service ads save the explicitly selected area without changing the account", async () => {
  for (const listingType of ["savdo", "xizmat"]) {
    const response = await submit({ ...product, listingType, regionId: "r1", districtId: "uz_1726292" });
    assert.equal(response.status, 201);
    assert.equal(response.result.regionId, "r1");
    assert.equal(response.result.districtId, "uz_1726292");
    assert.equal(response.result.listingType, listingType);
    const listing = listings.find(item => item.id === response.result.id);
    assert.equal(listing?.districtId, "uz_1726292");
  }
  assert.deepEqual({ regionId: actor.regionId, districtId: actor.districtId }, originalProfile);
});

test("invalid editing preserves an existing listing; unrelated edits need not rewrite its location", async () => {
  const created = await submit({ ...product, regionId: "r1", districtId: "d1", lat: 41.3, lng: 69.2 });
  const id = created.result.id;
  const before = JSON.stringify(listings.find(item => item.id === id));
  const rejected = await submit({ regionId: "r2" }, id);
  assert.equal(rejected.status, 400);
  assert.equal(JSON.stringify(listings.find(item => item.id === id)), before);
  const title = await submit({ title: "Edited fixture" }, id);
  assert.equal(title.status, 200);
  assert.equal(title.result.districtId, "d1");
  const moved = await submit({ regionId: "r5", districtId: "uz_davlatobod" }, id);
  assert.equal(moved.status, 200);
  assert.equal(moved.result.regionId, "r5");
  assert.equal(moved.result.districtId, "uz_davlatobod");
  const listing = listings.find(item => item.id === id);
  assert.equal(listing?.lat, null);
  assert.equal(listing?.lng, null);
});
