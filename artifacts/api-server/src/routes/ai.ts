import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

function getAIClient() {
  // Support key stored under either name
  const key = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || "";
  return new Anthropic({ apiKey: key });
}

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
router.post("/ai/advice", async (req, res) => {
  const { message, context } = req.body as {
    message: string;
    context?: {
      category?: string;
      price?: number;
      region?: string;
    };
  };

  if (!message?.trim()) {
    res.status(400).json({ error: "message required" });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
    res.status(503).json({ error: "AI xizmati sozlanmagan" });
    return;
  }

  try {
    const userContent = context
      ? `Kontekst: ${JSON.stringify(context)}\n\nSavol: ${message}`
      : message;

    const response = await getAIClient().messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text : "";
    res.json({ reply: text });
  } catch (err: unknown) {
    console.error("AI advice error:", err);
    const msg = err instanceof Error ? err.message : "AI xatolik";
    res.status(500).json({ error: msg });
  }
});

export default router;
