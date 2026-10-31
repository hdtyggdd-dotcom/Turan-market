// Separate-process fixture for the shared PostgreSQL coordination tests.
import { createListingAdvice } from "./listing-advice.js";
import { reserveAdvice } from "./advice-budget.js";
import { adviceCoordinationPool, pool } from "@workspace/db";

process.send?.({ type: "ready" });
process.once("message", async (message: { collection: string; key: string; fail?: boolean }) => {
  try {
    const advice = await createListingAdvice(message.collection).get(message.key, async () => {
      await reserveAdvice("worker-owner", { accountDaily: 20, globalDaily: 20, globalTotal: 20 }, `${message.collection}-budget`);
      process.send?.({ type: "provider" });
      await new Promise<void>(resolve => process.once("message", () => resolve()));
      if (message.fail) throw new Error("Simulated provider timeout");
      return "Shared advice";
    });
    process.send?.({ type: "result", advice });
  } catch (error) {
    process.send?.({ type: "result", error: (error as Error).message });
  } finally {
    await Promise.all([adviceCoordinationPool.end(), pool.end()]);
    process.disconnect?.();
  }
});
