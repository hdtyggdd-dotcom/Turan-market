import { Router } from "express";
import { listings, users, orders, categories } from "../data/store.js";

const router = Router();

// GET /stats/summary
router.get("/stats/summary", (_req, res) => {
  const activeListings = listings.filter((l) => l.status === "active").length;

  const categoryCounts: Record<string, number> = {};
  for (const listing of listings) {
    categoryCounts[listing.categoryId] =
      (categoryCounts[listing.categoryId] ?? 0) + 1;
  }

  const topCategories = categories
    .map((cat) => ({
      categoryId: cat.id,
      name: cat.name,
      count: categoryCounts[cat.id] ?? 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  res.json({
    totalListings: listings.length,
    totalUsers: users.length,
    totalOrders: orders.length,
    activeListings,
    topCategories,
  });
});

export default router;
