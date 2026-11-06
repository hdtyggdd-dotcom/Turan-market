import { Router } from "express";
import { users, regions, districts, sanitizeUser } from "../data/store.js";
import { authenticateToken, type AuthRequest } from "../middleware/auth.js";
import { persistItem } from "../lib/persistence.js";

const router = Router();

// POST /sellers/:id/verify
router.post("/sellers/:id/verify", authenticateToken, async (req: AuthRequest, res) => {
  const { id } = req.params;
  if (id !== req.userId) {
    res.status(403).json({ error: "forbidden", message: "Can only verify your own account" });
    return;
  }

  const user = users.find((u) => u.id === id);
  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }

  const { isManufacturer } = req.body as { isManufacturer: boolean };

  if (isManufacturer) {
    user.verificationStatus = "pending";
    await persistItem("users", user);
    res.json({
      status: "pending",
      message:
        "Ishlab chiqaruvchi so'rovi qabul qilindi. Admin ko'rib chiqadi.",
    });
  } else {
    user.sellerBadge = "reseller";
    await persistItem("users", user);
    res.json({
      status: "approved",
      message: "Sotuvchi sifatida ro'yxatdan o'tdingiz.",
    });
  }
});

// GET /users/:id
router.get("/users/:id", (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }
  const { password: _pw, ...safe } = user;
  res.json(safe);
});

// PUT /users/:id
router.put("/users/:id", authenticateToken, async (req: AuthRequest, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }
  if (user.id !== req.userId) {
    res.status(403).json({ error: "forbidden", message: "Access denied" });
    return;
  }
  const { name, regionId, districtId, neighborhoodId } = req.body as {
    name?: string;
    regionId?: string;
    districtId?: string;
    neighborhoodId?: string;
  };
  if (name !== undefined && (typeof name !== "string" || !name.trim())) {
    res.status(400).json({ error: "validation", message: "Ismni kiriting." });
    return;
  }
  const nextRegionId = regionId === undefined ? user.regionId : regionId;
  const nextDistrictId = districtId === undefined ? user.districtId : districtId;
  if (regionId !== undefined || districtId !== undefined) {
    const region = regions.find(item => item.id === nextRegionId);
    if (!region || !(districts.some(item => item.id === nextDistrictId && item.regionId === region.id) ||
      (region.countryId !== "uz" && nextDistrictId === region.id))) {
      res.status(400).json({ error: "location_required", message: "Tanlangan viloyatga tegishli tumanni tanlang." });
      return;
    }
  }
  const next = { ...user, ...(name !== undefined ? { name: name.trim() } : {}),
    regionId: nextRegionId, districtId: nextDistrictId,
    ...(neighborhoodId !== undefined ? { neighborhoodId } : {}) };
  try {
    await persistItem("users", next);
    Object.assign(user, next);
    res.json(sanitizeUser(user));
  } catch {
    res.status(500).json({ error: "profile_update_failed", message: "Ma’lumotlar saqlanmadi. Qayta urinib ko‘ring." });
  }
});

export default router;
