import { Router } from "express";
import { authenticateToken, type AuthRequest } from "../middleware/auth.js";
import { persistRecord } from "../lib/persistence.js";
import { db, appRecords } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { imageStore } from "../lib/image-store.js";
export { imageStore } from "../lib/image-store.js";

async function readPersistedImage(id: string): Promise<string | undefined> {
  const [row] = await db.select({ payload: appRecords.payload }).from(appRecords)
    .where(and(eq(appRecords.collection, "images"), eq(appRecords.id, id)));
  return typeof row?.payload.dataUrl === "string" ? row.payload.dataUrl : undefined;
}

export function createUploadsRouter(readImage = readPersistedImage) {
const router = Router();

// Persisted legacy images are cached by ID in each running instance.

function genImgId() {
  return `img_${randomUUID()}`;
}

// POST /api/upload — base64 rasm yuklash
router.post("/upload", authenticateToken, async (req: AuthRequest, res) => {
  const { data, mimeType = "image/jpeg" } = req.body as {
    data?: string;
    mimeType?: string;
  };

  if (!data) {
    res.status(400).json({ error: "data kerak" });
    return;
  }

  // base64 hajmini tekshirish (max 2MB)
  const bytes = Math.round((data.length * 3) / 4);
  if (bytes > 2 * 1024 * 1024) {
    res.status(400).json({ error: "Rasm hajmi 2MB dan oshmasin" });
    return;
  }

  const id = genImgId();
  const dataUrl = `data:${mimeType};base64,${data}`;
  await persistRecord("images", id, {
    dataUrl,
    userId: req.userId ?? null,
    mimeType,
  });
  imageStore.set(id, dataUrl);

  res.json({ id, url: `/api/images/${id}` });
});

// GET /api/images/:id — rasmni qaytarish
router.get("/images/:id", async (req, res) => {
  // A freshly uploaded image may arrive at a different autoscale instance.
  const dataUrl = imageStore.get(req.params.id) ?? await readImage(req.params.id);
  if (!dataUrl) {
    res.status(404).json({ error: "Rasm topilmadi" });
    return;
  }
  imageStore.set(req.params.id, dataUrl);

  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    res.status(500).json({ error: "Format xato" });
    return;
  }

  const [, mime, b64] = matches;
  const buf = Buffer.from(b64, "base64");
  res.setHeader("Content-Type", mime);
  res.setHeader("Cache-Control", "no-store");
  res.send(buf);
});

return router;
}

export default createUploadsRouter();
