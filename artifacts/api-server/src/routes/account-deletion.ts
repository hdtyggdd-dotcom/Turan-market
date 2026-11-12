import { Router } from "express";
import { DeleteAccountBody } from "@workspace/api-zod";
import { verifyToken } from "../data/store.js";
import { eraseAccount, DeletionUnauthorized } from "../lib/account-deletion.js";
import { DeletionConflict } from "../lib/account-deletion-plan.js";
import { accountDeletionPage } from "./account-deletion-page.js";

const router = Router();
const attempts = new Map<string, { count: number; expires: number }>();
router.get("/account-deletion", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
  res.type("html").send(accountDeletionPage);
});
router.post("/account-deletion", async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const now = Date.now();
  for (const [key, value] of attempts) if (value.expires <= now) attempts.delete(key);
  const key = req.ip ?? "unknown";
  const record = attempts.get(key) ?? { count: 0, expires: now + 15 * 60_000 };
  record.count++;
  attempts.set(key, record);
  if (record.count > 20) {
    res.setHeader("Retry-After", String(Math.ceil((record.expires - now) / 1000)));
    res.status(429).json({ message: "Juda ko‘p urinish. Biroz kuting yoki yordam emailiga yozing." });
    return;
  }
  if (!req.is("application/json")) { res.status(400).json({ message: "JSON ma’lumot yuboring." }); return; }
  const parsed = DeleteAccountBody.safeParse(req.body);
  if (!parsed.success || parsed.data.confirmation !== true) { res.status(400).json({ message: "Telefon, parol va o‘chirish tasdig‘ini to‘ldiring." }); return; }
  const authorization = req.headers.authorization;
  const expectedUserId = authorization ? verifyToken(authorization.startsWith("Bearer ") ? authorization.slice(7) : "") : undefined;
  if (authorization && !expectedUserId) { res.status(401).json({ message: "Kirish muddati tugagan. Qayta kiring." }); return; }
  try {
    res.json(await eraseAccount(parsed.data, expectedUserId ?? undefined));
  } catch (error) {
    if (error instanceof DeletionUnauthorized) res.status(401).json({ message: error.message });
    else if (error instanceof DeletionConflict) res.status(409).json({ message: error.message });
    else {
      req.log.error("Account deletion did not complete or response is uncertain; retry using the same identity");
      res.status(503).json({ message: "O‘chirish javobi aniq emas. Xuddi shu so‘rovni qayta yuboring yoki yordam emailiga yozing." });
    }
  }
});
export default router;
