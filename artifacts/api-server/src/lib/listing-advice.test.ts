import assert from "node:assert/strict";
import { after, test } from "node:test";
import { fork, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import { and, eq, like } from "drizzle-orm";
import { appRecords, db, pool, adviceCoordinationPool } from "@workspace/db";
import { createListingAdvice } from "./listing-advice.js";
import { readAdviceBudget } from "./advice-budget.js";

const prefix = `listing-flight-test-${randomUUID()}`;
const children: ChildProcess[] = [];
const limits = { accountDaily: 20, globalDaily: 20, globalTotal: 20 };

async function worker(collection: string, fail = false) {
  const child = fork(new URL("./listing-advice.worker.ts", import.meta.url), {
    execArgv: process.execArgv.filter(arg => arg !== "--test"),
    stdio: ["ignore", "inherit", "inherit", "ipc"],
  });
  children.push(child);
  let providerCalls = 0;
  let providerStarted!: () => void;
  const started = new Promise<void>(resolve => { providerStarted = resolve; });
  const result = new Promise<{ advice?: string; error?: string }>((resolve, reject) => {
    child.on("message", (message: any) => {
      if (message.type === "provider") { providerCalls++; providerStarted(); }
      if (message.type === "result") resolve(message);
    });
    child.once("error", reject);
    child.once("exit", code => { if (code) reject(new Error(`Worker exited ${code}`)); });
  });
  await new Promise<void>(resolve => child.on("message", (message: any) => {
    if (message.type === "ready") resolve();
  }));
  child.send({ collection, key: "same-analysis", fail });
  return { child, started, result, calls: () => providerCalls };
}

after(async () => {
  for (const child of children) if (child.exitCode === null) child.kill();
  await db.delete(appRecords).where(like(appRecords.collection, `${prefix}%`));
  await Promise.all([adviceCoordinationPool.end(), pool.end()]);
});

test("separate server processes share success and charge only one real attempt", { timeout: 20_000 }, async () => {
  const collection = `${prefix}-success`;
  const leader = await worker(collection);
  await leader.started;
  const followers = await Promise.all(Array.from({ length: 3 }, () => worker(collection)));
  await sleep(300);
  leader.child.send({ release: true });
  const results = await Promise.all([leader, ...followers].map(w => w.result));
  assert(results.every(r => r.advice === "Shared advice"));
  assert.equal([leader, ...followers].reduce((sum, w) => sum + w.calls(), 0), 1);
  assert.equal((await readAdviceBudget(limits, `${collection}-budget`)).total.used, 1);
  // A new process has no memory of the original promise, but still hits cache.
  const fresh = await worker(collection);
  assert.equal((await fresh.result).advice, "Shared advice");
  assert.equal(fresh.calls(), 0);
});

test("failed cross-process flight is not cached or automatically retried by waiters", { timeout: 20_000 }, async () => {
  const collection = `${prefix}-failure`;
  const leader = await worker(collection, true);
  await leader.started;
  const follower = await worker(collection);
  await sleep(300);
  leader.child.send({ release: true });
  assert((await leader.result).error);
  assert((await follower.result).error);
  assert.equal(leader.calls() + follower.calls(), 1);
  const rows = await db.select().from(appRecords).where(eq(appRecords.collection, collection));
  assert.equal(rows.length, 0);
  const retry = await worker(collection);
  await retry.started;
  retry.child.send({ release: true });
  assert.equal((await retry.result).advice, "Shared advice");
  assert.equal((await readAdviceBudget(limits, `${collection}-budget`)).total.used, 2);
});

test("worker termination releases the lock and a fresh request can retry", { timeout: 20_000 }, async () => {
  const collection = `${prefix}-crash`;
  const leader = await worker(collection);
  await leader.started;
  const exited = new Promise<void>(resolve => leader.child.once("exit", () => resolve()));
  leader.child.kill("SIGKILL");
  await exited;
  const retry = await worker(collection);
  await retry.started;
  retry.child.send({ release: true });
  assert.equal((await retry.result).advice, "Shared advice");
  assert.equal((await readAdviceBudget(limits, `${collection}-budget`)).total.used, 2);
});

test("empty output is retryable; expiry and changed keys trigger fresh generation", async () => {
  const collection = `${prefix}-expiry`;
  const advice = createListingAdvice(collection);
  let calls = 0;
  const generate = async () => { calls++; return "Advice"; };
  assert.equal(await advice.get("empty", async () => null), null);
  assert.equal(await advice.get("empty", generate), "Advice");
  assert.equal(await advice.get("empty", generate), "Advice");
  assert.equal(calls, 1);
  await db.update(appRecords).set({ updatedAt: new Date(Date.now() - 6 * 60_000) })
    .where(and(eq(appRecords.collection, collection)));
  assert.equal(await advice.get("empty", generate), "Advice");
  assert.equal(await advice.get("changed", generate), "Advice");
  assert.equal(calls, 3);
});
