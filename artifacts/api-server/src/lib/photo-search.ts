import { createHash } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { appRecords, db } from "@workspace/db";
import { categories, listings, users, type StoredCargoNotification } from "../data/store.js";
import { normalizeUz, scoreSearch } from "../utils/fuzzy.js";
import { deliverStoredNotification } from "./cargo-notifications.js";

export const PHOTO_REQUESTS = "photo_search_requests";
const DEMAND_NOTIFICATIONS = "product_demand_notifications";
export const photoHash = (data: string) => createHash("sha256").update(data).digest("hex");

export function validPhoto(data: unknown, mime: unknown): data is string {
  if (typeof data !== "string" || data.length > 2_800_000 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data)) return false;
  const bytes = Buffer.from(data, "base64");
  if (bytes.length < 12 || bytes.length > 2_097_152) return false;
  return (mime === "image/jpeg" && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) ||
    (mime === "image/png" && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) ||
    (mime === "image/webp" && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP");
}

export function recognizePhoto(raw: string) {
  const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "")) as Record<string, unknown>;
  if (typeof parsed.confidence !== "number" || !Number.isFinite(parsed.confidence) || parsed.confidence < 0 || parsed.confidence > 1) {
    throw new Error("Invalid recognition confidence");
  }
  const category = categories.find(item => item.id === parsed.categoryId);
  if (!category || parsed.confidence < 0.8) return null;
  if (typeof parsed.productName !== "string" || parsed.productName.trim().length < 2 || parsed.productName.length > 120 ||
    !Array.isArray(parsed.keywords) || parsed.keywords.length < 1 || parsed.keywords.length > 4 ||
    parsed.keywords.some(word => typeof word !== "string" || word.trim().length < 2 || word.length > 100)) {
    throw new Error("Invalid product recognition");
  }
  return { productName: parsed.productName.trim(), category, keywords: parsed.keywords as string[] };
}

export function matchPhotoProduct(product: NonNullable<ReturnType<typeof recognizePhoto>>) {
  const matches = listings.filter(item => item.categoryId === product.category.id &&
    item.listingType !== "xizmat" && item.adminStatus !== "pending").map(item => ({
      item,
      score: Math.max(...product.keywords.map(word => scoreSearch(word, [item.title, item.titleRu ?? ""]))),
    })).filter(item => item.score >= 0.8).sort((a, b) => b.score - a.score);
  return {
    listingIds: matches.filter(({ item }) => item.status === "active").slice(0, 30).map(({ item }) => item.id),
    unavailableCount: matches.filter(({ item }) => item.status !== "active").length,
  };
}

export async function notifyCategorySellers(categoryId: string, productName: string, searchingUser: string) {
  const sellerIds = new Set(listings.filter(item => item.categoryId === categoryId && item.listingType !== "xizmat" && item.adminStatus !== "pending")
    .map(item => item.userId));
  // Listing ownership makes someone a seller here; a buyer/driver role can also post goods.
  const recipients = users.filter(user => !user.deleted && user.id !== searchingUser && sellerIds.has(user.id));
  if (!recipients.length) return { notificationStatus: "no_sellers" as const, notifiedSellerCount: 0 };
  // One demand alert per product/category/seller/day, even across users and processes.
  const day = new Date().toISOString().slice(0, 10);
  const productKey = photoHash(`${categoryId}:${normalizeUz(productName)}`);
  const notifications: StoredCargoNotification[] = recipients.map(user => ({
    id: `demand-${photoHash(`${day}:${productKey}:${user.id}`)}`,
    userId: user.id, loadId: null, type: "system", read: false,
    title: "Mahsulotingizga talab bor",
    message: `Mijoz rasm orqali “${productName}” mahsulotini qidirdi. Katalogda mos faol tovar topilmadi. Shu mahsulotingiz bo‘lsa, e’lon joylang yoki mavjud e’loningizni yangilang.`,
    createdAt: new Date().toISOString(),
  }));
  const inserted = await db.transaction(async tx => {
    const result: StoredCargoNotification[] = [];
    for (let i = 0; i < notifications.length; i += 100) {
      const rows = await tx.insert(appRecords).values(notifications.slice(i, i + 100).map(notification => ({
        collection: DEMAND_NOTIFICATIONS, id: notification.id, payload: notification as unknown as Record<string, unknown>,
      }))).onConflictDoNothing().returning();
      result.push(...rows.map(row => row.payload as unknown as StoredCargoNotification));
    }
    return result;
  });
  inserted.forEach(deliverStoredNotification);
  return { notificationStatus: inserted.length ? "sent" as const : "already_sent" as const, notifiedSellerCount: inserted.length };
}

export async function getProductNotifications(userId: string) {
  const rows = await db.select().from(appRecords).where(and(eq(appRecords.collection, DEMAND_NOTIFICATIONS),
    sql`${appRecords.payload}->>'userId' = ${userId}`)).orderBy(sql`${appRecords.payload}->>'createdAt' DESC`).limit(50);
  return rows.map(row => row.payload as unknown as StoredCargoNotification);
}

export async function readProductNotification(userId: string, id: string) {
  const [row] = await db.update(appRecords).set({
    payload: sql`jsonb_set(${appRecords.payload}, '{read}', 'true'::jsonb)`, updatedAt: new Date(),
  }).where(and(eq(appRecords.collection, DEMAND_NOTIFICATIONS), eq(appRecords.id, id),
    sql`${appRecords.payload}->>'userId' = ${userId}`)).returning();
  return row ? row.payload as unknown as StoredCargoNotification : null;
}
