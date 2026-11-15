import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { appRecords, db } from "@workspace/db";
import {
  listings,
  users,
  regions,
  districts,
  neighborhoods,
  sanitizeUser,
  type StoredOrder,
} from "../data/store.js";
import { authenticateToken, type AuthRequest } from "../middleware/auth.js";
import {
  createOrReplayOrder,
  readOrder,
  readOrders,
  changeOrderStatus,
  OrderError,
} from "../lib/orders.js";
import { changeOrderPayment } from "../lib/order-payment.js";

const router = Router();

function hydrateListing(listing: (typeof listings)[0]) {
  const user = users.find((u) => u.id === listing.userId);
  const region = regions.find((r) => r.id === listing.regionId) ?? null;
  const district = districts.find((d) => d.id === listing.districtId) ?? null;
  const neighborhood =
    neighborhoods.find((n) => n.id === listing.neighborhoodId) ?? null;
  return {
    ...listing,
    user: user ? sanitizeUser(user) : null,
    region,
    district,
    neighborhood,
    distanceKm: null,
    distanceColor: null,
  };
}

// ---- Seller card storage (separate collection, never exposed via sanitizeUser) ----
async function getSellerCard(userId: string): Promise<string | null> {
  const [row] = await db
    .select()
    .from(appRecords)
    .where(and(eq(appRecords.collection, "seller_cards"), eq(appRecords.id, userId)));
  const payload = row?.payload as { cardNumber?: string } | undefined;
  return payload?.cardNumber ?? null;
}

async function saveSellerCard(userId: string, cardNumber: string) {
  await db.transaction(async (tx) => {
    const key = and(eq(appRecords.collection, "seller_cards"), eq(appRecords.id, userId));
    const [row] = await tx.select().from(appRecords).where(key).for("update");
    if (row) {
      await tx
        .update(appRecords)
        .set({ payload: { cardNumber } as Record<string, unknown>, updatedAt: new Date() })
        .where(key);
    } else {
      await tx
        .insert(appRecords)
        .values({ collection: "seller_cards", id: userId, payload: { cardNumber } as Record<string, unknown> });
    }
  });
}

async function hydrateOrder(order: StoredOrder, viewerId?: string) {
  const listing = listings.find((l) => l.id === order.listingId);
  const buyer = users.find((u) => u.id === order.buyerId);
  const seller = users.find((u) => u.id === order.sellerId);
  // Seller's card is shown only to this order's buyer.
  const sellerCard =
    viewerId && viewerId === order.buyerId ? await getSellerCard(order.sellerId) : null;
  return {
    ...order,
    paymentStatus: (order as any).paymentStatus ?? "unpaid",
    sellerCard,
    listing: listing ? hydrateListing(listing) : null,
    buyer: buyer ? sanitizeUser(buyer) : null,
    seller: seller ? sanitizeUser(seller) : null,
  };
}

// GET /orders
router.get("/orders", authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const sorted = (await readOrders(userId)).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  res.json(await Promise.all(sorted.map((o) => hydrateOrder(o, userId))));
});

// POST /orders
router.post("/orders", authenticateToken, async (req: AuthRequest, res) => {
  const { listingId, quantity, deliveryOption, deliveryPrice, notes, clientRequestId } =
    (req.body ?? {}) as {
      listingId: string;
      quantity: number;
      deliveryOption?: string;
      deliveryPrice?: number;
      notes?: string;
      clientRequestId?: string;
    };

  if (typeof listingId !== "string" || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 999) {
    res.status(400).json({ error: "validation", message: "Mahsulot va 1 dan 999 gacha butun miqdor kiriting." });
    return;
  }
  if (deliveryPrice != null && (typeof deliveryPrice !== "number" || !Number.isFinite(deliveryPrice) || deliveryPrice < 0)) {
    res.status(400).json({ error: "validation", message: "Yetkazib berish narxi noto‘g‘ri." });
    return;
  }
  if (clientRequestId !== undefined && (typeof clientRequestId !== "string" || !/^[A-Za-z0-9_-]{8,160}$/.test(clientRequestId))) {
    res.status(400).json({ error: "validation", message: "Buyurtma so‘rovi identifikatori noto‘g‘ri." });
    return;
  }
  if ((deliveryOption != null && typeof deliveryOption !== "string") || (notes != null && typeof notes !== "string")) {
    res.status(400).json({ error: "validation", message: "Yetkazish usuli va izoh matn bo‘lishi kerak." });
    return;
  }
  try {
    const result = await createOrReplayOrder(req.userId!, { listingId, quantity, deliveryOption, deliveryPrice, notes, clientRequestId });
    res.status(result.created ? 201 : 200).json(await hydrateOrder(result.order, req.userId));
  } catch (error) {
    if (error instanceof OrderError) { res.status(error.status).json({ error: error.code, message: error.message }); return; }
    req.log?.error("Order write response uncertain; retry with the same client request identity");
    res.status(503).json({ error: "storage_unavailable", message: "Buyurtma javobi aniq emas. Xuddi shu so‘rovni qayta yuboring va buyurtmalaringizni tekshiring." });
  }
});

// GET /orders/:id
router.get("/orders/:id", authenticateToken, async (req: AuthRequest, res) => {
  const order = await readOrder(String(req.params.id));
  if (!order) {
    res.status(404).json({ error: "not_found", message: "Order not found" });
    return;
  }
  if (order.buyerId !== req.userId && order.sellerId !== req.userId) {
    res.status(403).json({ error: "forbidden", message: "Access denied" });
    return;
  }
  res.json(await hydrateOrder(order, req.userId));
});

// PUT /orders/:id/status
router.put("/orders/:id/status", authenticateToken, async (req: AuthRequest, res) => {
  const status = req.body?.status;
  if (!["pending", "confirmed", "delivering", "delivered", "cancelled"].includes(status)) {
    res.status(400).json({ error: "validation", message: "Buyurtma holati noto‘g‘ri." });
    return;
  }
  try {
    res.json(await hydrateOrder(await changeOrderStatus(String(req.params.id), req.userId!, status), req.userId));
  } catch (error) {
    if (error instanceof OrderError) { res.status(error.status).json({ error: error.code, message: error.message }); return; }
    throw error;
  }
});

// PUT /orders/:id/payment
const PAYMENT_ACTIONS = ["claim_paid", "choose_cash", "confirm_paid", "reject_paid"];
router.put("/orders/:id/payment", authenticateToken, async (req: AuthRequest, res) => {
  const action = req.body?.action;
  if (typeof action !== "string" || !PAYMENT_ACTIONS.includes(action)) {
    res.status(400).json({ error: "validation", message: "To‘lov amali noto‘g‘ri." });
    return;
  }
  try {
    const updated = await changeOrderPayment(String(req.params.id), req.userId!, action as any);
    res.json(await hydrateOrder(updated, req.userId));
  } catch (error) {
    if (error instanceof OrderError) { res.status(error.status).json({ error: error.code, message: error.message }); return; }
    throw error;
  }
});

// GET /me/card  (own card only)
router.get("/me/card", authenticateToken, async (req: AuthRequest, res) => {
  res.json({ cardNumber: await getSellerCard(req.userId!) });
});

// PUT /me/card
router.put("/me/card", authenticateToken, async (req: AuthRequest, res) => {
  const raw = req.body?.cardNumber;
  const digits = typeof raw === "string" ? raw.replace(/\D/g, "") : "";
  if (digits.length !== 16) {
    res.status(400).json({ error: "validation", message: "Karta raqami 16 ta raqamdan iborat boʻlishi kerak." });
    return;
  }
  const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  await saveSellerCard(req.userId!, formatted);
  res.json({ cardNumber: formatted });
});

export default router;
    
