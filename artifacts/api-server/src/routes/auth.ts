import { Router } from "express";
import {
  driverProfiles,
  districts,
  regions,
  users,
  generateId,
  generateToken,
  sanitizeUser,
  vehicleTypes,
  verifyPassword,
} from "../data/store.js";
import { authenticateToken, type AuthRequest } from "../middleware/auth.js";
import { deleteItem as defaultDeleteItem, persistItem as defaultPersistItem } from "../lib/persistence.js";

export function createAuthRouter(persistItem = defaultPersistItem, deleteItem = defaultDeleteItem) {
const router = Router();

// POST /auth/register
router.post("/auth/register", async (req, res) => {
  const { phone, name, password, role, regionId, districtId, neighborhoodId, signInExisting } =
    req.body as {
      phone: string;
      name: string;
      password: string;
      role: string;
      regionId?: string;
      districtId?: string;
      neighborhoodId?: string;
      signInExisting?: boolean;
    };

  if (typeof phone !== "string" || typeof name !== "string" || typeof password !== "string" || typeof role !== "string" || !phone || !name.trim() || !password || !role) {
    res.status(400).json({ error: "validation", message: "All fields required" });
    return;
  }

  const existing = users.find((u) => u.phone === phone && !u.deleted);
  if (existing) {
    if (signInExisting === true) {
      if (!verifyPassword(password, existing.password)) {
        res.status(401).json({ error: "unauthorized", message: "Telefon raqam yoki parol noto‘g‘ri." });
        return;
      }
      // Sign in without replacing the existing identity, role, or saved data.
      res.json({ token: generateToken(existing.id), user: sanitizeUser(existing) });
      return;
    }
    res
      .status(400)
      .json({ error: "conflict", message: "Phone number already registered" });
    return;
  }
  if (!["buyer", "seller", "driver"].includes(role)) {
    res.status(400).json({ error: "validation", message: "Invalid account role" });
    return;
  }
  if (signInExisting === true) {
    const region = regions.find((item) => item.id === regionId);
    const validDistrict = region && (districts.some((item) => item.id === districtId && item.regionId === region.id) ||
      (region.countryId !== "uz" && districtId === region.id));
    if (!region || !validDistrict) {
      res.status(400).json({ error: "location_required", message: "GPS orqali joylashuvni aniqlang yoki viloyat va tumanni tanlang." });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "validation", message: "Parol kamida 6 ta belgidan iborat bo‘lsin." });
      return;
    }
  }
  if (role === "driver" && (!regionId || !regions.some((region) => region.id === regionId))) {
    res.status(400).json({ error: "validation", message: "Drivers must provide a valid current region" });
    return;
  }
  if (role === "driver" && !vehicleTypes.some((vehicle) => vehicle.supportedCargoTypes.includes("general"))) {
    res.status(500).json({ error: "configuration", message: "No general cargo vehicle type is configured" });
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

  const defaultVehicle = vehicleTypes
    .filter((vehicle) => vehicle.supportedCargoTypes.includes("general"))
    .sort((a, b) => a.capacityKg - b.capacityKg || a.capacityM3 - b.capacityM3)[0];
  const driverProfile = role === "driver" ? {
    id: generateId(), userId: newUser.id, vehicleTypeId: defaultVehicle!.id, vehiclePlate: "PENDING",
    availableFrom: new Date().toISOString(), currentRegionId: regionId!, rating: 0, ratingCount: 0,
    completedTrips: 0, sharedLoadAvailableKg: 0, sharedLoadAvailableM3: 0, bio: null,
    capacityKg: 0, capacityM3: 0, reviewStatus: "none" as const, reviewReason: null,
    revision: 0, documents: [], reviewHistory: [], ratingHistory: [],
  } : null;

  try {
    await persistItem("users", newUser);
    if (driverProfile) await persistItem("driver_profiles", driverProfile);
    users.push(newUser);
    if (driverProfile) driverProfiles.push(driverProfile);
  } catch {
    await deleteItem("users", newUser.id).catch(() => {});
    if (driverProfile) await deleteItem("driver_profiles", driverProfile.id).catch(() => {});
    res.status(500).json({ error: "registration_failed", message: "Unable to create user profile" });
    return;
  }

  const token = generateToken(newUser.id);
  res.status(201).json({ token, user: sanitizeUser(newUser) });
});

// POST /auth/login
router.post("/auth/login", (req, res) => {
  const { phone, password } = req.body as { phone: string; password: string };

  const user = users.find((u) => u.phone === phone && !u.deleted);
  if (!user || !verifyPassword(password, user.password)) {
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

return router;
}

export default createAuthRouter();
