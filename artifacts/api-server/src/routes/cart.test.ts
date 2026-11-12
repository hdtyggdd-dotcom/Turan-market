import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomUUID } from "node:crypto";
import express from "express";
import type { Server } from "node:http";
import { and, eq, inArray, like } from "drizzle-orm";
import { appRecords, db, pool } from "@workspace/db";
import cartRouter from "./cart.js";
import ordersRouter from "./orders.js";
import { users, listings, orders, generateToken } from "../data/store.js";
import { readCart, listingSnapshot } from "../lib/cart.js";

const prefix = `cart-test-${randomUUID()}`;
const buyer = { ...users[0]!, id: `${prefix}-buyer` };
const other = { ...users[0]!, id: `${prefix}-other` };
const seller = { ...users[1]!, id: `${prefix}-seller` };
const product = { ...listings[0]!, id: `${prefix}-product`, userId: seller.id, status: "active" as const };
const second = { ...product, id: `${prefix}-second` };
const tokens = [generateToken(buyer.id), generateToken(other.id)];
let server: Server;
let base: string;
const orderIds: string[] = [];

async function request(path: string, method = "GET", body?: unknown, account: number | null = 0) {
  const response = await fetch(`${base}${path}`, {
    method, headers: {
      "Content-Type": "application/json",
      ...(account === null ? {} : { Authorization: `Bearer ${tokens[account]}` }),
    }, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, data: await response.json() as any };
}
const id = () => randomUUID();
before(async () => {
  users.push(buyer, other, seller);
  listings.push(product, second);
  await db.insert(appRecords).values([
    ...[buyer, other, seller].map(user => ({ collection: "users", id: user.id, payload: user as unknown as Record<string, unknown> })),
    ...[product, second].map(listing => ({ collection: "listings", id: listing.id, payload: listing as unknown as Record<string, unknown> })),
  ]);
  const app = express();
  app.use(express.json());
  app.use(cartRouter);
  app.use(ordersRouter);
  server = app.listen(0);
  await new Promise<void>(resolve => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
after(async () => {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  await db.delete(appRecords).where(and(eq(appRecords.collection, "carts"), inArray(appRecords.id, [buyer.id, other.id])));
  await db.delete(appRecords).where(and(eq(appRecords.collection, "cart_operations"), like(appRecords.id, `${prefix}%`)));
  if (orderIds.length) await db.delete(appRecords).where(and(eq(appRecords.collection, "orders"), inArray(appRecords.id, orderIds)));
  await db.delete(appRecords).where(and(inArray(appRecords.collection, ["users", "listings"]), inArray(appRecords.id, [buyer.id, other.id, seller.id, product.id, second.id])));
  for (const records of [users, listings]) {
    for (let i = records.length - 1; i >= 0; i--) if (records[i]!.id.startsWith(prefix)) records.splice(i, 1);
  }
  await pool.end();
});

test("durable, account-isolated cart and safe checkout retries", async t => {
  const requestId = id();
  const add = { listingId: product.id, quantity: 2, requestId, operationId: id(), userId: other.id };
  await t.test("auth, bounds, add receipt and fresh second-device reads", async () => {
    assert.equal((await request("/cart", "GET", undefined, null)).status, 401);
    for (const quantity of [0, 1000, 1.5, "2"]) {
      assert.equal((await request("/cart/items", "POST", { ...add, quantity })).status, 400);
    }
    assert.equal((await request("/cart/items", "POST", add)).status, 200);
    assert.equal((await request("/cart/items", "POST", add)).data.items[0].quantity, 2);
    assert.equal((await request("/cart", "GET", undefined, 1)).data.items.length, 0);
    assert.equal((await readCart(buyer.id)).items[0]!.requestId, requestId);
    assert.equal((await request("/cart/items", "POST", { ...add, quantity: 3 })).status, 409);
  });
  await t.test("concurrent device writes cannot overwrite each other", async () => {
    const results = await Promise.all(Array.from({ length: 8 }, () =>
      request("/cart/items", "POST", { ...add, quantity: 1, operationId: id() }),
    ));
    assert(results.every(result => result.status === 200));
    assert.equal((await request("/cart")).data.items[0].quantity, 10);
  });
  await t.test("quantity revisions and deleting another account's item are guarded", async () => {
    const cart = (await request("/cart")).data;
    const change = { quantity: 12, requestId, revision: cart.revision, operationId: id() };
    assert.equal((await request(`/cart/items/${product.id}`, "PATCH", change, 1)).status, 409);
    assert.equal((await request(`/cart/items/${product.id}`, "PATCH", change)).status, 200);
    assert.equal((await request(`/cart/items/${product.id}`, "PATCH", { ...change, operationId: id() })).status, 409);
    assert.equal((await request(`/cart/items/${product.id}`, "DELETE", { requestId, quantity: 10, operationId: id() })).status, 409);
    assert.equal((await readCart(buyer.id)).items[0]!.quantity, 12);
  });
  const localId = id();
  const migration = {
    operationId: id(),
    items: [
      { listing: listingSnapshot(product.id), quantity: 14, requestId: id() },
      { listing: listingSnapshot(second.id), quantity: 3, requestId: localId },
    ],
  };
  await t.test("legacy import merges overlap, preserves original identity and cannot resurrect deleted items", async () => {
    const result = await request("/cart/merge", "POST", migration);
    assert.equal(result.status, 200);
    assert.equal(result.data.items.length, 2);
    assert.equal(result.data.items.find((item: any) => item.listing.id === product.id).quantity, 14);
    assert.equal(result.data.items.find((item: any) => item.listing.id === second.id).requestId, localId);
    assert.equal((await request(`/cart/items/${second.id}`, "DELETE", { requestId: localId, quantity: 3, operationId: id() })).status, 200);
    const retried = await request("/cart/merge", "POST", migration);
    assert.equal(retried.data.items.length, 1);
  });
  await t.test("lost checkout response reuses the server cart identity on a second device", async () => {
    const cart = await readCart(buyer.id);
    const item = cart.items[0]!;
    const orderInput = { listingId: product.id, quantity: item.quantity, clientRequestId: item.requestId };
    // The first client's response can be lost; the persisted request identity remains.
    const original = await request("/orders", "POST", orderInput);
    assert.equal(original.status, 201);
    orderIds.push(original.data.id);
    const reloaded = await readCart(buyer.id);
    assert.equal(reloaded.items[0]!.requestId, item.requestId);
    const retry = await request("/orders", "POST", { ...orderInput, clientRequestId: reloaded.items[0]!.requestId });
    assert.equal(retry.status, 200);
    assert.equal(retry.data.id, original.data.id);
    assert.equal(orders.filter(order => order.id === original.data.id).length, 1);
    assert.equal((await request(`/cart/items/${product.id}`, "PATCH", {
      quantity: 15, requestId: item.requestId, revision: reloaded.revision, operationId: id(),
    })).status, 409);
  });
  await t.test("legacy overlaps with an ordered attempt retain both purchase identities", async () => {
    const legacy = { listing: listingSnapshot(product.id), quantity: 1, requestId: id() };
    const merged = await request("/cart/merge", "POST", { items: [legacy], operationId: id() });
    assert.equal(merged.status, 200);
    assert.deepEqual(new Set(merged.data.items.map((item: any) => item.requestId)), new Set([requestId, legacy.requestId]));
    assert.equal((await request(`/cart/items/${product.id}`, "DELETE", {
      requestId: legacy.requestId, quantity: 1, operationId: id(),
    })).status, 200);
    assert.equal((await readCart(buyer.id)).items[0]!.requestId, requestId);
  });
  await t.test("clear is durable and revision guarded", async () => {
    const cart = await readCart(buyer.id);
    assert.equal((await request("/cart", "DELETE", { revision: cart.revision - 1, operationId: id() })).status, 409);
    assert.equal((await request("/cart", "DELETE", { revision: cart.revision, operationId: id() })).status, 200);
    assert.equal((await readCart(buyer.id)).items.length, 0);
  });
});
