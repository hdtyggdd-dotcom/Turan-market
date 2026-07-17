import { Router } from "express";
import { users } from "../data/store.js";
import { authenticateToken, type AuthRequest } from "../middleware/auth.js";

const router = Router();

// POST /sellers/:id/verify
router.post("/sellers/:id/verify", authenticateToken, (req: AuthRequest, res) => {
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
    res.json({
      status: "pending",
      message:
        "Ishlab chiqaruvchi so'rovi qabul qilindi. Admin ko'rib chiqadi.",
    });
  } else {
    user.sellerBadge = "reseller";
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
router.put("/users/:id", authenticateToken, (req: AuthRequest, res) => {
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
  if (name) user.name = name;
  if (regionId !== undefined) user.regionId = regionId;
  if (districtId !== undefined) user.districtId = districtId;
  if (neighborhoodId !== undefined) user.neighborhoodId = neighborhoodId;
  const { password: _pw, ...safe } = user;
  res.json(safe);
});

export default router;
