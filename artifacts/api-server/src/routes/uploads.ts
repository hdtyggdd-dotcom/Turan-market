import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// Xotirada saqlanadigan rasmlar: id → base64 data URL
const imageStore = new Map<string, string>();
let imgCounter = 0;

function genImgId() {
  return `img_${Date.now()}_${++imgCounter}`;
}

// POST /api/upload — base64 rasm yuklash
router.post("/upload", authenticateToken, (req, res) => {
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
  imageStore.set(id, dataUrl);

  res.json({ id, url: `/api/images/${id}` });
});

// GET /api/images/:id — rasmni qaytarish
router.get("/images/:id", (req, res) => {
  const dataUrl = imageStore.get(req.params.id);
  if (!dataUrl) {
    res.status(404).json({ error: "Rasm topilmadi" });
    return;
  }

  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    res.status(500).json({ error: "Format xato" });
    return;
  }

  const [, mime, b64] = matches;
  const buf = Buffer.from(b64, "base64");
  res.setHeader("Content-Type", mime);
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(buf);
});

export default router;
