import { Router, type RequestHandler } from "express";
import {
  GetMyDriverVerificationResponse, SubmitDriverVerificationBody,
  UploadDriverDocumentBody, ReviewDriverVerificationBody, RateCargoDriverBody,
  RateCargoDriverResponse, ListDriverVerificationsResponse,
} from "@workspace/api-zod";
import { authenticateToken, type AuthRequest } from "../middleware/auth.js";
import { driverProfiles, users, regions, vehicleTypes, cargoLoads, cargoOffers, generateId, type StoredDriverProfile } from "../data/store.js";
import { persistItems } from "../lib/persistence.js";
import { driverDocumentStorage } from "../lib/driver-documents.js";
import { hasCompleteVehicle, requiredDocumentKinds, withDriverWrite } from "../lib/driver-trust.js";

type Save = typeof persistItems;
type DocumentStorage = typeof driverDocumentStorage;

export function privateDriverApplication(profile: StoredDriverProfile) {
  return GetMyDriverVerificationResponse.parse({
    id: profile.id, userId: profile.userId,
    name: users.find(user => user.id === profile.userId)?.name ?? "",
    vehicleTypeId: profile.vehicleTypeId, vehiclePlate: profile.vehiclePlate,
    capacityKg: profile.capacityKg ?? 0, capacityM3: profile.capacityM3 ?? 0,
    sharedLoadAvailableKg: profile.sharedLoadAvailableKg, sharedLoadAvailableM3: profile.sharedLoadAvailableM3,
    availableFrom: profile.availableFrom, currentRegionId: profile.currentRegionId, bio: profile.bio,
    status: profile.reviewStatus ?? "none", reason: profile.reviewReason ?? null, revision: profile.revision ?? 0,
    documents: (profile.documents ?? []).map(({ objectPath, mimeType, ...doc }) => doc),
    reviewHistory: (profile.reviewHistory ?? []).map(({ reviewerId, ...review }) => review),
  });
}

export function createDriversRouter(save: Save = persistItems, files: DocumentStorage = driverDocumentStorage) {
  const router = Router();
  const moderator: RequestHandler = (req: AuthRequest, res, next) => {
    if (users.find(user => user.id === req.userId)?.role !== "admin") {
      res.status(403).json({ error: "forbidden", message: "Faqat administrator moderatsiya qila oladi." }); return;
    }
    next();
  };
  const ownerProfile = (req: AuthRequest) => {
    if (users.find(user => user.id === req.userId)?.role !== "driver") return undefined;
    return driverProfiles.find(profile => profile.userId === req.userId);
  };
  const commitApplication = async (current: StoredDriverProfile, next: StoredDriverProfile) => {
    const user = users.find(item => item.id === current.userId)!;
    const nextUser = { ...user, verificationStatus: next.reviewStatus ?? "none" };
    await save([{ collection: "driver_profiles", item: next }, { collection: "users", item: nextUser }]);
    Object.assign(current, next);
    Object.assign(user, nextUser);
  };
  const locked = (handler: RequestHandler): RequestHandler => (req, res, next) => {
    void withDriverWrite(async () => { await handler(req, res, next); }).catch(next);
  };

  router.get("/drivers/me/verification", authenticateToken, (req: AuthRequest, res) => {
    const profile = ownerProfile(req);
    if (!profile) { res.status(403).json({ error: "forbidden", message: "Haydovchi profili kerak." }); return; }
    res.setHeader("Cache-Control", "private, no-store");
    res.json(privateDriverApplication(profile));
  });

  router.put("/drivers/me/verification", authenticateToken, locked(async (req: AuthRequest, res) => {
    const profile = ownerProfile(req);
    if (!profile) { res.status(403).json({ error: "forbidden", message: "Haydovchi profili kerak." }); return; }
    const parsed = SubmitDriverVerificationBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "validation", message: "Transport maydonlarini to‘liq va to‘g‘ri kiriting." }); return; }
    const input = parsed.data;
    const vehicle = vehicleTypes.find(item => item.id === input.vehicleTypeId);
    if (!Number.isInteger(input.revision) || input.revision !== (profile.revision ?? 0)) {
      res.status(409).json({ error: "stale_revision", message: "Ma’lumot o‘zgargan. Qayta yuklang." }); return;
    }
    if (!vehicle || !regions.some(item => item.id === input.currentRegionId) ||
      !Number.isFinite(input.availableFrom.getTime()) || input.vehiclePlate.trim().toUpperCase() === "PENDING" ||
      input.vehiclePlate.trim().length < 3 || input.capacityKg > vehicle.capacityKg || input.capacityM3 > vehicle.capacityM3 ||
      input.sharedLoadAvailableKg > input.capacityKg || input.sharedLoadAvailableM3 > input.capacityM3) {
      res.status(400).json({ error: "validation", message: "Transport, mavjudlik va sig‘imlarni tekshiring. Sig‘im transport turining chegarasidan oshmasin." }); return;
    }
    const next: StoredDriverProfile = {
      ...profile, ...input, vehiclePlate: input.vehiclePlate.trim().toUpperCase(),
      availableFrom: new Date(input.availableFrom).toISOString(), bio: input.bio?.trim() || null,
      revision: (profile.revision ?? 0) + 1, reviewStatus: "pending", reviewReason: null,
    };
    await commitApplication(profile, next);
    res.json(privateDriverApplication(profile));
  }));

  router.post("/drivers/me/documents", authenticateToken, locked(async (req: AuthRequest, res) => {
    const profile = ownerProfile(req);
    if (!profile) { res.status(403).json({ error: "forbidden", message: "Haydovchi profili kerak." }); return; }
    const parsed = UploadDriverDocumentBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "validation", message: "JPEG yoki PNG hujjat rasmini tanlang." }); return; }
    const { kind, data, mimeType } = parsed.data;
    if (data.length > 7_000_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(data) || data.length % 4 !== 0) {
      res.status(400).json({ error: "validation", message: "Hujjat rasmi 5 MB dan oshmasin." }); return;
    }
    const bytes = Buffer.from(data, "base64");
    const validSignature = mimeType === "image/png"
      ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    if (!validSignature || bytes.length > 5 * 1024 * 1024) {
      res.status(400).json({ error: "validation", message: "Yaroqli JPEG yoki PNG rasmi kerak (5 MB gacha)." }); return;
    }
    const objectPath = await files.save(bytes, mimeType);
    const previous = profile.documents?.find(doc => doc.kind === kind);
    const next: StoredDriverProfile = {
      ...profile, revision: (profile.revision ?? 0) + 1, reviewStatus: "pending", reviewReason: null,
      documents: [
        ...(profile.documents ?? []).filter(doc => doc.kind !== kind),
        { id: generateId(), kind, objectPath, mimeType, status: "pending", submittedAt: new Date().toISOString(), reviewedAt: null },
      ],
    };
    try { await commitApplication(profile, next); }
    catch (error) { await files.remove(objectPath).catch(() => {}); throw error; }
    if (previous) await files.remove(previous.objectPath).catch(error => req.log.warn({ error }, "Replaced document cleanup failed"));
    res.status(201).json(privateDriverApplication(profile));
  }));

  router.get("/drivers/:id/documents/:documentId", authenticateToken, async (req: AuthRequest, res) => {
    const profile = driverProfiles.find(item => item.id === req.params.id);
    if (!profile || (profile.userId !== req.userId && users.find(user => user.id === req.userId)?.role !== "admin")) {
      res.status(403).json({ error: "forbidden", message: "Hujjat shaxsiy ma’lumot hisoblanadi." }); return;
    }
    const doc = profile.documents?.find(item => item.id === req.params.documentId);
    if (!doc) { res.status(404).json({ error: "not_found", message: "Hujjat topilmadi." }); return; }
    res.setHeader("Cache-Control", "private, no-store");
    res.json({ url: await files.readUrl(doc.objectPath) });
  });

  router.get("/admin/drivers", authenticateToken, moderator, (_req, res) => {
    res.setHeader("Cache-Control", "private, no-store");
    res.json(ListDriverVerificationsResponse.parse(driverProfiles.map(privateDriverApplication)));
  });

  router.patch("/admin/drivers/:id/verification", authenticateToken, moderator, locked(async (req: AuthRequest, res) => {
    const profile = driverProfiles.find(item => item.id === req.params.id);
    if (!profile) { res.status(404).json({ error: "not_found", message: "Haydovchi topilmadi." }); return; }
    const parsed = ReviewDriverVerificationBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "validation", message: "Tekshiruv holati noto‘g‘ri." }); return; }
    const input = parsed.data;
    if (!Number.isInteger(input.revision) || input.revision !== (profile.revision ?? 0)) {
      res.status(409).json({ error: "stale_revision", message: "Ariza o‘zgargan. Qayta yuklab, hujjatlarni yana tekshiring." }); return;
    }
    if (input.status === "rejected" && !input.reason.trim()) {
      res.status(400).json({ error: "validation", message: "Rad etish sababini yozing." }); return;
    }
    const existing = profile.documents ?? [];
    if (new Set(input.documents.map(doc => doc.id)).size !== input.documents.length ||
      input.documents.some(doc => !existing.some(item => item.id === doc.id))) {
      res.status(400).json({ error: "validation", message: "Hujjatlar ro‘yxati noto‘g‘ri." }); return;
    }
    const now = new Date().toISOString();
    const next: StoredDriverProfile = {
      ...profile, reviewStatus: input.status, reviewReason: input.reason.trim() || null,
      revision: (profile.revision ?? 0) + 1,
      documents: existing.map(doc => {
        const decision = input.documents.find(item => item.id === doc.id);
        return decision ? { ...doc, status: decision.status, reviewedAt: decision.status === "pending" ? null : now } : doc;
      }),
      reviewHistory: [...(profile.reviewHistory ?? []), { status: input.status, reason: input.reason.trim(), createdAt: now, reviewerId: req.userId! }],
    };
    if (input.status === "approved" && (!hasCompleteVehicle(next) ||
      !requiredDocumentKinds.every(kind => next.documents?.some(doc => doc.kind === kind && doc.status === "approved")))) {
      res.status(400).json({ error: "incomplete_application", message: "Transport ma’lumotlari va uchta hujjat to‘liq tasdiqlanishi kerak." }); return;
    }
    await commitApplication(profile, next);
    res.json(privateDriverApplication(profile));
  }));

  router.post("/cargo-loads/:id/driver-rating", authenticateToken, locked(async (req: AuthRequest, res) => {
    const load = cargoLoads.find(item => item.id === req.params.id);
    if (!load) { res.status(404).json({ error: "not_found", message: "Yuk topilmadi." }); return; }
    if (load.shipperId !== req.userId) { res.status(403).json({ error: "forbidden", message: "Faqat yuk egasi baho bera oladi." }); return; }
    if (load.status !== "delivered") { res.status(409).json({ error: "trip_not_delivered", message: "Qatnov tugagandan keyin baho bering." }); return; }
    const parsed = RateCargoDriverBody.safeParse(req.body);
    if (!parsed.success || !Number.isInteger(parsed.data.score)) { res.status(400).json({ error: "validation", message: "1 dan 5 gacha baho kiriting." }); return; }
    const offer = cargoOffers.find(item => item.loadId === load.id && item.status === "accepted");
    const profile = driverProfiles.find(item => item.id === offer?.driverId);
    if (!profile || profile.userId === req.userId) { res.status(409).json({ error: "no_driver", message: "Qatnov haydovchisi topilmadi." }); return; }
    if (profile.ratingHistory?.some(item => item.loadId === load.id)) {
      res.status(409).json({ error: "already_rated", message: "Bu qatnovga baho berilgan." }); return;
    }
    const rating = {
      id: generateId(), loadId: load.id, score: parsed.data.score,
      comment: parsed.data.comment?.trim() || null, createdAt: new Date().toISOString(),
    };
    const history = [...(profile.ratingHistory ?? []), rating];
    const next = {
      ...profile, ratingHistory: history, ratingCount: profile.ratingCount + 1,
      rating: Math.round((profile.rating * profile.ratingCount + rating.score) / (profile.ratingCount + 1) * 100) / 100,
    };
    await save([{ collection: "driver_profiles", item: next }]);
    Object.assign(profile, next);
    res.status(201).json(RateCargoDriverResponse.parse(rating));
  }));
  return router;
}

export default createDriversRouter();
