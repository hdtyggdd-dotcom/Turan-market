import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import express from "express";
import type { Server } from "node:http";
import { createAuthRouter } from "./auth.js";
import { driverProfiles, users, verifyToken } from "../data/store.js";

let server: Server;
let base: string;
const phone = "+998000111222";
const saved: Array<{ collection: string; id: string }> = [];
const createdIds = new Set<string>();

async function request(path: string, body: unknown) {
  const response = await fetch(`${base}/api${path}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  return { status: response.status, data: await response.json() as any };
}

before(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api", createAuthRouter(async (collection, item) => {
    saved.push({ collection, id: item.id });
    createdIds.add(item.id);
  }, async () => {}));
  server = app.listen(0);
  await new Promise<void>(resolve => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
after(async () => {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  for (const records of [users, driverProfiles]) {
    for (let index = records.length - 1; index >= 0; index--) {
      if (createdIds.has(records[index]!.id)) records.splice(index, 1);
    }
  }
});

test("new driver registration returns its own credentials and an unverified durable vehicle profile", async () => {
  const result = await request("/auth/register", {
    phone, password: "auth-regression-only", name: "Registration regression",
    role: "driver", regionId: "r1", districtId: "d1",
  });
  assert.equal(result.status, 201);
  assert.equal(verifyToken(result.data.token), result.data.user.id);
  assert.equal(result.data.user.role, "driver");
  assert(!("password" in result.data.user));
  const profile = driverProfiles.find(item => item.userId === result.data.user.id)!;
  assert.equal(profile.reviewStatus, "none");
  assert.equal(profile.vehiclePlate, "PENDING");
  assert.deepEqual(profile.documents, []);
  assert(saved.some(item => item.collection === "users" && item.id === result.data.user.id));
  assert(saved.some(item => item.collection === "driver_profiles" && item.id === profile.id));
});

test("phone-based login and the unified existing-account form preserve driver identity and role", async () => {
  const user = users.find(item => item.phone === phone)!;
  const count = users.length;
  const profileCount = driverProfiles.length;
  const login = await request("/auth/login", { phone, password: "auth-regression-only" });
  assert.equal(login.status, 200);
  assert.equal(verifyToken(login.data.token), user.id);
  const unified = await request("/auth/register", {
    phone, password: "auth-regression-only", name: "Must not rename", role: "buyer", signInExisting: true,
  });
  assert.equal(unified.status, 200);
  assert.equal(verifyToken(unified.data.token), user.id);
  assert.equal(unified.data.user.role, "driver");
  assert.equal(unified.data.user.name, "Registration regression");
  assert.equal(users.length, count);
  assert.equal(driverProfiles.length, profileCount);
  assert.equal((await request("/auth/login", { phone, password: "incorrect" })).status, 401);
  assert.equal((await request("/auth/register", { phone, password: "incorrect", name: "Test", role: "driver", signInExisting: true })).status, 401);
  assert.equal((await request("/auth/register", { phone: "+998000111223", password: "test-only", name: "Test", role: "admin" })).status, 400);
});
