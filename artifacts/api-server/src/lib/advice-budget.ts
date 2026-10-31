import { sql, and, eq, inArray } from "drizzle-orm";
import { appRecords, db } from "@workspace/db";

type BudgetTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Limits = ReturnType<typeof adviceLimits>;
export interface BudgetAlert {
  id: string;
  scope: "daily" | "total";
  day: string | null;
  used: number;
  limit: number;
  createdAt: string;
  readAt: string | null;
}
export const WARNING_THRESHOLD_PERCENT = 80;

function counterValue(payload?: Record<string, unknown>): number {
  const count = payload ? payload.count : 0;
  if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 0) {
    throw new Error("Invalid AI usage counter");
  }
  return count;
}

function warningId(scope: BudgetAlert["scope"], day: string, limit: number) {
  // A changed allowance starts a new warning cycle; midnight only resets daily warnings.
  return scope === "daily" ? `warning:daily:${day}:${limit}` : `warning:total:${limit}`;
}

async function ensureWarnings(
  tx: BudgetTransaction, collection: string, limits: Limits, day: string,
  total: number, daily: number, now: Date,
) {
  for (const [scope, used, limit] of [
    ["daily", daily, limits.globalDaily], ["total", total, limits.globalTotal],
  ] as const) {
    // Zero means disabled, not a nearly exhausted allowance.
    if (limit === 0 || used < Math.ceil(limit * WARNING_THRESHOLD_PERCENT / 100)) continue;
    const id = warningId(scope, day, limit);
    const payload: BudgetAlert = {
      id, scope, day: scope === "daily" ? day : null, used, limit,
      createdAt: now.toISOString(), readAt: null,
    };
    await tx.insert(appRecords).values({ collection, id, payload: { ...payload }, updatedAt: now })
      .onConflictDoNothing({ target: [appRecords.collection, appRecords.id] });
  }
}

export async function readAdviceBudget(limits = adviceLimits(), collection = "ai_advice_usage", now = new Date()) {
  return db.transaction(async tx => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${collection}))`);
    const day = now.toISOString().slice(0, 10);
    const rows = await tx.select().from(appRecords).where(and(
      eq(appRecords.collection, collection), inArray(appRecords.id, ["global:total", `global:${day}`]),
    ));
    const total = counterValue(rows.find(row => row.id === "global:total")?.payload);
    const daily = counterValue(rows.find(row => row.id === `global:${day}`)?.payload);
    // Also cover pre-existing usage at deployment without making another provider call.
    await ensureWarnings(tx, collection, limits, day, total, daily, now);
    const warnings = await tx.select().from(appRecords).where(and(
      eq(appRecords.collection, collection),
      inArray(appRecords.id, [warningId("daily", day, limits.globalDaily), warningId("total", day, limits.globalTotal)]),
    ));
    const counter = (used: number, limit: number) => ({ used, limit, remaining: Math.max(0, limit - used) });
    return {
      day, resetsAt: new Date(Date.parse(`${day}T00:00:00Z`) + 86_400_000).toISOString(),
      warningThresholdPercent: WARNING_THRESHOLD_PERCENT,
      daily: counter(daily, limits.globalDaily), total: counter(total, limits.globalTotal),
      alerts: warnings.map(row => row.payload as unknown as BudgetAlert),
    };
  });
}

export async function acknowledgeAdviceBudgetAlert(id: string, collection = "ai_advice_usage") {
  return db.transaction(async tx => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${collection}))`);
    if (!id.startsWith("warning:daily:") && !id.startsWith("warning:total:")) return null;
    const [row] = await tx.select().from(appRecords).where(and(eq(appRecords.collection, collection), eq(appRecords.id, id)));
    if (!row) return null;
    const alert = row.payload as unknown as BudgetAlert;
    if (alert.readAt) return alert;
    const now = new Date();
    const payload = { ...alert, readAt: now.toISOString() };
    await tx.update(appRecords).set({ payload, updatedAt: now })
      .where(and(eq(appRecords.collection, collection), eq(appRecords.id, id)));
    return payload;
  });
}

export class AdviceLimitError extends Error {
  constructor(public readonly code: string, message: string, public readonly retryAfter?: number) {
    super(message);
  }
}

function configuredLimit(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw))) {
    throw new Error(`${name} must be a non-negative safe integer`);
  }
  return Number(raw);
}

export function adviceLimits() {
  return {
    accountDaily: configuredLimit("AI_ADVICE_ACCOUNT_DAILY_LIMIT", 5),
    globalDaily: configuredLimit("AI_ADVICE_GLOBAL_DAILY_LIMIT", 100),
    globalTotal: configuredLimit("AI_ADVICE_GLOBAL_TOTAL_BUDGET", 1000),
  };
}

// Every outbound attempt is reserved BEFORE contacting Anthropic. Never refund
// uncertain failures: the provider may have already generated billable tokens.
// A shared PostgreSQL lock protects both counters across processes and restarts.
export async function reserveAdvice(
  userId: string,
  limits = adviceLimits(),
  collection = "ai_advice_usage",
): Promise<void> {
  await db.transaction(async tx => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${collection}))`);
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    const retryAfter = Math.ceil((Date.parse(`${day}T00:00:00Z`) + 86_400_000 - now.getTime()) / 1000);
    const keys = ["global:total", `global:${day}`, `account:${userId}:${day}`];
    const used: number[] = [];
    for (const id of keys) {
      const [row] = await tx.select().from(appRecords)
        .where(and(eq(appRecords.collection, collection), eq(appRecords.id, id)));
      const count = row ? row.payload.count : 0;
      if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 0) {
        throw new Error("Invalid AI usage counter");
      }
      used.push(count);
    }
    if (used[0]! >= limits.globalTotal) {
      throw new AdviceLimitError("ai_global_budget", "AI maslahatning umumiy budjeti tugagan. Xizmat egasi budjetni oshirishi kerak.");
    }
    if (used[1]! >= limits.globalDaily) {
      throw new AdviceLimitError("ai_global_daily_limit", "AI maslahatning bugungi umumiy limiti tugagan. Ertaga (00:00 UTC dan keyin) qayta urinib ko‘ring.", retryAfter);
    }
    if (used[2]! >= limits.accountDaily) {
      throw new AdviceLimitError("ai_account_daily_limit", "AI maslahat uchun akkauntingizning bugungi limiti tugagan. Ertaga (00:00 UTC dan keyin) qayta urinib ko‘ring.", retryAfter);
    }
    for (const [index, id] of keys.entries()) {
      const payload = { count: used[index]! + 1 };
      await tx.insert(appRecords).values({ collection, id, payload, updatedAt: now })
        .onConflictDoUpdate({ target: [appRecords.collection, appRecords.id], set: { payload, updatedAt: now } });
    }
    await ensureWarnings(tx, collection, limits, day, used[0]! + 1, used[1]! + 1, now);
  });
}

export const adviceBudget = { reserve: reserveAdvice, read: readAdviceBudget, acknowledge: acknowledgeAdviceBudgetAlert };
