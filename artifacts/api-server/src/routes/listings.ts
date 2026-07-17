import { Router } from "express";
import {
  listings,
  users,
  regions,
  districts,
  neighborhoods,
  generateId,
  sanitizeUser,
  calculateDistance,
  getDistanceColor,
} from "../data/store.js";
import { authenticateToken, type AuthRequest } from "../middleware/auth.js";

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

  return {
    ...listing,
    user: user ? sanitizeUser(user) : null,
    region,
    district,
    neighborhood,
    distanceKm,
    distanceColor,
  };
}

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
    const q = search.toLowerCase();
    result = result.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        (l.titleRu ?? "").toLowerCase().includes(q) ||
        (l.description ?? "").toLowerCase().includes(q),
    );
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
  };

  const newListing = {
    id: generateId(),
    title: body.title,
    titleRu: body.titleRu ?? null,
    description: body.description ?? null,
    price: body.price,
    priceUnit: body.priceUnit ?? null,
    images: body.images ?? [],
    categoryId: body.categoryId,
    subcategoryId: body.subcategoryId ?? null,
    userId: req.userId!,
    regionId: body.regionId,
    districtId: body.districtId,
    neighborhoodId: body.neighborhoodId ?? null,
    lat: body.lat ?? null,
    lng: body.lng ?? null,
    status: "active" as const,
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

export default router;
