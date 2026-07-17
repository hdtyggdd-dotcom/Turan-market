import { Router } from "express";
import {
  users,
  generateId,
  generateToken,
  sanitizeUser,
} from "../data/store.js";
import { authenticateToken, type AuthRequest } from "../middleware/auth.js";

const router = Router();

// POST /auth/register
router.post("/auth/register", (req, res) => {
  const { phone, name, password, role, regionId, districtId, neighborhoodId } =
    req.body as {
      phone: string;
      name: string;
      password: string;
      role: string;
      regionId?: string;
      districtId?: string;
      neighborhoodId?: string;
    };

  if (!phone || !name || !password || !role) {
    res.status(400).json({ error: "validation", message: "All fields required" });
    return;
  }

  const existing = users.find((u) => u.phone === phone);
  if (existing) {
    res
      .status(400)
      .json({ error: "conflict", message: "Phone number already registered" });
    return;
  }

  const newUser = {
    id: generateId(),
    phone,
    name,
    password,
    role: role as "buyer" | "seller" | "driver" | "admin",
    sellerBadge: null as null,
    verificationStatus: "none" as const,
    regionId: regionId ?? null,
    districtId: districtId ?? null,
    neighborhoodId: neighborhoodId ?? null,
    rating: null,
    totalSales: 0,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);

  const token = generateToken(newUser.id);
  res.status(201).json({ token, user: sanitizeUser(newUser) });
});

// POST /auth/login
router.post("/auth/login", (req, res) => {
  const { phone, password } = req.body as { phone: string; password: string };

  const user = users.find((u) => u.phone === phone);
  if (!user || user.password !== password) {
    res.status(401).json({ error: "unauthorized", message: "Invalid phone or password" });
    return;
  }

  const token = generateToken(user.id);
  res.json({ token, user: sanitizeUser(user) });
});

// GET /auth/me
router.get("/auth/me", authenticateToken, (req: AuthRequest, res) => {
  const user = users.find((u) => u.id === req.userId);
  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }
  res.json(sanitizeUser(user));
});

export default router;
