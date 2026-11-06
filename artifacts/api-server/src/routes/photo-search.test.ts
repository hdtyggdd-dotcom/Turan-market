import assert from "node:assert/strict";
import { before, after, mock, test } from "node:test";
import { randomUUID } from "node:crypto";
import express from "express";
import type { Server } from "node:http";
import { and, eq } from "drizzle-orm";
import { appRecords, db, pool } from "@workspace/db";
import { categories, listings, users, generateToken } from "../data/store.js";
import { adviceProvider } from "../lib/advice-provider.js";
import { adviceBudget, AdviceLimitError } from "../lib/advice-budget.js";
import { PHOTO_REQUESTS, recognizePhoto, validPhoto } from "../lib/photo-search.js";
import photoRouter from "./photo-search.js";
import cargoRouter from "./cargo.js";

const prefix = `photo-test-${randomUUID()}`;
const category = { ...categories[0]!, id: `${prefix}-category`, subcategories: [] };
const buyer = { ...users[0]!, id: `${prefix}-buyer`, role: "buyer" as const };
const sellers = [0, 1].map(i => ({ ...users[0]!, id: `${prefix}-seller-${i}`, role: i === 0 ? "seller" as const : "buyer" as const }));
const irrelevant = { ...users[0]!, id: `${prefix}-irrelevant`, role: "seller" as const };
const product = { ...listings[0]!, id: `${prefix}-product`, title: "Maxsus telefon", titleRu: "", description: "",
  userId: sellers[0]!.id, categoryId: category.id, listingType: "savdo" as const, adminStatus: null, status: "active" as "active" | "sold" | "paused" };
const other = { ...product, id: `${prefix}-other`, title: "Boshqa qurilma", userId: sellers[1]!.id };
const image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jqL8AAAAASUVORK5CYII=";
let server: Server;
let base: string;
let calls = 0;
let reservations = 0;
let providerFails = false;
let budgetFails = false;
let confidence = 0.96;
const requests: string[] = [];
const notificationIds = new Set<string>();

async function search(key = randomUUID(), userId: string | null = buyer.id, overrides = {}) {
  if (userId) requests.push(`${userId}:${key}`);
  const response = await fetch(`${base}/ai/photo-search`, { method: "POST",
    headers: { "Content-Type": "application/json", ...(userId ? { Authorization: `Bearer ${generateToken(userId)}` } : {}) },
    body: JSON.stringify({ data: image, mimeType: "image/png", requestId: key, ...overrides }) });
  return { status: response.status, data: await response.json() as any };
}
async function notifications(userId: string) {
  const response = await fetch(`${base}/notifications`, { headers: { Authorization: `Bearer ${generateToken(userId)}` } });
  assert.equal(response.status, 200);
  const items = await response.json() as any[];
  items.filter(item => item.id.startsWith("demand-")).forEach(item => notificationIds.add(item.id));
  return items;
}
before(async () => {
  categories.push(category);
  users.push(buyer, ...sellers, irrelevant);
  listings.push(product, other);
  mock.method(adviceBudget, "reserve", async () => {
    if (budgetFails) throw new AdviceLimitError("ai_account_daily_limit", "Limit tugadi", 30);
    reservations++;
  });
  mock.method(adviceProvider, "identifyProduct", async (_data: string, _mime: string, categoryList: string) => {
    assert(categoryList.includes(category.id));
    calls++;
    await new Promise(resolve => setTimeout(resolve, 25));
    if (providerFails) throw new Error("Provider timeout");
    return JSON.stringify({ productName: "Maxsus telefon", categoryId: confidence < 0.8 ? null : category.id,
      confidence, keywords: confidence < 0.8 ? [] : ["maxsus telefon"] });
  });
  const app = express();
  app.use(express.json({ limit: "4mb" }));
  app.use((req, _res, next) => { req.log = { warn() {} } as any; next(); });
  app.use(photoRouter);
  app.use(cargoRouter);
  server = app.listen(0);
  await new Promise<void>(resolve => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
after(async () => {
  mock.restoreAll();
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  for (const id of requests) await db.delete(appRecords).where(and(eq(appRecords.collection, PHOTO_REQUESTS), eq(appRecords.id, id)));
  for (const id of notificationIds) await db.delete(appRecords).where(and(eq(appRecords.collection, "product_demand_notifications"), eq(appRecords.id, id)));
  categories.splice(categories.indexOf(category), 1);
  for (const user of [buyer, ...sellers, irrelevant]) users.splice(users.indexOf(user), 1);
  for (const item of [product, other]) listings.splice(listings.indexOf(item), 1);
  await pool.end();
});

test("photographed product search is authenticated, bounded, durable and category-private", async t => {
  await t.test("invalid images and signed-out requests cause no paid call", async () => {
    assert.equal((await search(randomUUID(), null)).status, 401);
    for (const invalid of [{ data: "bad" }, { mimeType: "image/jpeg" }, { requestId: "x" },
      { data: "a".repeat(2_800_004) }, { data: image, unexpected: true }]) {
      assert.equal((await search(randomUUID(), buyer.id, invalid)).status, 400);
    }
    assert.equal(calls, 0);
    assert.equal(reservations, 0);
    assert.equal(validPhoto(image, "image/png"), true);
    assert.equal(recognizePhoto(JSON.stringify({ confidence: 0.2, categoryId: null, keywords: [] })), null);
  });
  await t.test("active catalogue match returns real listing and never alerts sellers", async () => {
    const key = randomUUID();
    const result = await search(key);
    assert.equal(result.status, 200);
    assert.deepEqual(result.data.listingIds, [product.id]);
    assert.equal(result.data.notificationStatus, "not_needed");
    assert.equal((await search(key)).data.productName, "Maxsus telefon");
    assert.equal(calls, 1);
    assert.equal(reservations, 1);
    const anotherImage = Buffer.concat([Buffer.from(image, "base64"), Buffer.from([0])]).toString("base64");
    assert.equal((await search(key, buyer.id, { data: anotherImage })).status, 409);
    assert.equal((await notifications(sellers[0]!.id)).length, 0);
  });
  await t.test("no active match alerts all distinct category sellers and persists their inbox", async () => {
    product.status = "sold";
    const result = await search();
    assert.equal(result.status, 200);
    assert.deepEqual(result.data.listingIds, []);
    assert.equal(result.data.unavailableCount, 1);
    assert.equal(result.data.notificationStatus, "sent");
    assert.equal(result.data.notifiedSellerCount, 2);
    for (const seller of sellers) {
      const [notification] = await notifications(seller.id);
      assert.equal(notification.loadId, null);
      assert.match(notification.message, /Maxsus telefon/);
      assert.equal(notification.userId, undefined);
      assert(!notification.message.includes(buyer.id));
      const [row] = await db.select().from(appRecords).where(and(eq(appRecords.collection, "product_demand_notifications"), eq(appRecords.id, notification.id)));
      assert.equal(row!.payload.userId, seller.id);
    }
    assert.equal((await notifications(irrelevant.id)).length, 0);
    assert.equal((await notifications(buyer.id)).length, 0);
  });
  await t.test("read state is durable and another account cannot read that alert", async () => {
    const [notification] = await notifications(sellers[0]!.id);
    for (const [user, status] of [[buyer, 404], [sellers[0]!, 200]] as const) {
      const response = await fetch(`${base}/notifications/${notification.id}/read`, { method: "POST", headers: { Authorization: `Bearer ${generateToken(user.id)}` } });
      assert.equal(response.status, status);
    }
    assert.equal((await notifications(sellers[0]!.id))[0]!.read, true);
  });
  await t.test("retry and simultaneous searches do not duplicate alerts or bill same request twice", async () => {
    const key = randomUUID();
    const previous = calls;
    const results = await Promise.all([search(key), search(key)]);
    assert(results.some(result => result.status === 200));
    assert(results.every(result => result.status === 200 || result.status === 503));
    const receipt = await search(key);
    assert.equal(receipt.status, 200);
    assert.equal(receipt.data.notificationStatus, "already_sent");
    assert.equal(calls, previous + 1);
    assert.equal((await notifications(sellers[0]!.id)).length, 1);
    assert.equal((await notifications(sellers[1]!.id)).length, 1);
  });
  await t.test("uncertain recognition, provider failure and quota failures do not trigger demand", async () => {
    confidence = 0.1;
    const unknown = await search();
    assert.equal(unknown.status, 200);
    assert.equal(unknown.data.recognized, false);
    assert.equal(unknown.data.notificationStatus, "unrecognized");
    confidence = 0.96;
    providerFails = true;
    const key = randomUUID();
    const previous = calls;
    assert.equal((await search(key)).status, 503);
    assert.equal((await search(key)).data.error, "photo_failed");
    assert.equal(calls, previous + 1);
    providerFails = false;
    budgetFails = true;
    const beforeQuota = calls;
    const blockedKey = randomUUID();
    assert.equal((await search(blockedKey)).status, 429);
    assert.equal(calls, beforeQuota);
    const deniedReceipts = await db.select().from(appRecords).where(and(eq(appRecords.collection, PHOTO_REQUESTS), eq(appRecords.id, `${buyer.id}:${blockedKey}`)));
    assert.equal(deniedReceipts.length, 0);
    budgetFails = false;
    assert.equal((await search(blockedKey)).status, 200);
    assert.equal((await notifications(sellers[0]!.id)).length, 1);
  });
});
