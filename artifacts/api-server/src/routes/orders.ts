import { Router } from "express";
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
import { createOrReplayOrder, readOrder, readOrders, changeOrderStatus, OrderError } from "../lib/orders.js";

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

function hydrateOrder(order: StoredOrder) {
  const listing = listings.find((l) => l.id === order.listingId);
  const buyer = users.find((u) => u.id === order.buyerId);
  const seller = users.find((u) => u.id === order.sellerId);
  return {
    ...order,
    listing: listing ? hydrateListing(listing) : null,
    buyer: buyer ? sanitizeUser(buyer) : null,
    seller: seller ? sanitizeUser(seller) : null,
  };
}

// GET /orders
router.get("/orders", authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const result = (await readOrders(userId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(hydrateOrder);
  res.json(result);
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
    res.status(400).json({ error: "validation", message: "Yetkazish usuli va izoh matn bo‘lishi kerak." }); return;
  }
  try {
    const result = await createOrReplayOrder(req.userId!, { listingId, quantity, deliveryOption, deliveryPrice, notes, clientRequestId });
    res.status(result.created ? 201 : 200).json(hydrateOrder(result.order));
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
  res.json(hydrateOrder(order));
});

// PUT /orders/:id/status
router.put("/orders/:id/status", authenticateToken, async (req: AuthRequest, res) => {
  const status = req.body?.status;
  if (!["pending", "confirmed", "delivering", "delivered", "cancelled"].includes(status)) {
    res.status(400).json({ error: "validation", message: "Buyurtma holati noto‘g‘ri." }); return;
  }
  try { res.json(hydrateOrder(await changeOrderStatus(String(req.params.id), req.userId!, status))); }
  catch (error) {
    if (error instanceof OrderError) { res.status(error.status).json({ error: error.code, message: error.message }); return; }
    throw error;
  }
});

export default router;
