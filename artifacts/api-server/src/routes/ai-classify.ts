/**
 * ai-classify.ts
 * Elon matnidan kategoriya, viloyat, tuman va lokatsiyani AI orqali avtomatik aniqlar
 */

import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import {
  categories,
  regions,
  districts,
  neighborhoods,
  findBestCategory,
} from "../data/store.js";

const router = Router();

function getAIClient() {
  const key = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || "";
  return new Anthropic({ apiKey: key });
}

// O'zbekiston tumanlari — kalit so'zlar bilan eşitadigan
const DISTRICT_KEYWORDS: Record<string, string[]> = {
  // Toshkent viloyati
  d1: ["tashkent", "toshkent", "tashkent shahri", "toshkent shahar"],
  d2: ["oʻngʻa", "unga", "ung\'a"],
  d3: ["yangʻioyul", "yangioʻyul", "yangi oʻyul", "yangioil"],
  d4: ["angren", "angor"],
  d5: ["bekobod", "beka bud", "bek"],

  // Tashkent viloyati
  d6: ["tashkent viloyati", "tashkent vili", "tashkent oblastı"],
  d7: ["chiroʻzak", "chiroʻ zak", "chirozak"],
  d8: ["olmaliq", "olma liq"],
  d9: ["nurafshan", "nur afshan"],
  d10: ["yangʻiabod", "yangi abad"],

  // Samarqand
  d11: ["samarqand", "samarkand"],
  d12: ["samarqand viloyati"],
  d13: ["katta qoʻrgʻon", "qatta korgan"],
  d14: ["pastdargʻom", "pastdargom"],
  d15: ["buharо", "bukhara", "buxoro"],

  // Buxoro
  d16: ["buxoro", "bukhara", "buharо"],
  d17: ["buxoro viloyati"],
  d18: ["qarshi", "karshi"],

  // Andijon
  d19: ["andijon", "andijan"],
  d20: ["andijon viloyati"],

  // Fargʻona
  d21: ["fargʻona", "fargona", "fergana"],
  d22: ["fargʻona viloyati"],
  d23: ["koʻkilon", "kokand"],

  // Navoiy
  d24: ["navoiy", "navoi"],

  // Surxondarya
  d25: ["surxondarya", "surkhandarya"],
  d26: ["qumqoʻrgʻon", "kumkurgan"],

  // Qashqadarya
  d27: ["qashqadarya", "kashkadarya"],
  d28: ["shahrisabz", "shakhrisabz"],

  // Xorazm
  d29: ["xorazm", "khorezm"],
  d30: ["urganch", "urgench"],

  // Karakalpakstan
  d31: ["nukus", "nuckus"],
};

interface AIClassificationResult {
  categoryId: string | null;
  categoryName: string | null;
  regionId: string | null;
  regionName: string | null;
  districtId: string | null;
  districtName: string | null;
  confidence: "high" | "medium" | "low";
  reasoning: string;
}

/**
 * POST /api/ai/classify-listing
 * Body: { title, description, titleRu?, latitude?, longitude? }
 * Qaytaradi: { categoryId, regionId, districtId, confidence, reasoning }
 */
router.post("/ai/classify-listing", async (req, res) => {
  const {
    title,
    description,
    titleRu,
    latitude,
    longitude,
  } = req.body as {
    title?: string;
    description?: string;
    titleRu?: string;
    latitude?: number;
    longitude?: number;
  };

  if (!title?.trim() && !description?.trim()) {
    res.status(400).json({ error: "title yoki description kerak" });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
    res.status(503).json({ error: "AI xizmati sozlanmagan" });
    return;
  }

  try {
    // ── 1. AI bilan tasnif (kategoriya, viloyat, tuman) ──────────────────────
    const fullText = [title, titleRu, description].filter(Boolean).join("\n");

    const classificationsPrompt = `Sen O'zbekiston bozori uchun e'lon tasniflovchi AIsan.

Quyidagi e'lonni tahlil qilib, quyidagilarni toping:
1. Eng mos KATEGORIYA
2. O'zbekistondagi VILOYAT yoki SHAHAR
3. TUMAN (agar tildan ravshan bo'lsa)

E'LON MATNI:
"""
${fullText}
"""

JSON shaklida javob ber (O'zbek tilida):
{
  "category": "Kategoriya nomi va ID (masalan: Chorva — cat1)",
  "categoryId": "cat1",
  "region": "Viloyat yoki shahar nomi",
  "district": "Tuman nomi (agar tildan ravshan bo'lsa)",
  "confidence": "high|medium|low",
  "reasoning": "Nima asosida aniqladim?"
}`;

    const classResponse = await getAIClient().messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 600,
      messages: [{ role: "user", content: classificationsPrompt }],
    });

    let aiClassification: {
      categoryId?: string;
      category?: string;
      region?: string;
      district?: string;
      confidence?: string;
      reasoning?: string;
    } = {};

    if (classResponse.content[0]?.type === "text") {
      const textContent = classResponse.content[0].text;
      try {
        // JSON ni ajrat
        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiClassification = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error("AI JSON parse error:", e);
      }
    }

    // ── 2. Kategoriya ID'ni aniqla ──────────────────────────────────────────
    let resolvedCategoryId: string | null = null;
    if (aiClassification.categoryId) {
      resolvedCategoryId = aiClassification.categoryId;
    } else {
      // Fallback: keyword-based
      resolvedCategoryId = findBestCategory(fullText);
    }

    const resolvedCategory = categories.find((c) => c.id === resolvedCategoryId);

    // ── 3. Viloyat ID'ni aniqla ───────────────────────────────────────────────
    let resolvedRegionId: string | null = null;
    let resolvedRegionName: string | null = null;

    if (aiClassification.region) {
      const regionName = aiClassification.region.toLowerCase();
      const matched = regions.find(
        (r) =>
          r.name.toLowerCase().includes(regionName) ||
          regionName.includes(r.name.toLowerCase())
      );
      if (matched) {
        resolvedRegionId = matched.id;
        resolvedRegionName = matched.name;
      }
    }

    // ── 4. Tuman ID'ni aniqla ──────────────────────────────────────────────────
    let resolvedDistrictId: string | null = null;
    let resolvedDistrictName: string | null = null;

    if (aiClassification.district && resolvedRegionId) {
      const districtName = aiClassification.district.toLowerCase();
      const regionDists = districts.filter((d) => d.regionId === resolvedRegionId);
      const matched = regionDists.find(
        (d) =>
          d.name.toLowerCase().includes(districtName) ||
          districtName.includes(d.name.toLowerCase())
      );
      if (matched) {
        resolvedDistrictId = matched.id;
        resolvedDistrictName = matched.name;
      }
    }

    // ── 5. Geografik joyni aniqla (agar lat/lng bilan) ─────────────────────────
    if (
      latitude != null &&
      longitude != null &&
      !resolvedRegionId &&
      !resolvedDistrictId
    ) {
      // TODO: Reverse geocode yoki nearest region/district
      // Bu qismni ertaga qo'shamiz
    }

    const result: AIClassificationResult = {
      categoryId: resolvedCategory?.id ?? null,
      categoryName: resolvedCategory?.name ?? null,
      regionId: resolvedRegionId,
      regionName: resolvedRegionName,
      districtId: resolvedDistrictId,
      districtName: resolvedDistrictName,
      confidence: (aiClassification.confidence as any) ?? "medium",
      reasoning: aiClassification.reasoning ?? "AI orqali tasnifland",
    };

    res.json(result);
  } catch (err) {
    console.error("AI classify error:", err);
    const msg = err instanceof Error ? err.message : "Tasnif xatolik";
    res.status(500).json({ error: msg });
  }
});

export default router;
