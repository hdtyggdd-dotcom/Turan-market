import assert from "node:assert/strict";
import { after, before, test, mock } from "node:test";
import { randomUUID } from "node:crypto";
import express from "express";
import type { Server } from "node:http";
import { and, eq, like } from "drizzle-orm";
import { appRecords, db, pool } from "@workspace/db";
import { AdviceLimitError, adviceBudget, adviceLimits, reserveAdvice, readAdviceBudget, acknowledgeAdviceBudgetAlert } from "../lib/advice-budget.js";
import { adviceProvider } from "../lib/advice-provider.js";
import aiRouter from "./ai.js";
import budgetRouter from "./advice-budget.js";
import listingsRouter from "./listings.js";
import { users, listings, generateToken } from "../data/store.js";

const prefix = `advice-test-${randomUUID()}`;
const owner = { ...users[0]!, id: `${prefix}-owner` };
const other = { ...users[0]!, id: `${prefix}-other` };
const admin = { ...users[0]!, id: `${prefix}-admin`, role: "admin" as const };
const listing = { ...listings[0]!, id: `${prefix}-listing`, userId: owner.id };
let collection = `${prefix}-routes`;
let limits = { accountDaily: 2, globalDaily: 10, globalTotal: 20 };
let providerCalls = 0;
let failProvider = false;
let failBudget = false;
let lastSystemPrompt: string | undefined;
let server: Server;
let base: string;

async function request(path: string, account: string | null = owner.id, body?: unknown) {
  const res = await fetch(`${base}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", ...(account ? { Authorization: `Bearer ${generateToken(account)}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: res.status, data: await res.json() as any, retryAfter: res.headers.get("Retry-After") };
}

before(async () => {
  users.push(owner, other, admin);
  listings.push(listing);
  mock.method(adviceBudget, "reserve", async (userId: string) => {
    if (failBudget) throw new Error("Database unavailable");
    await reserveAdvice(userId, limits, collection);
  });
  mock.method(adviceProvider, "generate", async (_prompt: string, system?: string) => {
    lastSystemPrompt = system;
    providerCalls++;
    await new Promise(resolve => setTimeout(resolve, 10));
    if (failProvider) throw new Error("Uncertain provider timeout");
    return "Aniq AI maslahat";
  });
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.log = { warn() {} } as any;
    next();
  });
  app.use(aiRouter);
  app.use(budgetRouter);
  app.use(listingsRouter);
  server = app.listen(0);
  await new Promise<void>(resolve => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});

after(async () => {
  mock.restoreAll();
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  await db.delete(appRecords).where(like(appRecords.collection, `${prefix}%`));
  users.splice(users.indexOf(owner), 1);
  users.splice(users.indexOf(other), 1);
  users.splice(users.indexOf(admin), 1);
  listings.splice(listings.indexOf(listing), 1);
  await pool.end();
});

test("atomic durable budgets and both advice entry points", async t => {
  await t.test("owner monitoring: role authorization, threshold warnings, durable acknowledgement and rollover", async () => {
    const monitoringCollection = `${prefix}-monitoring`;
    const monitoringLimits = { accountDaily: 100, globalDaily: 10, globalTotal: 10 };
    mock.method(adviceBudget, "read", async () => readAdviceBudget(monitoringLimits, monitoringCollection));
    mock.method(adviceBudget, "acknowledge", async (id: string) => acknowledgeAdviceBudgetAlert(id, monitoringCollection));
    assert.equal((await request("/admin/ai-budget", null)).status, 401);
    assert.equal((await request("/admin/ai-budget/alerts/missing/read", null, {})).status, 401);
    const previousRole = other.role;
    try {
      for (const role of ["buyer", "seller", "driver"] as const) {
        other.role = role;
        const forbidden = await request("/admin/ai-budget", other.id);
        assert.equal(forbidden.status, 403);
        assert.equal(forbidden.data.total, undefined);
        assert.equal((await request("/admin/ai-budget/alerts/missing/read", other.id, {})).status, 403);
      }
    } finally { other.role = previousRole; }
    const empty = await request("/admin/ai-budget", admin.id);
    assert.equal(empty.status, 200);
    assert.deepEqual(empty.data.total, { used: 0, limit: 10, remaining: 10 });
    assert.equal(empty.data.warningThresholdPercent, 80);
    assert.deepEqual(empty.data.alerts, []);
    for (let i = 0; i < 7; i++) await reserveAdvice(owner.id, monitoringLimits, monitoringCollection);
    assert.deepEqual((await readAdviceBudget(monitoringLimits, monitoringCollection)).alerts, []);
    // Concurrent threshold crossings produce exactly one warning per allowance.
    await Promise.all(Array.from({ length: 3 }, () => reserveAdvice(owner.id, monitoringLimits, monitoringCollection)));
    const status = await request("/admin/ai-budget", admin.id);
    assert.deepEqual(status.data.daily, { used: 10, limit: 10, remaining: 0 });
    assert.equal(status.data.alerts.length, 2);
    assert(status.data.alerts.every((alert: any) => alert.used === 8 && alert.readAt === null));
    const totalAlert = status.data.alerts.find((alert: any) => alert.scope === "total");
    const path = `/admin/ai-budget/alerts/${encodeURIComponent(totalAlert.id)}/read`;
    const ack = await request(path, admin.id, {});
    assert.equal(ack.status, 200);
    assert.equal(typeof ack.data.readAt, "string");
    assert.equal((await request(path, admin.id, {})).data.readAt, ack.data.readAt);
    assert.equal((await request("/admin/ai-budget/alerts/global:total/read", admin.id, {})).status, 404);
    assert.equal((await request("/admin/ai-budget/alerts/missing/read", admin.id, {})).status, 404);
    // New invocations reload durable warnings and do not recreate acknowledged ones.
    const reload = await readAdviceBudget(monitoringLimits, monitoringCollection);
    assert.equal(reload.alerts.length, 2);
    assert.equal(reload.alerts.find(alert => alert.scope === "total")?.readAt, ack.data.readAt);
    const tomorrow = new Date(Date.parse(reload.resetsAt) + 1000);
    const rollover = await readAdviceBudget(monitoringLimits, monitoringCollection, tomorrow);
    assert.deepEqual(rollover.daily, { used: 0, limit: 10, remaining: 10 });
    assert.equal(rollover.total.used, 10);
    assert.equal(rollover.alerts.length, 1);
    assert.equal(rollover.alerts[0]?.id, totalAlert.id);
    const warningRows = await db.select().from(appRecords).where(and(
      eq(appRecords.collection, monitoringCollection), like(appRecords.id, "warning:%")));
    assert.equal(warningRows.length, 2);
    const disabled = await readAdviceBudget({ accountDaily: 0, globalDaily: 0, globalTotal: 0 }, monitoringCollection);
    assert.equal(disabled.total.remaining, 0);
    assert.equal(disabled.total.used, 10);
    assert.deepEqual(disabled.alerts, []);
    // A changed ceiling gets its own warning without resetting usage.
    const lowered = await readAdviceBudget({ ...monitoringLimits, globalTotal: 9 }, monitoringCollection);
    assert.equal(lowered.total.remaining, 0);
    assert(lowered.alerts.some(alert => alert.scope === "total" && alert.limit === 9 && !alert.readAt));
    assert.equal(providerCalls, 0);
    mock.method(adviceBudget, "read", async () => { throw new Error("Database unavailable"); });
    assert.equal((await request("/admin/ai-budget", admin.id)).status, 503);
    mock.method(adviceBudget, "acknowledge", async () => { throw new Error("Database unavailable"); });
    assert.equal((await request(path, admin.id, {})).status, 503);
  });
  await t.test("account concurrency permits exactly the allowance", async () => {
    const results = await Promise.allSettled(Array.from({ length: 20 }, () =>
      reserveAdvice(owner.id, { accountDaily: 3, globalDaily: 100, globalTotal: 100 }, `${prefix}-account`)));
    assert.equal(results.filter(r => r.status === "fulfilled").length, 3);
    const blocked = results.filter(r => r.status === "rejected");
    assert(blocked.every(r => r.status === "rejected" && r.reason instanceof AdviceLimitError && r.reason.code === "ai_account_daily_limit"));
    // A new invocation sees durable counters; no process-local state is used.
    await assert.rejects(reserveAdvice(owner.id, { accountDaily: 3, globalDaily: 100, globalTotal: 100 }, `${prefix}-account`), AdviceLimitError);
    await reserveAdvice(other.id, { accountDaily: 3, globalDaily: 100, globalTotal: 100 }, `${prefix}-account`);
  });
  await t.test("new accounts cannot bypass global daily or lifetime budgets", async () => {
    for (const [suffix, allowance, code] of [
      ["daily", { accountDaily: 10, globalDaily: 4, globalTotal: 100 }, "ai_global_daily_limit"],
      ["total", { accountDaily: 10, globalDaily: 100, globalTotal: 4 }, "ai_global_budget"],
    ] as const) {
      const results = await Promise.allSettled(Array.from({ length: 20 }, (_, i) =>
        reserveAdvice(`new-account-${i}`, allowance, `${prefix}-${suffix}`)));
      assert.equal(results.filter(r => r.status === "fulfilled").length, 4);
      assert(results.every(r => r.status === "fulfilled" || r.reason.code === code));
    }
  });
  await t.test("prior-day counters do not consume today's account allowance", async () => {
    await db.insert(appRecords).values({
      collection: `${prefix}-rollover`, id: `account:${owner.id}:2000-01-01`, payload: { count: 50 },
    });
    await reserveAdvice(owner.id, { accountDaily: 1, globalDaily: 1, globalTotal: 1 }, `${prefix}-rollover`);
    await assert.rejects(reserveAdvice(other.id, { accountDaily: 1, globalDaily: 1, globalTotal: 1 }, `${prefix}-rollover`), e =>
      e instanceof AdviceLimitError && e.code === "ai_global_budget");
  });
  await t.test("zero disables generation and malformed settings fail closed", async () => {
    await assert.rejects(reserveAdvice(owner.id, { accountDaily: 0, globalDaily: 10, globalTotal: 10 }, `${prefix}-zero`), AdviceLimitError);
    const key = "AI_ADVICE_ACCOUNT_DAILY_LIMIT";
    const previous = process.env[key];
    try {
      for (const value of ["bad", "-1", "1.5", "Infinity", "9007199254740992"]) {
        process.env[key] = value;
        assert.throws(adviceLimits);
      }
      process.env[key] = "0";
      assert.equal(adviceLimits().accountDaily, 0);
    } finally {
      if (previous === undefined) delete process.env[key]; else process.env[key] = previous;
    }
  });
  await t.test("authentication, listing ownership and input bounds precede billing", async () => {
    assert.equal((await request("/ai/advice", null, { message: "Salom" })).status, 401);
    assert.equal((await request(`/listings/${listing.id}/analyse`, other.id)).status, 403);
    for (const body of [{ message: 4 }, { message: "a".repeat(4001) }, { message: "Salom", context: { extra: "bad" } }]) {
      assert.equal((await request("/ai/advice", owner.id, body)).status, 400);
    }
    assert.equal(providerCalls, 0);
  });
  await t.test("normal advice, free success cache, and shared account quota", async () => {
    const analysis = await request(`/listings/${listing.id}/analyse`);
    assert.equal(analysis.status, 200);
    assert.equal(analysis.data.advice, "Aniq AI maslahat");
    assert.equal((await request(`/listings/${listing.id}/analyse`)).data.advice, analysis.data.advice);
    assert.equal(providerCalls, 1);
    assert.equal((await request("/ai/advice", owner.id, { message: "Sotish uchun maslahat" })).status, 200);
    const blocked = await request("/ai/advice", owner.id, { message: "Yana" });
    assert.equal(blocked.status, 429);
    assert.equal(blocked.data.error, "ai_account_daily_limit");
    assert(blocked.data.message.includes("limiti"));
    assert(Number(blocked.retryAfter) > 0);
    listing.price += 1; // Cache invalidation still cannot bypass allowance.
    const limitedAnalysis = await request(`/listings/${listing.id}/analyse`);
    assert.equal(limitedAnalysis.status, 200);
    assert.equal(limitedAnalysis.data.advice, null);
    assert(limitedAnalysis.data.adviceError.includes("limiti"));
    assert.equal(providerCalls, 2);
  });
  await t.test("concurrent HTTP requests cannot exceed global budget", async () => {
    collection = `${prefix}-http-global`;
    limits = { accountDaily: 20, globalDaily: 3, globalTotal: 3 };
    const before = providerCalls;
    const results = await Promise.all(Array.from({ length: 12 }, (_, i) =>
      request("/ai/advice", i % 2 ? owner.id : other.id, { message: "Salom" })));
    assert.equal(results.filter(r => r.status === 200).length, 3);
    assert.equal(results.filter(r => r.status === 429).length, 9);
    assert.equal(providerCalls - before, 3);
  });
  await t.test("app help reaches AI with accurate capabilities and safety boundaries", async () => {
    collection = `${prefix}-app-help`;
    limits = { accountDaily: 2, globalDaily: 10, globalTotal: 10 };
    const before = providerCalls;
    const result = await request("/ai/advice", owner.id, { message: "Ilovadan qanday foydalanaman?" });
    assert.equal(result.status, 200);
    assert.equal(result.data.reply, "Aniq AI maslahat");
    assert.equal(providerCalls, before + 1);
    assert.match(lastSystemPrompt!, /savatchaga mahsulot/);
    assert.match(lastSystemPrompt!, /hujjati va transporti tasdiqlangan/);
    assert.match(lastSystemPrompt!, /komissiya undirish hozir yoqilmagan/);
    assert.match(lastSystemPrompt!, /foydalanuvchi nomidan bajarmaydi/);
    assert.match(lastSystemPrompt!, /Expo Go yoki brauzerda/);
  });
  await t.test("failed generations stay charged; database failures block provider calls", async () => {
    collection = `${prefix}-failure`;
    limits = { accountDaily: 1, globalDaily: 10, globalTotal: 10 };
    failProvider = true;
    const before = providerCalls;
    assert.equal((await request("/ai/advice", owner.id, { message: "Salom" })).status, 503);
    assert.equal((await request("/ai/advice", owner.id, { message: "Salom" })).status, 429);
    assert.equal(providerCalls - before, 1);
    failProvider = false;
    failBudget = true;
    assert.equal((await request("/ai/advice", other.id, { message: "Salom" })).status, 503);
    assert.equal(providerCalls - before, 1);
    const [total] = await db.select().from(appRecords).where(and(eq(appRecords.collection, collection), eq(appRecords.id, "global:total")));
    assert.equal(total?.payload.count, 1);
  });
});
