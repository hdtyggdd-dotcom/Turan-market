import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { appRecords, db } from "@workspace/db";
import { categories } from "../data/store.js";
import { authenticateToken, type AuthRequest } from "../middleware/auth.js";
import { adviceProvider } from "../lib/advice-provider.js";
import { adviceBudget, AdviceLimitError } from "../lib/advice-budget.js";
import { PHOTO_REQUESTS, validPhoto, photoHash, recognizePhoto, matchPhotoProduct, notifyCategorySellers } from "../lib/photo-search.js";

const router = Router();
router.post("/ai/photo-search", authenticateToken, async (req: AuthRequest, res) => {
  const { data, mimeType, requestId } = req.body ?? {};
  if (!validPhoto(data, mimeType) || typeof requestId !== "string" || !/^[A-Za-z0-9_-]{8,100}$/.test(requestId) ||
    Object.keys(req.body).some(key => !["data", "mimeType", "requestId"].includes(key))) {
    res.status(400).json({ error: "invalid_image", message: "2 MB gacha JPEG, PNG yoki WEBP mahsulot rasmini yuboring." });
    return;
  }
  const id = `${req.userId}:${requestId}`;
  const digest = photoHash(`${mimeType}:${data}`);
  let claimed = false;
  try {
    // Durable request identity prevents client retries from paying or notifying twice.
    const inserted = await db.insert(appRecords).values({
      collection: PHOTO_REQUESTS, id, payload: { digest, state: "processing" },
    }).onConflictDoNothing().returning();
    if (!inserted.length) {
      const [receipt] = await db.select().from(appRecords).where(and(eq(appRecords.collection, PHOTO_REQUESTS), eq(appRecords.id, id)));
      if (receipt?.payload.digest !== digest) {
        res.status(409).json({ error: "request_conflict", message: "Bu so‘rov boshqa rasm uchun ishlatilgan." });
      } else if (receipt.payload.state === "done") {
        res.json(receipt.payload.result);
      } else {
        res.status(503).json({ error: receipt.payload.state === "processing" ? "photo_processing" : "photo_failed",
          message: receipt.payload.state === "processing" ? "Rasm tahlili hali tugamadi. Birozdan so‘ng qayta tekshiring." : "Avvalgi tahlil tugamadi. Yangi qidiruvni boshlang." });
      }
      return;
    }
    claimed = true;
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("Provider not configured");
    await adviceBudget.reserve(req.userId!);
    const raw = await adviceProvider.identifyProduct(data, mimeType,
      JSON.stringify(categories.map(category => ({ id: category.id, name: category.name, nameRu: category.nameRu }))));
    const product = recognizePhoto(raw);
    let result;
    if (!product) {
      result = { recognized: false, productName: null, categoryId: null, categoryName: null,
        listingIds: [], unavailableCount: 0, notificationStatus: "unrecognized", notifiedSellerCount: 0 };
    } else {
      const matches = matchPhotoProduct(product);
      const notification = matches.listingIds.length
        ? { notificationStatus: "not_needed", notifiedSellerCount: 0 }
        : await notifyCategorySellers(product.category.id, product.productName, req.userId!);
      result = { recognized: true, productName: product.productName, categoryId: product.category.id,
        categoryName: product.category.name, ...matches, ...notification };
    }
    await db.update(appRecords).set({ payload: { digest, state: "done", result }, updatedAt: new Date() })
      .where(and(eq(appRecords.collection, PHOTO_REQUESTS), eq(appRecords.id, id)));
    res.json(result);
  } catch (error) {
    if (claimed) {
      try {
        const receipt = and(eq(appRecords.collection, PHOTO_REQUESTS), eq(appRecords.id, id));
        if (error instanceof AdviceLimitError) {
          // No provider call occurred. Permit the same safe request after a quota reset,
          // and don't accumulate unlimited failed receipts once the global budget ends.
          await db.delete(appRecords).where(receipt);
        } else {
          await db.update(appRecords).set({ payload: { digest, state: "failed" }, updatedAt: new Date() }).where(receipt);
        }
      } catch { req.log.warn("Could not persist photo-search failure"); }
    }
    if (error instanceof AdviceLimitError) {
      if (error.retryAfter) res.setHeader("Retry-After", error.retryAfter);
      res.status(429).json({ error: error.code, message: error.message });
      return;
    }
    req.log.warn("Photo-search request failed");
    res.status(503).json({ error: claimed ? "photo_failed" : "photo_unavailable", message: "Rasmni tahlil qilib bo‘lmadi. Keyinroq qayta urinib ko‘ring." });
  }
});
export default router;
