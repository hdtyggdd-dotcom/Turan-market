import { Router } from "express";
import {
  cargoLoads,
  cargoOffers,
  districts,
  driverProfiles,
  generateId,
  sanitizeUser,
  type CargoType,
  type StoredCargoLoad,
  type StoredCargoOffer,
  users,
  vehicleTypes,
} from "../data/store.js";
import { authenticateToken, type AuthRequest } from "../middleware/auth.js";
import { persistItem } from "../lib/persistence.js";

const router = Router();
const cargoTypes: CargoType[] = ["general", "fragile", "perishable", "livestock", "hazardous", "construction"];

function rawParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

function recommendedVehicle(cargoType: CargoType, weightKg: number, volumeM3: number) {
  const eligible = vehicleTypes.filter(
    (vehicle) =>
      vehicle.supportedCargoTypes.includes(cargoType) &&
      vehicle.capacityKg >= weightKg &&
      vehicle.capacityM3 >= volumeM3,
  );
  return eligible.sort((a, b) => a.capacityKg - b.capacityKg || a.capacityM3 - b.capacityM3)[0];
}

function recommendation(load: Pick<StoredCargoLoad, "cargoType" | "weightKg" | "volumeM3">) {
  const vehicleType = recommendedVehicle(load.cargoType, load.weightKg, load.volumeM3);
  if (!vehicleType) return null;
  return {
    vehicleType,
    reason: `${load.cargoType} yuki uchun ${load.weightKg} kg va ${load.volumeM3} m³ sig‘imga mos eng kichik transport tanlandi.`,
    source: "deterministic_fallback" as const,
  };
}

function maskedPhone(phone: string): string {
  const visible = phone.slice(-4);
  return `${"*".repeat(Math.max(0, phone.length - visible.length))}${visible}`;
}

function hydrateDriver(profile: (typeof driverProfiles)[number], revealPrivateDetails = false) {
  const user = users.find((item) => item.id === profile.userId);
  const vehicleType = vehicleTypes.find((item) => item.id === profile.vehicleTypeId);
  const sanitizedDriver = user ? sanitizeUser(user) : null;
  return {
    ...profile,
    user: sanitizedDriver
      ? {
          ...sanitizedDriver,
          phone: revealPrivateDetails
            ? sanitizedDriver.phone
            : maskedPhone(sanitizedDriver.phone),
          regionId: revealPrivateDetails ? sanitizedDriver.regionId : null,
          districtId: revealPrivateDetails ? sanitizedDriver.districtId : null,
          neighborhoodId: revealPrivateDetails ? sanitizedDriver.neighborhoodId : null,
          region: revealPrivateDetails ? sanitizedDriver.region : null,
          district: revealPrivateDetails ? sanitizedDriver.district : null,
          neighborhood: revealPrivateDetails ? sanitizedDriver.neighborhood : null,
        }
      : null,
    vehicleType: vehicleType ?? null,
  };
}

function hydrateOffer(offer: StoredCargoOffer, revealDriverPhone = false) {
  const driver = driverProfiles.find((item) => item.id === offer.driverId);
  return {
    ...offer,
    driver: driver ? hydrateDriver(driver, revealDriverPhone) : null,
  };
}

function isOperationalDriver(profile: (typeof driverProfiles)[number]): boolean {
  const user = users.find((item) => item.id === profile.userId);
  return (
    user?.verificationStatus === "approved" &&
    profile.vehiclePlate.trim().length > 0 &&
    profile.vehiclePlate !== "PENDING"
  );
}

function canViewPrivateLoadDetails(load: StoredCargoLoad, requesterId?: string): boolean {
  if (!requesterId) return false;
  if (load.shipperId === requesterId) return true;
  const acceptedOffer = cargoOffers.find(
    (offer) => offer.loadId === load.id && offer.status === "accepted",
  );
  const acceptedDriver = driverProfiles.find(
    (profile) => profile.id === acceptedOffer?.driverId,
  );
  return acceptedDriver?.userId === requesterId;
}

function hydrateLoad(load: StoredCargoLoad, requesterId?: string) {
  const shipper = users.find((item) => item.id === load.shipperId);
  const revealPrivateDetails = canViewPrivateLoadDetails(load, requesterId);
  const sanitizedShipper = shipper ? sanitizeUser(shipper) : null;
  return {
    ...load,
    pickupAddress: revealPrivateDetails ? load.pickupAddress : null,
    deliveryAddress: revealPrivateDetails ? load.deliveryAddress : null,
    shipper: sanitizedShipper
      ? {
          ...sanitizedShipper,
          phone: revealPrivateDetails ? sanitizedShipper.phone : maskedPhone(sanitizedShipper.phone),
          regionId: revealPrivateDetails ? sanitizedShipper.regionId : null,
          districtId: revealPrivateDetails ? sanitizedShipper.districtId : null,
          neighborhoodId: revealPrivateDetails ? sanitizedShipper.neighborhoodId : null,
          region: revealPrivateDetails ? sanitizedShipper.region : null,
          district: revealPrivateDetails ? sanitizedShipper.district : null,
          neighborhood: revealPrivateDetails ? sanitizedShipper.neighborhood : null,
        }
      : null,
  };
}

function validCargoInput(body: Record<string, unknown>): body is Record<string, unknown> & {
  title: string; cargoType: CargoType; weightKg: number; volumeM3: number; pickupRegionId: string; pickupDistrictId: string; deliveryRegionId: string; deliveryDistrictId: string; pickupDate: string; sharedLoadAllowed: boolean;
} {
  return typeof body.title === "string" && body.title.trim().length > 0 &&
    typeof body.cargoType === "string" && cargoTypes.includes(body.cargoType as CargoType) &&
    typeof body.weightKg === "number" && body.weightKg > 0 &&
    typeof body.volumeM3 === "number" && body.volumeM3 > 0 &&
    typeof body.pickupRegionId === "string" && typeof body.pickupDistrictId === "string" &&
    typeof body.deliveryRegionId === "string" && typeof body.deliveryDistrictId === "string" &&
    typeof body.pickupDate === "string" && validFutureOrTodayDate(body.pickupDate) && typeof body.sharedLoadAllowed === "boolean";
}

function validFutureOrTodayDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return false;
  return value >= new Date().toISOString().slice(0, 10);
}

function hasActionablePickupDate(load: StoredCargoLoad): boolean {
  return validFutureOrTodayDate(load.pickupDate);
}

router.get("/cargo-loads", authenticateToken, (req: AuthRequest, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const pickupRegionId = typeof req.query.pickupRegionId === "string" ? req.query.pickupRegionId : undefined;
  const deliveryRegionId = typeof req.query.deliveryRegionId === "string" ? req.query.deliveryRegionId : undefined;
  const mine = req.query.mine === "true";
  res.json(cargoLoads.filter((load) =>
    (!status || load.status === status) &&
    (!pickupRegionId || load.pickupRegionId === pickupRegionId) &&
    (!deliveryRegionId || load.deliveryRegionId === deliveryRegionId) &&
    (!mine || load.shipperId === req.userId) &&
    ((load.status !== "open" && load.status !== "negotiating") || hasActionablePickupDate(load)),
  ).map((load) => hydrateLoad(load, req.userId)));
});

router.post("/cargo-loads/recommendation", authenticateToken, (req, res) => {
  const { cargoType, weightKg, volumeM3 } = req.body as Record<string, unknown>;
  if (typeof cargoType !== "string" || !cargoTypes.includes(cargoType as CargoType) || typeof weightKg !== "number" || weightKg <= 0 || typeof volumeM3 !== "number" || volumeM3 <= 0) {
    res.status(400).json({ error: "validation", message: "cargoType, positive weightKg, and positive volumeM3 are required" });
    return;
  }
  const result = recommendation({ cargoType: cargoType as CargoType, weightKg, volumeM3 });
  if (!result) {
    res.status(422).json({ error: "unsupported_cargo", message: "No available vehicle supports this cargo type and required capacity" });
    return;
  }
  res.json(result);
});

router.post("/cargo-loads", authenticateToken, async (req: AuthRequest, res) => {
  const body = req.body as Record<string, unknown>;
  if (!validCargoInput(body)) {
    res.status(400).json({ error: "validation", message: "Missing or invalid cargo load fields" });
    return;
  }
  const pickup = districts.find((district) => district.id === body.pickupDistrictId && district.regionId === body.pickupRegionId);
  const delivery = districts.find((district) => district.id === body.deliveryDistrictId && district.regionId === body.deliveryRegionId);
  if (!pickup || !delivery) {
    res.status(400).json({ error: "validation", message: "Pickup and delivery districts must belong to their regions" });
    return;
  }
  const load: StoredCargoLoad = {
    id: generateId(), shipperId: req.userId!, title: body.title.trim(), description: typeof body.description === "string" ? body.description : null,
    cargoType: body.cargoType, weightKg: body.weightKg, volumeM3: body.volumeM3,
    lengthCm: typeof body.lengthCm === "number" ? body.lengthCm : null, widthCm: typeof body.widthCm === "number" ? body.widthCm : null, heightCm: typeof body.heightCm === "number" ? body.heightCm : null,
    pickupRegionId: body.pickupRegionId, pickupDistrictId: body.pickupDistrictId, pickupAddress: typeof body.pickupAddress === "string" ? body.pickupAddress : null,
    deliveryRegionId: body.deliveryRegionId, deliveryDistrictId: body.deliveryDistrictId, deliveryAddress: typeof body.deliveryAddress === "string" ? body.deliveryAddress : null,
    distanceKm: Math.round(Math.hypot(pickup.lat - delivery.lat, pickup.lng - delivery.lng) * 111), pickupDate: body.pickupDate,
    budgetUzs: typeof body.budgetUzs === "number" ? body.budgetUzs : null, sharedLoadAllowed: body.sharedLoadAllowed, status: "open", createdAt: new Date().toISOString(),
  };
  await persistItem("cargo_loads", load);
  cargoLoads.push(load);
  res.status(201).json(hydrateLoad(load, req.userId));
});

router.get("/cargo-loads/:id", authenticateToken, (req: AuthRequest, res) => {
  const load = cargoLoads.find((item) => item.id === rawParam(req.params.id));
  if (!load) { res.status(404).json({ error: "not_found", message: "Cargo load not found" }); return; }
  const requesterDriver = driverProfiles.find((profile) => profile.userId === req.userId);
  const visibleOffers = req.userId === load.shipperId
    ? cargoOffers.filter((offer) => offer.loadId === load.id)
    : requesterDriver
      ? cargoOffers.filter((offer) => offer.loadId === load.id && offer.driverId === requesterDriver.id)
      : [];
  res.json({
    ...hydrateLoad(load, req.userId),
    offers: visibleOffers.map((offer) =>
      hydrateOffer(
        offer,
        offer.status === "accepted" &&
          (req.userId === load.shipperId || requesterDriver?.id === offer.driverId),
      ),
    ),
    recommendation: recommendation(load),
  });
});

router.post("/cargo-loads/:id/offers", authenticateToken, async (req: AuthRequest, res) => {
  const load = cargoLoads.find((item) => item.id === rawParam(req.params.id));
  const driver = driverProfiles.find((item) => item.userId === req.userId);
  const { amountUzs, message } = req.body as Record<string, unknown>;
  if (!load) { res.status(404).json({ error: "not_found", message: "Cargo load not found" }); return; }
  if (!driver) { res.status(403).json({ error: "forbidden", message: "Only driver profiles can submit offers" }); return; }
  if (!isOperationalDriver(driver)) {
    res.status(403).json({
      error: "driver_not_verified",
      message: "Driver identity and vehicle must be verified before submitting offers",
    });
    return;
  }
  if (load.shipperId === req.userId) { res.status(403).json({ error: "forbidden", message: "Shippers cannot offer on their own cargo load" }); return; }
  if (load.status !== "open" && load.status !== "negotiating") { res.status(409).json({ error: "conflict", message: "Cargo load is not accepting offers" }); return; }
  if (!hasActionablePickupDate(load)) { res.status(409).json({ error: "conflict", message: "Cargo pickup date has passed" }); return; }
  if (typeof amountUzs !== "number" || amountUzs <= 0) { res.status(400).json({ error: "validation", message: "A positive amountUzs is required" }); return; }
  const vehicle = vehicleTypes.find((item) => item.id === driver.vehicleTypeId);
  const supported =
    vehicle?.supportedCargoTypes.includes(load.cargoType) &&
    vehicle.capacityKg >= load.weightKg &&
    vehicle.capacityM3 >= load.volumeM3;
  const hasSharedCapacity =
    !load.sharedLoadAllowed ||
    (driver.sharedLoadAvailableKg >= load.weightKg &&
      driver.sharedLoadAvailableM3 >= load.volumeM3);
  if (!supported || !hasSharedCapacity) {
    res.status(422).json({
      error: "incompatible_vehicle",
      message: load.sharedLoadAllowed
        ? "Driver vehicle or remaining shared capacity is not suitable for this cargo"
        : "Driver vehicle is not suitable for this cargo type or capacity",
    });
    return;
  }
  if (cargoOffers.some((item) => item.loadId === load.id && item.driverId === driver.id && (item.status === "pending" || item.status === "countered"))) {
    res.status(409).json({ error: "conflict", message: "Driver already has an active offer for this cargo load" });
    return;
  }
  const now = new Date().toISOString();
  const offer: StoredCargoOffer = { id: generateId(), loadId: load.id, driverId: driver.id, amountUzs, message: typeof message === "string" ? message : null, status: "pending", counterAmountUzs: null, counterMessage: null, createdAt: now, updatedAt: now };
  await persistItem("cargo_offers", offer);
  load.status = "negotiating";
  await persistItem("cargo_loads", load);
  cargoOffers.push(offer);
  res.status(201).json(hydrateOffer(offer));
});

router.post("/cargo-loads/:id/offers/:offerId/counter", authenticateToken, async (req: AuthRequest, res) => {
  const load = cargoLoads.find((item) => item.id === rawParam(req.params.id));
  const offer = cargoOffers.find((item) => item.id === rawParam(req.params.offerId) && item.loadId === load?.id);
  const { amountUzs, message } = req.body as Record<string, unknown>;
  if (!load || !offer) { res.status(404).json({ error: "not_found", message: "Cargo offer not found" }); return; }
  if (load.shipperId !== req.userId) { res.status(403).json({ error: "forbidden", message: "Only the shipper can counter an offer" }); return; }
  if (!hasActionablePickupDate(load)) { res.status(409).json({ error: "conflict", message: "Cargo pickup date has passed" }); return; }
  if ((load.status !== "open" && load.status !== "negotiating") || offer.status !== "pending") {
    res.status(409).json({ error: "conflict", message: "This offer can no longer be countered" });
    return;
  }
  if (typeof amountUzs !== "number" || amountUzs <= 0) { res.status(400).json({ error: "validation", message: "A positive amountUzs is required" }); return; }
  offer.counterAmountUzs = amountUzs; offer.counterMessage = typeof message === "string" ? message : null; offer.status = "countered"; offer.updatedAt = new Date().toISOString(); load.status = "negotiating";
  await persistItem("cargo_offers", offer);
  await persistItem("cargo_loads", load);
  res.json(hydrateOffer(offer));
});

router.post("/cargo-loads/:id/offers/:offerId/counter-decision", authenticateToken, async (req: AuthRequest, res) => {
  const load = cargoLoads.find((item) => item.id === rawParam(req.params.id));
  const offer = cargoOffers.find((item) => item.id === rawParam(req.params.offerId) && item.loadId === load?.id);
  const driver = driverProfiles.find((item) => item.userId === req.userId);
  const { accepted } = req.body as { accepted?: unknown };
  if (!load || !offer) { res.status(404).json({ error: "not_found", message: "Cargo offer not found" }); return; }
  if (!driver || offer.driverId !== driver.id) {
    res.status(403).json({ error: "forbidden", message: "Only the offering driver can respond to this counter offer" });
    return;
  }
  if (!hasActionablePickupDate(load)) { res.status(409).json({ error: "conflict", message: "Cargo pickup date has passed" }); return; }
  if (offer.status !== "countered" || offer.counterAmountUzs === null || typeof accepted !== "boolean") {
    res.status(409).json({ error: "conflict", message: "This counter offer can no longer be answered" });
    return;
  }
  if (accepted && !isOperationalDriver(driver)) {
    res.status(403).json({
      error: "driver_not_verified",
      message: "Driver identity and vehicle must remain verified to accept a counter offer",
    });
    return;
  }

  const now = new Date().toISOString();
  if (accepted) {
    offer.amountUzs = offer.counterAmountUzs;
    offer.status = "pending";
    offer.counterAmountUzs = null;
    offer.counterMessage = null;
    load.status = "negotiating";
  } else {
    offer.status = "rejected";
    load.status = cargoOffers.some(
      (item) =>
        item.loadId === load.id &&
        item.id !== offer.id &&
        (item.status === "pending" || item.status === "countered"),
    )
      ? "negotiating"
      : "open";
  }
  offer.updatedAt = now;
  await persistItem("cargo_offers", offer);
  await persistItem("cargo_loads", load);
  res.json(hydrateOffer(offer));
});

router.post("/cargo-loads/:id/offers/:offerId/accept", authenticateToken, async (req: AuthRequest, res) => {
  const load = cargoLoads.find((item) => item.id === rawParam(req.params.id));
  const offer = cargoOffers.find((item) => item.id === rawParam(req.params.offerId) && item.loadId === load?.id);
  const offerDriver = driverProfiles.find((item) => item.id === offer?.driverId);
  if (!load || !offer) { res.status(404).json({ error: "not_found", message: "Cargo offer not found" }); return; }
  if (load.shipperId !== req.userId) { res.status(403).json({ error: "forbidden", message: "Only the shipper can accept an offer" }); return; }
  if (!offerDriver || !isOperationalDriver(offerDriver)) {
    res.status(409).json({
      error: "driver_not_verified",
      message: "This driver is no longer verified for cargo offers",
    });
    return;
  }
  if (!hasActionablePickupDate(load)) { res.status(409).json({ error: "conflict", message: "Cargo pickup date has passed" }); return; }
  if ((load.status !== "open" && load.status !== "negotiating") || offer.status !== "pending" || cargoOffers.some((item) => item.loadId === load.id && item.status === "accepted")) {
    res.status(409).json({ error: "conflict", message: "This offer can no longer be accepted" });
    return;
  }
  offer.status = "accepted"; offer.updatedAt = new Date().toISOString(); load.status = "accepted";
  cargoOffers.filter((item) => item.loadId === load.id && item.id !== offer.id && item.status !== "accepted").forEach((item) => { item.status = "rejected"; item.updatedAt = offer.updatedAt; });
  await persistItem("cargo_offers", offer);
  await persistItem("cargo_loads", load);
  await Promise.all(
    cargoOffers
      .filter((item) => item.loadId === load.id && item.id !== offer.id && item.status === "rejected")
      .map((item) => persistItem("cargo_offers", item)),
  );
  res.json(hydrateOffer(offer, true));
});

router.get("/drivers", authenticateToken, (req, res) => {
  const regionId = typeof req.query.regionId === "string" ? req.query.regionId : undefined;
  res.json(
    driverProfiles
      .filter(
        (profile) =>
          isOperationalDriver(profile) &&
          (!regionId || profile.currentRegionId === regionId),
      )
      .map((profile) => hydrateDriver(profile)),
  );
});

router.get("/vehicle-types", authenticateToken, (_req, res) => {
  res.json(vehicleTypes);
});

router.get("/drivers/:id", authenticateToken, (req, res) => {
  const driver = driverProfiles.find((item) => item.id === rawParam(req.params.id));
  if (!driver) { res.status(404).json({ error: "not_found", message: "Driver not found" }); return; }
  res.json(hydrateDriver(driver));
});

export default router;