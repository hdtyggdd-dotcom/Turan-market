import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { authenticateToken, type AuthRequest } from "../middleware/auth.js";
import { adviceBudget, AdviceLimitError } from "../lib/advice-budget.js";
import { adviceProvider, MAX_ADVICE_INPUT_CHARS } from "../lib/advice-provider.js";

const router = Router();

const SYSTEM_PROMPT = `Sen Turan Market — O'zbekiston va qo'shni mamlakatlar uchun mahalliy bozor ilovasining AI yordamchisisan.

Foydalanuvchilarga quyidagi mavzularda yordam ber:
- Mahsulot/tovar narxi bo'yicha maslahat (bozor narxlari, raqobat)
- E'lon sarlavhasi va tavsifini yaxshilash
- Qaysi kategoriyada joylash kerakligi
- Sotish strategiyasi va marketing maslahatlar
- Xaridor/sotuvchi uchun foydali tavsiyalar
- Chorva, qurilish mollari, transport, don mahsulotlari va boshqa kategoriyalar bo'yicha bilim

Qoidalar:
- FAQAT O'zbek tilida javob ber
- Qisqa, aniq va amaliy maslahat ber (3-5 gap)
- Emoji ishlatishingiz mumkin
- Narxlarni so'mda ayt
- Mahalliy bozor sharoitini hisobga ol
- Savol aniq bo'lmasa, aniqlashtiruvchi savol ber`;

// POST /api/ai/advice
router.post("/ai/advice", authenticateToken, async (req: AuthRequest, res) => {
  const { message, context } = (req.body ?? {}) as {
    message: string;
    context?: {
      category?: string;
      price?: number;
      region?: string;
    };
  };

  if (typeof message !== "string" || !message.trim() || message.length > 4000 ||
    (context !== undefined && (context === null || typeof context !== "object" || Array.isArray(context) ||
      (context.category !== undefined && (typeof context.category !== "string" || context.category.length > 200)) ||
      (context.region !== undefined && (typeof context.region !== "string" || context.region.length > 200)) ||
      (context.price !== undefined && (typeof context.price !== "number" || !Number.isFinite(context.price))) ||
      Object.keys(context).some(key => !["category", "region", "price"].includes(key))))) {
    res.status(400).json({ error: "invalid_input", message: "Savolni kiriting (ko‘pi bilan 4000 belgi)." });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({ error: "AI xizmati sozlanmagan" });
    return;
  }

  try {
    const userContent = context
      ? `Kontekst: ${JSON.stringify(context)}\n\nSavol: ${message}`
      : message;

    if (userContent.length > MAX_ADVICE_INPUT_CHARS) {
      res.status(400).json({ error: "message_too_long", message: "Savol juda uzun." });
      return;
    }
    await adviceBudget.reserve(req.userId!);
    const text = await adviceProvider.generate(userContent, SYSTEM_PROMPT);
    if (!text) throw new Error("Empty advice");
    res.json({ reply: text });
  } catch (err: unknown) {
    if (err instanceof AdviceLimitError) {
      if (err.retryAfter) res.setHeader("Retry-After", err.retryAfter);
      res.status(429).json({ error: err.code, message: err.message });
      return;
    }
    const status = err instanceof Anthropic.APIError ? err.status : undefined;
    req.log.warn({ status }, "AI advice request failed");
    res.status(503).json({ error: "ai_unavailable", message: "AI javobini olib bo‘lmadi. Birozdan keyin qayta urinib ko‘ring." });
  }
});

export default router;
