/**
 * autoCategory.ts
 * Yangi xizmat/tovar nomini tahlil qilib, eng mos kategoriyani topadi
 * va kerak bo'lsa yangi subkategoriya yaratadi.
 */

import { categories, generateId, type StoredSubcategory } from "../data/store.js";
import { normalizeUz } from "./fuzzy.js";

// Har bir kategoriya uchun kalit so'zlar
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  cat1: [
    "sigir", "qoy", "echki", "tuya", "ot", "eshak", "tovuq", "o'rdak", "g'oz",
    "hayvon", "chorva", "qoramol", "paranda", "it", "mushuk", "kabutar", "baliq",
    "buzoq", "ho'kiz", "qo'zi", "asalari", "zotli", "mol", "podasi", "suruvchi",
  ],
  cat2: [
    "g'isht", "sement", "armatura", "shifer", "qum", "shag'al", "ohak", "taxta",
    "qurilish", "beton", "paxsa", "temir", "mis", "alyuminiy", "shpagilovka",
    "bo'yoq", "lak", "gips", "krovel", "ruberoid", "kirpich",
  ],
  cat3: [
    "avtomobil", "mashina", "traktor", "kombain", "skuter", "moped", "velosiped",
    "muravey", "texnika", "yuk", "avto", "transport", "moto", "motosikl", "mototsikl",
    "ekskavator", "buldozer", "kran", "kamaz", "truck",
  ],
  cat4: [
    "zapchast", "ehtiyot", "motor", "dvigatel", "gidravlika", "elektr", "rezina",
    "shina", "disk", "akkumulyator", "filter", "moy", "yog'", "tormoz", "karbyurator",
    "nasос", "nasos", "qism", "detal",
  ],
  cat5: [
    "urug'", "ko'chat", "o'g'it", "sabzavot", "meva", "don", "bug'doy", "arpa",
    "sholi", "guruch", "makkajo'xori", "paxta", "kartoshka", "piyoz", "lavlagi",
    "qovun", "tarvuz", "olma", "nok", "uzum", "o'rik", "pestitsid", "dori",
    "em-xashak", "pichan", "somon", "asalari", "asal",
  ],
  cat6: [
    "antik", "antikvar", "eski", "qadimiy", "vintage", "kollektsiya", "noyob",
    "tarixi", "medal", "tanga", "pul", "qadimgi", "muzey",
  ],
  cat7: [
    "xizmat", "usta", "ta'mir", "sartarosh", "soch", "chilangar", "qulf", "kalit",
    "santexnik", "quvur", "suv", "kanalizatsiya", "asfalt", "yo'l", "elektrik",
    "tok", "sim", "duradgor", "yog'och", "stol", "eshik", "deraza", "pechka",
    "pechkachi", "bo'yoqchi", "payvandchi", "pay", "tozalash", "tozalash",
    "konditsioner", "sovutgich", "kir", "kiyim", "tikuvchi", "tikuvchilik",
    "haydovchi", "taksi", "yuk tashish", "ko'chirish", "kotib", "murabbiyi",
    "repetitor", "o'qituvchi", "shifokor", "doktor", "maslahat", "konsultatsiya",
    "dizayn", "dasturchi", "kompyuter", "telefon", "smartfon", "ta'mirlash",
    "qorovul", "xavfsizlik", "hovli", "bog'", "ariq", "haydaladigan", "haydash",
    "drone", "agro", "dron", "sugʻorish", "sugorish",
  ],
  cat8: [
    "uy", "kvartira", "xona", "hovli", "uchastka", "er", "arenda", "ijara",
    "sotiladi", "garaj", "ombor", "ofis", "do'kon", "magazin", "bozor",
    "ko'chmas mulk", "apartment",
  ],
  cat15: [
    "sanoat", "ishlab chiqarish", "zavod", "fabrika", "sex", "stanok", "uskuna",
    "metall", "plastmassa", "polimer", "tekstil", "tikuvchilik", "qadoqlash",
    "kimyo", "yog'och", "ishlab chiqaruvchi", "mahsulot ishlab chiqarish",
  ],
  cat16: [
    "optom", "ulgurji", "b2b", "partiya", "partiyalar", "korxona", "distribyutor",
    "import", "eksport", "diler", "katta hajm", "wholesale", "bulk",
  ],
  cat17: [
    "ishlatilgan", "eski", "b/u", "second hand", "second-hand", "podderjanniy",
    "avval ishlatilgan", "arzon ishlatilgan",
  ],
};

/**
 * Matnga mos keladigan kategoriyani toptiradi.
 * Qaytaradi: { categoryId, score } yoki eng kamida cat7 (xizmatlar)
 */
export function findSpecialSubcategory(text: string): string | undefined {
  const norm = normalizeUz(text.toLowerCase());
  const tokens = norm.match(/[\p{L}\p{N}]+/gu) ?? [];
  const hasLabel = (labels: string[]) => tokens.some((word, index) =>
    labels.includes(word) && tokens[index + 1] !== "emas" && tokens[index + 1] !== "yoq" &&
    tokens[index - 1] !== "не",
  );
  // Condition labels take precedence over product words such as "telefon".
  if (hasLabel(["shikastlangan", "shkaslangan", "shikastli", "singan", "nuqsonli", "nosoz", "defektli", "поврежденный", "повреждённый", "неисправный"])) return "sub18_damaged";
  if (hasLabel(["aksiya", "aksiyada", "aksiyadagi", "chegirma", "chegirmali", "chegirmada", "скидка", "акция", "распродажа"])) return "sub18_sale";
  return undefined;
}

export function findBestCategory(text: string): string {
  if (findSpecialSubcategory(text)) return "cat18";
  const norm = normalizeUz(text.toLowerCase());
  const words = norm.split(/\s+/);

  let bestCatId = "cat7"; // default — maishiy xizmatlar
  let bestScore = 0;

  for (const [catId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const word of words) {
      for (const kw of keywords) {
        if (kw.includes(word) || word.includes(kw)) {
          score += word.length >= 3 ? 2 : 1;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCatId = catId;
    }
  }

  return bestCatId;
}

/**
 * Yangi subkategoriya yaratadi (agar mavjud bo'lmasa).
 * Avval o'xshash nomli subkategoriyani qidiradi.
 */
export function ensureSubcategory(
  customName: string,
  preferCategoryId?: string,
): StoredSubcategory {
  const norm = normalizeUz(customName.toLowerCase());

  // 1. Barcha subkategoriyalarda o'xshash nom bormi?
  for (const cat of categories) {
    for (const sub of cat.subcategories) {
      if (normalizeUz(sub.name.toLowerCase()) === norm) {
        return sub; // mavjud — qayta ishlatamiz
      }
    }
  }

  // 2. Eng mos kategoriyani aniqlaymiz
  const categoryId = preferCategoryId ?? findBestCategory(customName);
  const category = categories.find((c) => c.id === categoryId)
    ?? categories.find((c) => c.id === "cat7")!;

  // 3. Yangi subkategoriya yaratamiz
  const newSub: StoredSubcategory = {
    id: "sub_auto_" + generateId(),
    name: customName.trim(),
    nameRu: customName.trim(), // Ruscha tarjima yo'q — foydalanuvchi kiritgan nom
    categoryId: category.id,
    bookingMode: "showcase",
  };

  category.subcategories.push(newSub);

  console.log(`[autoCategory] Yangi subkategoriya: "${newSub.name}" → ${category.name} (${category.id})`);
  return newSub;
}
