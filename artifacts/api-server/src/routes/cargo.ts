import { Router, type RequestHandler, type Response } from "express";
import { isOperationalDriver, publicDriverEvidence, canCarryCargo, withDriverWrite } from "../lib/driver-trust.js";
import {
  cargoLoads,
  cargoNotifications,
  cargoOffers,
  cargoTrackingUpdates,
  districts,
  driverProfiles,
  generateId,
  regions,
  sanitizeUser,
  type CargoTrackingStage,
  type CargoType,
  type StoredCargoLoad,
  type StoredCargoOffer,
  users,
  vehicleTypes,
} from "../data/store.js";
import { authenticateToken, type AuthRequest } from "../middleware/auth.js";
import { registerToken, unregisterToken, sendCargoNotification } from "../lib/cargo-notifications.js";

type CargoChange = { collection: string; item: StoredCargoLoad | StoredCargoOffer };
type SaveCargo = (changes: readonly CargoChange[]) => Promise<void>;

// Inject storage for isolated route tests; production uses the existing repository.
export function createCargoRouter(persistItems: SaveCargo = async (changes) => {
  const storage = await import("../lib/persistence.js");
  await storage.persistItems(changes);
}) {
const router = Router();
const mutationQueue = new Map<string, Promise<void>>();

function withCargoLock(
  handler: (req: AuthRequest, res: Response) => void | Promise<void>,
): RequestHandler {
  return async (req: AuthRequest, res, next) => {
    const id = rawParam(req.params.id);
    const previous = mutationQueue.get(id) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>(resolve => { release = resolve; });
    mutationQueue.set(id, current);
    await previous;
    try {
      if (!res.destroyed) await handler(req, res);
    } catch (error) {
      next(error);
    } finally {
      release();
      if (mutationQueue.get(id) === current) mutationQueue.delete(id);
    }
  };
}

/** Eligibility checks, persistence and publication share the moderation queue. */
function withDriverCargoLock(
  handler: (req: AuthRequest, res: Response) => void | Promise<void>,
): RequestHandler {
  return withCargoLock((req, res) => withDriverWrite(async () => { await handler(req, res); }));
}
const cargoTypes: CargoType[] = ["general", "fragile", "perishable", "livestock", "hazardous", "construction"];
const trackingStages: CargoTrackingStage[] = [
  "accepted",
  "pickup_ready",
  "picked_up",
  "in_transit",
  "border_control",
  "delivered",
];
const trackingStageLabels: Record<CargoTrackingStage, string> = {
  accepted: "Tashuv tasdiqlandi",
  pickup_ready: "Yuklashga tayyor",
  picked_up: "Yuk olindi",
  in_transit: "Yo'lda",
  border_control: "Chegara nazoratida",
  delivered: "Yetkazildi",
};
const latestLocations = new Map<string, { lat: number; lng: number; createdAt: string }>();

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
    id: profile.id,
    userId: profile.userId,
    vehicleTypeId: profile.vehicleTypeId,
    vehiclePlate: profile.vehiclePlate,
    availableFrom: profile.availableFrom,
    currentRegionId: profile.currentRegionId,
    rating: profile.rating,
    ratingCount: profile.ratingCount,
    completedTrips: profile.completedTrips,
    sharedLoadAvailableKg: profile.sharedLoadAvailableKg,
    sharedLoadAvailableM3: profile.sharedLoadAvailableM3,
    bio: profile.bio,
    ...publicDriverEvidence(profile),
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

function acceptedDriverFor(load: StoredCargoLoad) {
  const offer = cargoOffers.find((item) => item.loadId === load.id && item.status === "accepted");
  return driverProfiles.find((profile) => profile.id === offer?.driverId) ?? null;
}

function routePoint(districtId: string, regionId: string) {
  const district = districts.find((item) => item.id === districtId);
  const region = regions.find((item) => item.id === regionId);
  return {
    lat: district?.lat ?? region!.lat,
    lng: district?.lng ?? region!.lng,
    label: `${district?.name ?? districtId}, ${region?.name ?? regionId}`,
  };
}

function stageFromLoadStatus(load: StoredCargoLoad): CargoTrackingStage {
  if (load.status === "delivered") return "delivered";
  if (load.status === "in_transit") return "in_transit";
  return "accepted";
}

function hydrateTracking(load: StoredCargoLoad, requesterId?: string) {
  const pickup = routePoint(load.pickupDistrictId, load.pickupRegionId);
  const delivery = routePoint(load.deliveryDistrictId, load.deliveryRegionId);
  const history = cargoTrackingUpdates
    .filter((item) => item.loadId === load.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const lastUpdate = history[history.length - 1];
  const driver = acceptedDriverFor(load);
  const location = latestLocations.get(load.id);
  const currentStage = driver ? lastUpdate?.stage ?? stageFromLoadStatus(load) : null;
  return {
    loadId: load.id,
    pickup,
    delivery,
    currentStage,
    currentLat: location?.lat ?? lastUpdate?.lat ?? null,
    currentLng: location?.lng ?? lastUpdate?.lng ?? null,
    locationUpdatedAt: location?.createdAt ?? (lastUpdate?.lat != null ? lastUpdate.createdAt : null),
    assigned: !!driver,
    canUpdate: !!driver && driver.userId === requesterId && load.status !== "delivered" && load.status !== "cancelled",
    updatedAt: lastUpdate?.createdAt ?? load.createdAt,
    history,
  };
}

function notifyCargoParticipants(
  load: StoredCargoLoad,
  title: string,
  message: string,
  type: "tracking" | "offer" | "system",
) {
  const recipientIds = new Set<string>([load.shipperId]);
  const driver = acceptedDriverFor(load);
  if (driver) recipientIds.add(driver.userId);
  recipientIds.forEach((userId) => {
    sendCargoNotification(userId, load.id, title, message, type);
  });
}

function validCoordinates(body: Record<string, unknown>): boolean {
  return typeof body.lat === "number" && Number.isFinite(body.lat) && Math.abs(body.lat) <= 90 &&
    typeof body.lng === "number" && Number.isFinite(body.lng) && Math.abs(body.lng) <= 180;
}

router.get("/cargo-trips", authenticateToken, (req: AuthRequest, res) => {
  res.json(cargoLoads.filter((load) =>
    load.shipperId === req.userId || acceptedDriverFor(load)?.userId === req.userId,
  ).map((load) => hydrateLoad(load, req.userId)));
});

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
  const body = (req.body ?? {}) as Record<string, unknown>;
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
  await persistItems([{ collection: "cargo_loads", item: load }]);
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

router.get("/cargo-loads/:id/tracking", authenticateToken, (req: AuthRequest, res) => {
  const load = cargoLoads.find((item) => item.id === rawParam(req.params.id));
  if (!load) {
    res.status(404).json({ error: "not_found", message: "Cargo load not found" });
    return;
  }
  const hasAccess = canViewPrivateLoadDetails(load, req.userId) || load.status === "open" || load.status === "negotiating";
  if (!hasAccess) {
    res.status(403).json({ error: "forbidden", message: "Tracking is available to cargo participants" });
    return;
  }
  res.json(hydrateTracking(load, req.userId));
});

router.patch("/cargo-loads/:id/tracking", authenticateToken, withCargoLock(async (req, res) => {
  const load = cargoLoads.find((item) => item.id === rawParam(req.params.id));
  if (!load) {
    res.status(404).json({ error: "not_found", message: "Cargo load not found" });
    return;
  }
  const driver = acceptedDriverFor(load);
  if (!driver || driver.userId !== req.userId) {
    res.status(403).json({ error: "forbidden", message: "Only the assigned driver can update tracking" });
    return;
  }
  if (load.status === "delivered" || load.status === "cancelled") {
    res.status(409).json({ error: "conflict", message: "Finished cargo cannot be updated" });
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  const stage = body.stage as CargoTrackingStage;
  if (!trackingStages.includes(stage)) {
    res.status(400).json({ error: "validation", message: "A valid tracking stage is required" });
    return;
  }
  const hasCoordinates = body.lat !== undefined || body.lng !== undefined;
  if (hasCoordinates && !validCoordinates(body)) {
    res.status(400).json({ error: "validation", message: "Coordinates must be valid numbers" });
    return;
  }
  const previous = hydrateTracking(load, req.userId).currentStage ?? "accepted";
  const currentIndex = trackingStages.indexOf(previous);
  // Border control is optional for domestic trips. All other milestones must be sequential.
  const allowed = stage === trackingStages[currentIndex + 1] ||
    (previous === "in_transit" && stage === "delivered");
  if (!allowed) {
    res.status(409).json({ error: "conflict", message: "Tracking stages must advance in order" });
    return;
  }
  if (body.note !== undefined && (typeof body.note !== "string" || body.note.length > 1000)) {
    res.status(400).json({ error: "validation", message: "Note must be at most 1000 characters" });
    return;
  }
  const lat = hasCoordinates ? body.lat as number : null;
  const lng = hasCoordinates ? body.lng as number : null;
  const update = {
    id: generateId(),
    loadId: load.id,
    stage,
    note: typeof body.note === "string" && body.note.trim() ? body.note.trim() : null,
    lat,
    lng,
    createdAt: new Date().toISOString(),
  };
  const nextLoad: StoredCargoLoad = {
    ...load,
    status: stage === "delivered" ? "delivered" : stage === "pickup_ready" ? "accepted" : "in_transit",
  };
  await persistItems([{ collection: "cargo_loads", item: nextLoad }]);
  Object.assign(load, nextLoad);
  cargoTrackingUpdates.push(update);
  if (lat !== null && lng !== null) latestLocations.set(load.id, { lat, lng, createdAt: update.createdAt });
  notifyCargoParticipants(
    load,
    `Yuk holati: ${trackingStageLabels[stage]}`,
    update.note ?? `Haydovchi yuk holatini "${trackingStageLabels[stage]}" deb yangiladi.`,
    "tracking",
  );
  res.json(hydrateTracking(load, req.userId));
}));

router.put("/cargo-loads/:id/location", authenticateToken, withCargoLock((req, res) => {
  const load = cargoLoads.find((item) => item.id === rawParam(req.params.id));
  if (!load) { res.status(404).json({ error: "not_found", message: "Cargo load not found" }); return; }
  if (acceptedDriverFor(load)?.userId !== req.userId) {
    res.status(403).json({ error: "forbidden", message: "Only the assigned driver can share location" }); return;
  }
  if (load.status === "delivered" || load.status === "cancelled") {
    res.status(409).json({ error: "conflict", message: "Finished cargo cannot share location" }); return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  if (!validCoordinates(body)) {
    res.status(400).json({ error: "validation", message: "Valid latitude and longitude are required" }); return;
  }
  const now = Date.now();
  const sampledAt = body.sampledAt === undefined ? now
    : typeof body.sampledAt === "string" ? Date.parse(body.sampledAt) : NaN;
  if (!Number.isFinite(sampledAt) || sampledAt > now + 30_000 || sampledAt < now - 24 * 60 * 60_000) {
    res.status(400).json({ error: "validation", message: "GPS sample time is invalid or too old" }); return;
  }
  // Delayed OS batches must neither replace newer fixes nor appear live on arrival.
  const previous = latestLocations.get(load.id);
  const boundedTime = Math.min(sampledAt, now);
  if (!previous || boundedTime > Date.parse(previous.createdAt)) {
    latestLocations.set(load.id, { lat: body.lat as number, lng: body.lng as number, createdAt: new Date(boundedTime).toISOString() });
  }
  res.json(hydrateTracking(load, req.userId));
}));

router.post("/cargo-loads/:id/offers", authenticateToken, withDriverCargoLock(async (req, res) => {
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
  if (!canCarryCargo(driver, load)) {
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
  const nextLoad: StoredCargoLoad = { ...load, status: "negotiating" };
  await persistItems([
    { collection: "cargo_offers", item: offer },
    { collection: "cargo_loads", item: nextLoad },
  ]);
  Object.assign(load, nextLoad);
  cargoOffers.push(offer);
  res.status(201).json(hydrateOffer(offer));
}));

router.post("/cargo-loads/:id/offers/:offerId/counter", authenticateToken, withCargoLock(async (req, res) => {
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
  const nextOffer: StoredCargoOffer = {
    ...offer, counterAmountUzs: amountUzs, counterMessage: typeof message === "string" ? message : null,
    status: "countered", updatedAt: new Date().toISOString(),
  };
  const nextLoad: StoredCargoLoad = { ...load, status: "negotiating" };
  await persistItems([
    { collection: "cargo_offers", item: nextOffer },
    { collection: "cargo_loads", item: nextLoad },
  ]);
  Object.assign(offer, nextOffer);
  Object.assign(load, nextLoad);
  res.json(hydrateOffer(offer));
}));

router.post("/cargo-loads/:id/offers/:offerId/counter-decision", authenticateToken, withDriverCargoLock(async (req, res) => {
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
  if (accepted && !canCarryCargo(driver, load)) {
    res.status(422).json({ error: "incompatible_vehicle", message: "Current approved vehicle capacity is insufficient." }); return;
  }

  const now = new Date().toISOString();
  const nextOffer = { ...offer };
  const nextLoad = { ...load };
  if (accepted) {
    nextOffer.amountUzs = offer.counterAmountUzs;
    nextOffer.status = "pending";
    nextOffer.counterAmountUzs = null;
    nextOffer.counterMessage = null;
    nextLoad.status = "negotiating";
  } else {
    nextOffer.status = "rejected";
    nextLoad.status = cargoOffers.some(
      (item) =>
        item.loadId === load.id &&
        item.id !== offer.id &&
        (item.status === "pending" || item.status === "countered"),
    )
      ? "negotiating"
      : "open";
  }
  nextOffer.updatedAt = now;
  await persistItems([
    { collection: "cargo_offers", item: nextOffer },
    { collection: "cargo_loads", item: nextLoad },
  ]);
  Object.assign(offer, nextOffer);
  Object.assign(load, nextLoad);
  res.json(hydrateOffer(offer));
}));

router.post("/cargo-loads/:id/offers/:offerId/accept", authenticateToken, withDriverCargoLock(async (req, res) => {
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
  if (!canCarryCargo(offerDriver, load)) {
    res.status(422).json({ error: "incompatible_vehicle", message: "Current approved vehicle capacity is insufficient." }); return;
  }
  const now = new Date().toISOString();
  const nextOffer: StoredCargoOffer = { ...offer, status: "accepted", updatedAt: now };
  const nextLoad: StoredCargoLoad = { ...load, status: "accepted" };
  const rejected = cargoOffers
    .filter(item => item.loadId === load.id && item.id !== offer.id && item.status !== "accepted")
    .map(original => ({
      original,
      candidate: { ...original, status: "rejected" as const, updatedAt: now },
    }));
  await persistItems([
    { collection: "cargo_offers", item: nextOffer },
    { collection: "cargo_loads", item: nextLoad },
    ...rejected.map(({ candidate }) => ({ collection: "cargo_offers", item: candidate })),
  ]);
  Object.assign(offer, nextOffer);
  Object.assign(load, nextLoad);
  rejected.forEach(({ original, candidate }) => Object.assign(original, candidate));
  cargoTrackingUpdates.push({
    id: generateId(), loadId: load.id, stage: "accepted", note: null,
    lat: null, lng: null, createdAt: offer.updatedAt,
  });
  notifyCargoParticipants(
    load,
    "Haydovchi biriktirildi",
    "Taklif qabul qilindi. Yuk yo'lini jonli kuzatishingiz mumkin.",
    "offer",
  );
  res.json(hydrateOffer(offer, true));
}));

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

router.get("/notifications", authenticateToken, (req: AuthRequest, res) => {
  res.json(
    cargoNotifications
      .filter((item) => item.userId === req.userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50)
      .map(({ userId: _userId, ...notification }) => notification),
  );
});

router.post("/notifications/:id/read", authenticateToken, (req: AuthRequest, res) => {
  const notification = cargoNotifications.find(
    (item) => item.id === rawParam(req.params.id) && item.userId === req.userId,
  );
  if (!notification) {
    res.status(404).json({ error: "not_found", message: "Notification not found" });
    return;
  }
  notification.read = true;
  const { userId: _userId, ...response } = notification;
  res.json(response);
});

router.post("/push-tokens", authenticateToken, (req: AuthRequest, res) => {
  const token = req.body?.token;
  if (typeof token !== "string" || token.length > 256 || !/^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$/.test(token)) {
    res.status(400).json({ error: "validation", message: "Valid Expo push token required" }); return;
  }
  registerToken(req.userId!, token);
  res.json({ registered: true });
});

router.delete("/push-tokens", authenticateToken, (req: AuthRequest, res) => {
  if (typeof req.body?.token !== "string") {
    res.status(400).json({ error: "validation", message: "Push token required" }); return;
  }
  unregisterToken(req.userId!, req.body.token);
  res.json({ registered: false });
});

router.get("/drivers/:id", authenticateToken, (req, res) => {
  const driver = driverProfiles.find((item) => item.id === rawParam(req.params.id));
  if (!driver) { res.status(404).json({ error: "not_found", message: "Driver not found" }); return; }
  res.json(hydrateDriver(driver));
});

return router;
}

export default createCargoRouter();