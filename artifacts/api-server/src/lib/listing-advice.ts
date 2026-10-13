import { createHash } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import { adviceCoordinationPool } from "@workspace/db";

const COLLECTION = "listing_advice_cache";
const TTL_MS = 5 * 60_000;
const WAIT_MS = 35_000; // Provider timeout is 25s, with retries disabled.

/**
 * Local promises share failures as well as successes. Independent workers use
 * a session advisory lock and durable success cache; no transaction stays open
 * during the provider call, and a dead worker's connection releases its lock.
 */
export function createListingAdvice(collection = COLLECTION) {
  const inFlight = new Map<string, Promise<string | null>>();

  async function coordinate(key: string, generate: () => Promise<string | null>) {
    const deadline = performance.now() + WAIT_MS;
    let waited = false;
    while (performance.now() < deadline) {
      const client = await adviceCoordinationPool.connect();
      let locked = false;
      let destroy = false;
      try {
        const lock = `${collection}:${key}`;
        const result = await client.query<{ locked: boolean }>(
          "SELECT pg_try_advisory_lock(hashtextextended($1, 0)) AS locked", [lock],
        );
        locked = result.rows[0]!.locked;
        const cached = await client.query<{ advice: string }>(
          `SELECT payload->>'advice' AS advice FROM app_records
           WHERE collection = $1 AND id = $2 AND updated_at > clock_timestamp() - interval '5 minutes'`,
          [collection, key],
        );
        if (cached.rows[0]?.advice) return cached.rows[0].advice;
        if (locked) {
          // A waiter must not turn a failed/crashed generation into another
          // billable attempt. A fresh request can retry immediately.
          if (waited) throw new Error("Concurrent listing advice generation failed; retry");
          const advice = await generate();
          if (advice) {
            await client.query(
              `INSERT INTO app_records (collection, id, payload, updated_at)
               VALUES ($1, $2, $3::jsonb, clock_timestamp())
               ON CONFLICT (collection, id) DO UPDATE
               SET payload = EXCLUDED.payload, updated_at = EXCLUDED.updated_at`,
              [collection, key, JSON.stringify({ advice })],
            );
            // Keep only the five-minute success window, rather than an
            // unbounded permanent history of AI responses.
            await client.query(
              `DELETE FROM app_records WHERE collection = $1
               AND updated_at <= clock_timestamp() - ($2 * interval '1 millisecond')`,
              [collection, TTL_MS],
            );
          }
          return advice;
        }
        waited = true;
      } finally {
        if (locked) {
          try {
            await client.query("SELECT pg_advisory_unlock(hashtextextended($1, 0))", [`${collection}:${key}`]);
          } catch {
            // Never put a possibly locked connection back in the pool.
            destroy = true;
          }
        }
        client.release(destroy);
      }
      await sleep(100);
    }
    throw new Error("Timed out waiting for listing advice; retry");
  }

  return {
    get(cacheKey: string, generate: () => Promise<string | null>): Promise<string | null> {
      // Hash the full analysis identity; never store user descriptions as IDs.
      const key = createHash("sha256").update(cacheKey).digest("hex");
      const existing = inFlight.get(key);
      if (existing) return existing;
      const promise = coordinate(key, generate).finally(() => inFlight.delete(key));
      inFlight.set(key, promise);
      return promise;
    },
  };
}

export const listingAdvice = createListingAdvice();
