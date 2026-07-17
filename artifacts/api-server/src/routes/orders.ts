import { Router } from "express";
import {
  orders,
  listings,
  users,
  regions,
  districts,
  neighborhoods,
  generateId,
  sanitizeUser,
} from "../data/store.js";
import { authenticateToken, type AuthRequest } from "../middleware/auth.js";

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
router.post("/orders", authenticateToken, (req: AuthRequest, res) => {
  const { listingId, quantity, deliveryOption, deliveryPrice, notes } =
    req.body as {
      listingId: string;
      quantity: number;
      deliveryOption?: string;
      deliveryPrice?: number;
      notes?: string;
    };

  const listing = listings.find((l) => l.id === listingId);
  if (!listing) {
    res.status(404).json({ error: "not_found", message: "Listing not found" });
    return;
  }

  const newOrder = {
    id: generateId(),
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

  orders.push(newOrder);
  res.status(201).json(hydrateOrder(newOrder));
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
router.put("/orders/:id/status", authenticateToken, (req: AuthRequest, res) => {
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
  res.json(hydrateOrder(order));
});

export default router;
