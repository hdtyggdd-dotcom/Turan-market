import { sql, and, eq } from "drizzle-orm";
import { appRecords, db } from "@workspace/db";

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
  });
}

export const adviceBudget = { reserve: reserveAdvice };
