import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { and, eq, inArray, sql } from "drizzle-orm";
import { appRecords, db, pool } from "@workspace/db";
import { users, listings, generateToken } from "../data/store.js";
import { orderRequestId } from "../lib/orders.js";
import { changeCart, CartError, listingSnapshot } from "../lib/cart.js";

test("independent HTTP workers preserve the first committed purchase", async t => {
  const prefix = `order-test-${randomUUID()}`;
  const buyer = { ...users[0]!, id: `${prefix}-buyer` };
  const other = { ...buyer, id: `${prefix}-other` };
  const seller = { ...users[1]!, id: `${prefix}-seller` };
  const product = { ...listings[0]!, id: `${prefix}-product`, userId: seller.id, price: 1000, status: "active" as const };
  const actors = [buyer, other, seller];
  users.push(...actors);
  listings.push(product);
  const children: ChildProcess[] = [];
  const start = () => new Promise<string>((resolve, reject) => {
    const child = spawn("pnpm", ["--filter", "@workspace/scripts", "exec", "tsx", "../artifacts/api-server/src/routes/orders.test-worker.ts", prefix], { stdio: ["ignore", "pipe", "pipe"] });
    children.push(child);
    const timer = setTimeout(() => reject(new Error("HTTP worker startup timeout")), 20000);
    let output = "";
    child.stdout!.on("data", data => {
      output += String(data);
      const match = output.match(/\{"port":(\d+)\}/);
      if (match) { clearTimeout(timer); resolve(`http://127.0.0.1:${match[1]}`); }
    });
    child.on("error", error => { clearTimeout(timer); reject(error); });
    child.on("exit", code => { clearTimeout(timer); if (code !== 0) reject(new Error(`HTTP worker exited ${code}`)); });
  });
  try {
    await db.insert(appRecords).values([
      ...actors.map(actor => ({ collection: "users", id: actor.id, payload: actor as unknown as Record<string, unknown> })),
      { collection: "listings", id: product.id, payload: product as unknown as Record<string, unknown> },
    ]);
    const bases = await Promise.all([start(), start()]);
    const request = async (worker: number, path: string, method = "GET", body?: unknown, actor = buyer) => {
      const response = await fetch(`${bases[worker]}${path}`, {
        method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${generateToken(actor.id)}` },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      return { status: response.status, data: await response.json() as any };
    };
    const input = { listingId: product.id, quantity: 3, clientRequestId: randomUUID(), notes: "Test note", deliveryPrice: 0 };
    let original: any;
    await t.test("simultaneous identical retries create one row and share its original price/date", async () => {
      const responses = await Promise.all(Array.from({ length: 12 }, (_, i) => request(i % 2, "/orders", "POST", input)));
      assert.equal(responses.filter(r => r.status === 201).length, 1);
      assert.equal(responses.filter(r => r.status === 200).length, 11);
      original = responses[0]!.data;
      assert(responses.every(r => r.data.id === original.id && r.data.createdAt === original.createdAt && r.data.totalPrice === 3000 && r.data.quantity === 3));
      const rows = await db.select().from(appRecords).where(and(eq(appRecords.collection, "orders"), eq(appRecords.id, original.id)));
      assert.equal(rows.length, 1);
    });
    await t.test("conflicting quantity, listing, delivery and notes cannot overwrite a purchase", async () => {
      for (const change of [{ quantity: 7 }, { listingId: "missing" }, { deliveryPrice: 2 }, { deliveryOption: "different" }, { notes: "different" }]) {
        assert.equal((await request(1, "/orders", "POST", { ...input, ...change })).status, 409);
      }
      assert.equal((await request(1, `/orders/${original.id}`)).data.quantity, 3);
    });
    await t.test("a race between different quantities has exactly one immutable winner", async () => {
      const nonce = randomUUID();
      const replies = await Promise.all([3, 8].map((quantity, i) => request(i, "/orders", "POST", { ...input, quantity, clientRequestId: nonce })));
      assert.deepEqual(replies.map(r => r.status).sort(), [201, 409]);
      const winner = replies.find(r => r.status === 201)!.data;
      assert.equal((await request(1, `/orders/${winner.id}`)).data.quantity, winner.quantity);
    });
    await t.test("fresh reads and status writes do not replace original purchase fields", async () => {
      assert.equal((await request(1, `/orders/${original.id}/status`, "PUT", { status: "confirmed" }, seller)).status, 200);
      await db.update(appRecords).set({ payload: { ...product, status: "paused", price: 9000 } }).where(and(eq(appRecords.collection, "listings"), eq(appRecords.id, product.id)));
      const retry = await request(0, "/orders", "POST", input);
      assert.equal(retry.status, 200);
      assert.equal(retry.data.status, "confirmed");
      assert.equal(retry.data.totalPrice, 3000);
      assert.equal(retry.data.createdAt, original.createdAt);
      assert((await request(1, "/orders")).data.some((o: any) => o.id === original.id && o.status === "confirmed"));
      assert.equal((await request(0, "/orders", "POST", { ...input, clientRequestId: randomUUID() })).status, 409);
      await db.update(appRecords).set({ payload: product as unknown as Record<string, unknown> }).where(and(eq(appRecords.collection, "listings"), eq(appRecords.id, product.id)));
    });
    await t.test("request identities and read/status authorization remain account isolated", async () => {
      assert.equal((await request(1, `/orders/${original.id}`, "GET", undefined, other)).status, 403);
      assert.equal((await request(1, `/orders/${original.id}/status`, "PUT", { status: "cancelled" }, other)).status, 403);
      const second = await request(1, "/orders", "POST", input, other);
      assert.equal(second.status, 201);
      assert.notEqual(second.data.id, original.id);
    });
    await t.test("stale cart checkout and concurrent edits cannot change a committed quantity", async () => {
      const nonce = randomUUID();
      await db.update(appRecords).set({ payload: { items: [{ requestId: nonce, quantity: 6, listing: listingSnapshot(product.id) }], revision: 2 } })
        .where(and(eq(appRecords.collection, "carts"), eq(appRecords.id, buyer.id)));
      assert.equal((await request(1, "/orders", "POST", { ...input, quantity: 3, clientRequestId: nonce })).status, 409);
      const [checkout, edit] = await Promise.all([
        request(0, "/orders", "POST", { ...input, quantity: 6, clientRequestId: nonce }),
        changeCart(buyer.id, randomUUID(), { quantity: 10 }, async (cart, hasOrder) => {
          if (await hasOrder(nonce)) throw new CartError(409, "Purchase already committed");
          cart.items[0]!.quantity = 10;
        }).then(() => 200, error => {
          if (error instanceof CartError) return error.status;
          throw error;
        }),
      ]);
      if (checkout.status === 201) {
        assert.equal(edit, 409);
        assert.equal(checkout.data.quantity, 6);
      } else {
        assert.equal(checkout.status, 409);
        assert.equal(edit, 200);
        const refreshed = await request(1, "/orders", "POST", { ...input, quantity: 10, clientRequestId: nonce });
        assert.equal(refreshed.status, 201);
        assert.equal(refreshed.data.quantity, 10);
      }
      const stored = await request(1, `/orders/${orderRequestId(buyer.id, nonce)}`);
      assert.equal(stored.status, 200);
      assert.equal(stored.data.quantity, checkout.status === 201 ? 6 : 10);
    });
    await t.test("worker restart replays from PostgreSQL without a process-local order cache", async () => {
      bases[1] = await start();
      const replay = await request(1, "/orders", "POST", input);
      assert.equal(replay.status, 200);
      assert.equal(replay.data.id, original.id);
      assert.equal(replay.data.status, "confirmed");
    });
  } finally {
    for (const child of children) child.kill("SIGTERM");
    await db.delete(appRecords).where(and(eq(appRecords.collection, "orders"), sql`${appRecords.payload}->>'buyerId' IN (${buyer.id}, ${other.id})`));
    await db.delete(appRecords).where(and(inArray(appRecords.collection, ["users", "listings", "carts"]), inArray(appRecords.id, [...actors.map(a => a.id), product.id])));
    await db.delete(appRecords).where(and(eq(appRecords.collection, "cart_operations"), sql`${appRecords.id} LIKE ${buyer.id + ":%"}`));
    for (const collection of [users, listings]) {
      for (let i = collection.length - 1; i >= 0; i--) if (collection[i]!.id.startsWith(prefix)) collection.splice(i, 1);
    }
    await pool.end();
  }
});
