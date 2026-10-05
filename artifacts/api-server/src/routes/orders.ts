import { Router } from "express";
import { createHash } from "node:crypto";
import {
  orders,
  listings,
  users,
  regions,
  districts,
  neighborhoods,
  generateId,
  sanitizeUser,
  type StoredOrder,
} from "../data/store.js";
import { authenticateToken, type AuthRequest } from "../middleware/auth.js";
import { persistItem } from "../lib/persistence.js";

const router = Router();
const pendingOrderWrites = new Map<string, Promise<StoredOrder>>();

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

function hydrateOrder(order: (typeof orders)[0]) {
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
router.get("/orders", authenticateToken, (req: AuthRequest, res) => {
  const userId = req.userId!;
  const result = orders
    .filter((o) => o.buyerId === userId || o.sellerId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(hydrateOrder);
  res.json(result);
});

// POST /orders
router.post("/orders", authenticateToken, async (req: AuthRequest, res) => {
  const { listingId, quantity, deliveryOption, deliveryPrice, notes, clientRequestId } =
    req.body as {
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
  if (deliveryPrice !== undefined && (typeof deliveryPrice !== "number" || !Number.isFinite(deliveryPrice) || deliveryPrice < 0)) {
    res.status(400).json({ error: "validation", message: "Yetkazib berish narxi noto‘g‘ri." });
    return;
  }
  if (clientRequestId !== undefined && (typeof clientRequestId !== "string" || !/^[A-Za-z0-9_-]{8,160}$/.test(clientRequestId))) {
    res.status(400).json({ error: "validation", message: "Buyurtma so‘rovi identifikatori noto‘g‘ri." });
    return;
  }
  const orderId = clientRequestId
    ? `cart_${createHash("sha256").update(`${req.userId}:${clientRequestId}`).digest("hex")}`
    : generateId();
  const pending = pendingOrderWrites.get(orderId);
  const existing = orders.find((order) => order.id === orderId) ?? (pending ? await pending : undefined);
  if (existing) {
    if (existing.buyerId !== req.userId || existing.listingId !== listingId || existing.quantity !== quantity ||
        existing.deliveryOption !== (deliveryOption ?? null) || existing.deliveryPrice !== (deliveryPrice ?? null) ||
        existing.notes !== (notes ?? null)) {
      res.status(409).json({ error: "request_conflict", message: "Bu so‘rov oldin boshqa ma’lumot bilan yuborilgan." });
      return;
    }
    res.json(hydrateOrder(existing));
    return;
  }

  const listing = listings.find((l) => l.id === listingId);
  if (!listing) {
    res.status(404).json({ error: "not_found", message: "Listing not found" });
    return;
  }
  if (listing.userId === req.userId) {
    res.status(403).json({ error: "forbidden", message: "O‘z mahsulotingizga buyurtma bera olmaysiz." });
    return;
  }
  if (listing.status !== "active") {
    res.status(409).json({ error: "unavailable", message: "Mahsulot hozir sotuvda emas." });
    return;
  }

  const newOrder = {
    id: orderId,
    listingId,
    buyerId: req.userId!,
    sellerId: listing.userId,
    quantity,
    totalPrice: listing.price * quantity,
    deliveryOption: deliveryOption ?? null,
    deliveryPrice: deliveryPrice ?? null,
    status: "pending" as const,
    notes: notes ?? null,
    createdAt: new Date().toISOString(),
  };

  const write = persistItem("orders", newOrder).then(() => {
    orders.push(newOrder);
    return newOrder;
  });
  pendingOrderWrites.set(orderId, write);
  try {
    await write;
    res.status(201).json(hydrateOrder(newOrder));
  } finally {
    pendingOrderWrites.delete(orderId);
  }
});

// GET /orders/:id
router.get("/orders/:id", authenticateToken, (req: AuthRequest, res) => {
  const order = orders.find((o) => o.id === req.params.id);
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
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) {
    res.status(404).json({ error: "not_found", message: "Order not found" });
    return;
  }
  if (order.sellerId !== req.userId && order.buyerId !== req.userId) {
    res.status(403).json({ error: "forbidden", message: "Access denied" });
    return;
  }
  order.status = req.body.status;
  await persistItem("orders", order);
  res.json(hydrateOrder(order));
});

export default router;
