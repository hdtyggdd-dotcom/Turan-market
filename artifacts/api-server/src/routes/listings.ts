import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import {
  listings,
  users,
  regions,
  districts,
  neighborhoods,
  categories,
  generateId,
  sanitizeUser,
  calculateDistance,
  getDistanceColor,
  getPriceColor,
} from "../data/store.js";
import { authenticateToken, type AuthRequest } from "../middleware/auth.js";
import { scoreSearch, FUZZY_THRESHOLD } from "../utils/fuzzy.js";
import { ensureSubcategory, findBestCategory } from "../utils/autoCategory.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const router = Router();

function hydrateListing(
  listing: (typeof listings)[0],
  buyerLat?: number,
  buyerLng?: number,
) {
  const user = users.find((u) => u.id === listing.userId);
  const region = regions.find((r) => r.id === listing.regionId) ?? null;
  const district = districts.find((d) => d.id === listing.districtId) ?? null;
  const neighborhood =
    neighborhoods.find((n) => n.id === listing.neighborhoodId) ?? null;

  let distanceKm: number | null = null;
  let distanceColor: "green" | "yellow" | "red" | null = null;

  if (
    buyerLat != null &&
    buyerLng != null &&
    listing.lat != null &&
    listing.lng != null
  ) {
    distanceKm = calculateDistance(
      buyerLat,
      buyerLng,
      listing.lat,
      listing.lng,
    );
    distanceColor = getDistanceColor(distanceKm);
  } else if (district) {
    // Use district center as fallback
    distanceKm = null;
    distanceColor = null;
  }

  const priceColor = getPriceColor(listing.subcategoryId, listing.price);

  return {
    ...listing,
    user: user ? sanitizeUser(user) : null,
    region,
    district,
    neighborhood,
    distanceKm,
    distanceColor,
    sellerType: listing.sellerType ?? null,
    listingType: listing.listingType ?? 'savdo',
    elanTur: listing.elanTur ?? 'oddiy',
    adminStatus: listing.adminStatus ?? null,
    priceColor,
  };
}

// GET /listings/:id/analyse — bozor tahlili
router.get("/listings/:id/analyse", (req, res) => {
  const listing = listings.find((l) => l.id === req.params.id);
  if (!listing) {
    res.status(404).json({ error: "Topilmadi" });
    return;
  }

  // Shu subkategoriyada barcha aktiv e'lonlar
  const sameSub = listings.filter(
    (l) => l.status === "active" && l.subcategoryId === listing.subcategoryId && l.price > 0 && l.id !== listing.id,
  );

  // Shu viloyatda raqobatchilar
  const regional = sameSub.filter((l) => l.regionId === listing.regionId);

  // Top kategoriyalar
  const catCount: Record<string, { name: string; count: number }> = {};
  listings.filter((l) => l.status === "active").forEach((l) => {
    if (!catCount[l.categoryId]) {
      const cat = categories.find((c) => c.id === l.categoryId);
      catCount[l.categoryId] = { name: cat?.name ?? l.categoryId, count: 0 };
    }
    catCount[l.categoryId].count++;
  });

  // Narx tahlili
  let pricePosition: string = "malumot_yoq";
  let avgPrice = 0;
  let minPrice = 0;
  let maxPrice = 0;
  let advice: string | null = null;

  if (sameSub.length > 0) {
    const prices = sameSub.map((l) => l.price);
    avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    minPrice = Math.min(...prices);
    maxPrice = Math.max(...prices);

    if (listing.price <= 0) {
      pricePosition = "kelishiladi";
    } else if (listing.price < avgPrice * 0.8) {
      pricePosition = "juda_arzon";
    } else if (listing.price < avgPrice * 0.95) {
      pricePosition = "arzon";
    } else if (listing.price <= avgPrice * 1.05) {
      pricePosition = "orta";
    } else if (listing.price <= avgPrice * 1.2) {
      pricePosition = "qimmatroq";
    } else {
      pricePosition = "juda_qimmat";
    }

    // Oddiy maslahat (AI yo'q bo'lganda)
    const adviceMap: Record<string, string> = {
      juda_arzon: `✅ Narxingiz bozordan ${Math.round((1 - listing.price / avgPrice) * 100)}% arzon. ${Math.round(avgPrice * 0.88).toLocaleString()} so'mga oshirishingiz mumkin — savdo tezligi bir xil bo'ladi.`,
      arzon: `✅ Narxingiz yaxshi — bozor o'rtachasidan (${avgPrice.toLocaleString()} so'm) arzonroq. Tez sotilishi ehtimoli yuqori.`,
      orta: `🟡 Narxingiz bozorga mos — ${avgPrice.toLocaleString()} so'm. Tavsifingizni to'ldiring va rasmlar qo'shing, ko'rinish oshadi.`,
      qimmatroq: `⚠️ Narxingiz o'rtachadan yuqori (bozor: ${avgPrice.toLocaleString()} so'm). Chegirma yoki bonus qo'shing yoki ${Math.round(avgPrice * 1.05).toLocaleString()} so'mga tushiring.`,
      juda_qimmat: `🔴 Narxingiz juda yuqori. Bozor o'rtachasi ${avgPrice.toLocaleString()} so'm, siz ${listing.price.toLocaleString()} so'm so'rayapsiz. Kamida ${Math.round(avgPrice * 1.1).toLocaleString()} so'mga tushiring.`,
      kelishiladi: `🤝 Narx kelishiladi deb belgilangansiz. Taxminiy narx ko'rsatsangiz ko'proq xaridorlar murojaat qiladi.`,
    };
    advice = adviceMap[pricePosition] ?? null;
  } else {
    advice = "Bu subkategoriyada hali e'lonlar kam. Siz dastlabki sotuvchilardan birisiz — bu katta afzallik!";
  }

  // Top kategoriyalar
  const topCategories = Object.values(catCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  res.json({
    listingId: listing.id,
    subcategoryId: listing.subcategoryId,
    totalCompetitors: sameSub.length,
    regionalCompetitors: regional.length,
    avgPrice,
    minPrice,
    maxPrice,
    pricePosition,
    topCategories,
    advice,
  });
});

// GET /listings
router.get("/listings", (req, res) => {
  const {
    categoryId,
    subcategoryId,
    regionId,
    districtId,
    neighborhoodId,
    search,
    minPrice,
    maxPrice,
    sellerLat,
    sellerLng,
    page = "1",
    limit = "20",
  } = req.query as Record<string, string | undefined>;

  let result = listings.filter((l) => l.status === "active");

  if (categoryId) result = result.filter((l) => l.categoryId === categoryId);
  if (subcategoryId) result = result.filter((l) => l.subcategoryId === subcategoryId);
  if (regionId) result = result.filter((l) => l.regionId === regionId);
  if (districtId) result = result.filter((l) => l.districtId === districtId);
  if (neighborhoodId) result = result.filter((l) => l.neighborhoodId === neighborhoodId);
  if (search) {
    // Aqlli fuzzy qidiruv — xato yozilsa ham tushunadi
    const scored = result.map((l) => {
      const cat = categories.find((c) => c.id === l.categoryId);
      const sub = cat?.subcategories.find((s) => s.id === l.subcategoryId);
      const fields = [
        l.title,
        l.titleRu ?? "",
        l.description ?? "",
        cat?.name ?? "",
        sub?.name ?? "",
      ];
      return { listing: l, score: scoreSearch(search, fields) };
    });
    result = scored
      .filter((s) => s.score >= FUZZY_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.listing);
  }
  if (minPrice) result = result.filter((l) => l.price >= Number(minPrice));
  if (maxPrice) result = result.filter((l) => l.price <= Number(maxPrice));

  const total = result.length;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const totalPages = Math.ceil(total / limitNum);

  const lat = sellerLat ? parseFloat(sellerLat) : undefined;
  const lng = sellerLng ? parseFloat(sellerLng) : undefined;

  const paginated = result.slice((pageNum - 1) * limitNum, pageNum * limitNum);
  const items = paginated.map((l) => hydrateListing(l, lat, lng));

  res.json({ items, total, page: pageNum, limit: limitNum, totalPages });
});

// POST /listings
router.post("/listings", authenticateToken, (req: AuthRequest, res) => {
  const body = req.body as {
    title: string;
    titleRu?: string;
    description?: string;
    price: number;
    priceUnit?: string;
    images?: string[];
    categoryId: string;
    subcategoryId?: string;
    regionId: string;
    districtId: string;
    neighborhoodId?: string;
    lat?: number;
    lng?: number;
    sellerType?: 'sotuvchi' | 'ishlab_chiqaruvchi';
    listingType?: 'savdo' | 'xizmat';
    customSubcategoryName?: string;
  };

  // Ro'yhatda yo'q xizmat — AI avtomatik subkategoriya yaratadi
  let resolvedSubcategoryId = body.subcategoryId ?? null;
  let resolvedCategoryId = body.categoryId;

  if (body.customSubcategoryName?.trim()) {
    const sub = ensureSubcategory(body.customSubcategoryName.trim(), body.categoryId);
    resolvedSubcategoryId = sub.id;
    resolvedCategoryId = sub.categoryId; // AI boshqa kategoriyaga o'tkazgan bo'lishi mumkin
  }

  // Ishlab chiqaruvchi bo'lsa admin tasdiqlashiga yuboriladi
  const isManufacturer = body.sellerType === 'ishlab_chiqaruvchi';

  const newListing = {
    id: generateId(),
    title: body.title,
    titleRu: body.titleRu ?? null,
    description: body.description ?? null,
    price: body.price,
    priceUnit: body.priceUnit ?? null,
    images: body.images ?? [],
    categoryId: resolvedCategoryId,
    subcategoryId: resolvedSubcategoryId,
    userId: req.userId!,
    regionId: body.regionId,
    districtId: body.districtId,
    neighborhoodId: body.neighborhoodId ?? null,
    lat: body.lat ?? null,
    lng: body.lng ?? null,
    status: "active" as const,
    sellerType: body.sellerType ?? null,
    listingType: (body.listingType ?? 'savdo') as 'savdo' | 'xizmat',
    elanTur: 'oddiy' as const,
    adminStatus: isManufacturer ? ('pending' as const) : null,
    viewCount: 0,
    createdAt: new Date().toISOString(),
  };

  listings.push(newListing);
  res.status(201).json(hydrateListing(newListing));
});

// GET /listings/user/:userId
router.get("/listings/user/:userId", (req, res) => {
  const { userId } = req.params;
  const result = listings
    .filter((l) => l.userId === userId)
    .map((l) => hydrateListing(l));
  res.json(result);
});

// GET /listings/:id
router.get("/listings/:id", (req, res) => {
  const listing = listings.find((l) => l.id === req.params.id);
  if (!listing) {
    res.status(404).json({ error: "not_found", message: "Listing not found" });
    return;
  }
  listing.viewCount += 1;
  res.json(hydrateListing(listing));
});

// PUT /listings/:id
router.put("/listings/:id", authenticateToken, (req: AuthRequest, res) => {
  const idx = listings.findIndex((l) => l.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "not_found", message: "Listing not found" });
    return;
  }
  if (listings[idx].userId !== req.userId) {
    res.status(403).json({ error: "forbidden", message: "Not your listing" });
    return;
  }
  Object.assign(listings[idx], req.body);
  res.json(hydrateListing(listings[idx]));
});

// DELETE /listings/:id
router.delete("/listings/:id", authenticateToken, (req: AuthRequest, res) => {
  const idx = listings.findIndex((l) => l.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "not_found", message: "Listing not found" });
    return;
  }
  if (listings[idx].userId !== req.userId) {
    res.status(403).json({ error: "forbidden", message: "Not your listing" });
    return;
  }
  listings.splice(idx, 1);
  res.status(204).send();
});

// GET /listings/:id/analyse  — bozor tahlili + AI maslahat
router.get("/listings/:id/analyse", async (req, res) => {
  const listing = listings.find((l) => l.id === req.params.id);
  if (!listing) {
    res.status(404).json({ error: "not_found", message: "Listing not found" });
    return;
  }

  // ── 1. Bir xil subkategoriya e'lonlari (o'zidan tashqari) ──────────────────
  const sameSub = listings.filter(
    (l) => l.id !== listing.id &&
           l.subcategoryId === listing.subcategoryId &&
           l.price > 0 &&
           l.status === "active",
  );
  const regional = sameSub.filter((l) => l.regionId === listing.regionId);

  const prices = sameSub.map((l) => l.price);
  const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  // ── 2. Narx pozitsiyasi ─────────────────────────────────────────────────────
  let pricePosition: string;
  if (listing.price <= 0) {
    pricePosition = "kelishiladi";
  } else if (!prices.length) {
    pricePosition = "malumot_yoq";
  } else if (listing.price < avgPrice * 0.80)  { pricePosition = "juda_arzon"; }
  else if (listing.price < avgPrice * 0.95)    { pricePosition = "arzon"; }
  else if (listing.price <= avgPrice * 1.05)   { pricePosition = "orta"; }
  else if (listing.price <= avgPrice * 1.20)   { pricePosition = "qimmatroq"; }
  else                                          { pricePosition = "juda_qimmat"; }

  // ── 3. Top subkategoriyalar (jami aktiv e'lon soni bo'yicha) ───────────────
  const subCount: Record<string, { name: string; count: number }> = {};
  for (const l of listings.filter((x) => x.status === "active")) {
    if (!l.subcategoryId) continue;
    if (!subCount[l.subcategoryId]) {
      const cat = categories.flatMap((c) => c.subcategories).find((s) => s.id === l.subcategoryId);
      subCount[l.subcategoryId] = { name: cat?.name ?? l.subcategoryId, count: 0 };
    }
    subCount[l.subcategoryId].count++;
  }
  const topCategories = Object.values(subCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((x) => ({ name: x.name, count: x.count }));

  // ── 4. Claude maslahat (API key bo'lsa) ────────────────────────────────────
  let advice: string | null = null;
  if (process.env.ANTHROPIC_API_KEY) {
    const subcat = categories.flatMap((c) => c.subcategories).find((s) => s.id === listing.subcategoryId);
    const cat    = categories.find((c) => c.id === listing.categoryId);
    const region = regions.find((r) => r.id === listing.regionId);
    const seller = listing.sellerType === "ishlab_chiqaruvchi" ? "Ishlab chiqaruvchi" : "Sotuvchi";

    const poz_text: Record<string, string> = {
      juda_arzon:  "Juda arzon (bozordan 20%+ past)",
      arzon:       "Arzon (bozordan 5-20% past)",
      orta:        "O'rtacha (bozorga mos)",
      qimmatroq:   "Qimmatroq (bozordan 5-20% yuqori)",
      juda_qimmat: "Juda qimmat (bozordan 20%+ yuqori)",
      kelishiladi: "Kelishiladi (narx ko'rsatilmagan)",
      malumot_yoq: "Ma'lumot yo'q (bozorda o'xshash e'lon yo'q)",
    };

    const topStr = topCategories.map((t, i) => `${i + 1}. ${t.name} — ${t.count} ta e'lon`).join("\n");

    const prompt = `Sen O'zbekiston savdo bozori bo'yicha tajribali moliyaviy maslahatchi va bozor tahlilchisissan.
O'zbek tilida qisqa, amaliy maslahat ber.

═══ E'LON MA'LUMOTLARI ═══
Kategoriya: ${cat?.name ?? listing.categoryId}
Mahsulot turi: ${subcat?.name ?? listing.subcategoryId}
Sotuvchi turi: ${seller}
Joylashuv: ${region?.name ?? listing.regionId}
Narx: ${listing.price > 0 ? listing.price.toLocaleString() + " so'm" : "Kelishiladi"}
Tavsif: ${listing.description ?? ""}

═══ BOZOR TAHLILI ═══
Shu subkategoriyada raqobatchilar: ${sameSub.length} ta
Shu viloyatda: ${regional.length} ta
Bozor o'rtacha narxi: ${avgPrice.toLocaleString()} so'm
Eng arzon: ${minPrice.toLocaleString()} so'm
Eng qimmat: ${maxPrice.toLocaleString()} so'm
Narx pozitsiyasi: ${poz_text[pricePosition] ?? pricePosition}

═══ ENG KO'P E'LON BERILGAN TOVARLAR ═══
${topStr}

═══ MASLAHAT BERISH QO'LLANMASI ═══
Quyidagi bo'limlarda qisqa va aniq maslahat ber:

1. 💰 NARX TAHLILI — narx bozorga nisbatan qanday? Optimal narx qancha?
2. 📈 SOTUV IMKONIYATI — bu mahsulotga talab qanday? Mavsum bormi?
3. 🏆 RAQOBAT — raqobat qanday? Raqobatchilardan qanday farqlanish mumkin?
4. 💡 3 ta amaliy tavsiya — ${seller} sifatida nima qilish kerak?

Qisqa, aniq, O'zbek tilida. Har bo'lim 2-3 jumladan oshmasin.`;

    try {
      const resp = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 900,
        messages: [{ role: "user", content: prompt }],
      });
      advice = resp.content[0]?.type === "text" ? resp.content[0].text : null;
    } catch (e) {
      console.error("AI analyse error:", e);
    }
  }

  res.json({
    listingId:           listing.id,
    subcategoryId:       listing.subcategoryId,
    totalCompetitors:    sameSub.length,
    regionalCompetitors: regional.length,
    avgPrice,
    minPrice,
    maxPrice,
    pricePosition,
    topCategories,
    advice,
  });
});

export default router;
