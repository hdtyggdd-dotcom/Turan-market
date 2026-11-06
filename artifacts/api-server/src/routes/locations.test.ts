import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import express from "express";
import type { Server } from "node:http";
import locationsRouter from "./locations.js";
import deliveryRouter from "./delivery.js";
import { districts, regions, users, listings, cargoLoads } from "../data/store.js";
import { canonicalDistrictId, completeUzbekistanLocations } from "../data/uzbekistan-districts.js";

let server: Server;
let base: string;
const regionCounts: Record<string, number> = {
  r1: 12, r2: 22, r3: 16, r4: 19, r5: 14, r6: 16, r7: 13,
  r8: 11, r9: 16, r10: 15, r11: 13, r12: 11, r13: 13, r14: 17,
};
before(async () => {
  const app = express().use(express.json()).use(locationsRouter).use(deliveryRouter);
  server = await new Promise<Server>(resolve => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const address = server.address();
  assert(address && typeof address === "object");
  base = `http://127.0.0.1:${address.port}`;
});
after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));

test("all 14 Uzbek regions and 208 distinct district/city choices reach the API", async () => {
  const uz = await (await fetch(`${base}/locations/regions?countryId=uz`)).json() as Array<{ id: string; name: string }>;
  assert.equal(uz.length, 14);
  let total = 0;
  for (const region of uz) {
    const response = await fetch(`${base}/locations/districts?regionId=${region.id}`);
    const choices = await response.json() as Array<{ id: string; name: string; regionId: string }>;
    assert.equal(choices.length, regionCounts[region.id], region.name);
    assert.equal(new Set(choices.map((item: { name: string }) => item.name)).size, choices.length);
    assert(choices.every((item: { regionId: string }) => item.regionId === region.id));
    total += choices.length;
  }
  assert.equal(total, 208);
  const selected = districts.filter(d => /^r\d+$/.test(d.regionId) && d.selectable !== false);
  assert.equal(selected.filter(d => d.name.endsWith("tumani")).length, 177);
  assert.equal(selected.filter(d => d.name.endsWith("shahri")).length, 31);
  assert.equal(new Set(districts.map(d => d.id)).size, districts.length);
});

test("all 173 historical IDs remain resolvable; no existing record is rewritten", () => {
  for (const number of [...Array.from({ length: 41 }, (_, i) => i + 1),
    ...Array.from({ length: 132 }, (_, i) => i + 101)]) {
    assert(districts.some(d => d.id === `d${number}`), `historical d${number}`);
  }
  const recordsBefore = JSON.stringify({ users, listings, cargoLoads });
  const foreignBefore = JSON.stringify(districts.filter(d => !/^r\d+$/.test(d.regionId)));
  completeUzbekistanLocations(regions, districts);
  assert.equal(JSON.stringify({ users, listings, cargoLoads }), recordsBefore);
  assert.equal(JSON.stringify(districts.filter(d => !/^r\d+$/.test(d.regionId))), foreignBefore);
  assert.equal(canonicalDistrictId("d204"), "d207");
  assert.equal(canonicalDistrictId("d192"), "d192", "unknown legacy location must not become Sho'rchi");
  assert.equal(districts.find(d => d.id === "d204")?.name, "Oqoltin tumani");
  assert.equal(districts.find(d => d.id === "d117")?.name, "Bo'ston tumani");
  assert.equal(districts.find(d => d.id === "d192")?.selectable, false);
});

test("homonymous cities and districts are separate selectable entities", () => {
  for (const [regionId, name] of [["r2", "Bekobod"], ["r2", "Yangiyo'l"], ["r2", "Ohangaron"],
    ["r6", "Kattaqo'rg'on"], ["r7", "Kogon"], ["r9", "Shahrisabz"], ["r13", "Xiva"], ["r14", "Nukus"]]) {
    const city = districts.find(d => d.regionId === regionId && d.name === `${name} shahri`);
    const district = districts.find(d => d.regionId === regionId && d.name === `${name} tumani`);
    assert(city && district, `${name}: missing separate city or district`);
    assert.notEqual(city.id, district.id);
  }
});

test("missing reference coordinates never become an invented delivery price", async () => {
  const body = { fromDistrictId: "uz_1726292", toDistrictId: "d1", cargoType: "standard" };
  const unknown = await fetch(`${base}/delivery/estimate`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  assert.equal(unknown.status, 422);
  assert.equal((await unknown.json() as { error: string }).error, "coordinates_required");
  const exact = await fetch(`${base}/delivery/estimate`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, fromLat: 41.21, fromLng: 69.21 }),
  });
  assert.equal(exact.status, 200);
  const quote = await exact.json() as { distanceKm: number; options: Array<{ price: number }> };
  assert(Number.isFinite(quote.distanceKm));
  assert(quote.options.every((option: { price: number }) => Number.isFinite(option.price)));
});
