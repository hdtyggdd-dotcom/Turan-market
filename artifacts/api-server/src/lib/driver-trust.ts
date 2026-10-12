import { users, vehicleTypes, type StoredDriverProfile, type StoredCargoLoad } from "../data/store.js";
import { documentValid, documentEvidence } from "./document-validity.js";

export const requiredDocumentKinds = ["identity", "license", "registration"] as const;

export function effectiveDriverReviewStatus(profile: StoredDriverProfile) {
  return profile.reviewStatus === "approved" && !requiredDocumentKinds.every(kind =>
    profile.documents?.some(doc => doc.kind === kind && doc.status === "approved" && documentValid(doc)))
    ? "expired" as const : profile.reviewStatus ?? "none";
}

export function hasCompleteVehicle(profile: StoredDriverProfile): boolean {
  const vehicle = vehicleTypes.find(item => item.id === profile.vehicleTypeId);
  return !!vehicle &&
    profile.vehiclePlate.trim().length >= 3 &&
    profile.vehiclePlate.trim().toUpperCase() !== "PENDING" &&
    Number.isFinite(profile.capacityKg) && Number.isFinite(profile.capacityM3) &&
    (profile.capacityKg ?? 0) > 0 && (profile.capacityM3 ?? 0) > 0 &&
    profile.capacityKg! <= vehicle.capacityKg && profile.capacityM3! <= vehicle.capacityM3 &&
    profile.sharedLoadAvailableKg >= 0 && profile.sharedLoadAvailableKg <= profile.capacityKg! &&
    profile.sharedLoadAvailableM3 >= 0 && profile.sharedLoadAvailableM3 <= profile.capacityM3! &&
    Number.isFinite(Date.parse(profile.availableFrom));
}

export function isOperationalDriver(profile: StoredDriverProfile): boolean {
  const user = users.find(item => item.id === profile.userId);
  return user?.role === "driver" && user.verificationStatus === "approved" &&
    profile.reviewStatus === "approved" && hasCompleteVehicle(profile) &&
    requiredDocumentKinds.every(kind => profile.documents?.some(doc => doc.kind === kind && doc.status === "approved" && documentValid(doc)));
}

export function canCarryCargo(profile: StoredDriverProfile, load: StoredCargoLoad): boolean {
  const vehicle = vehicleTypes.find(item => item.id === profile.vehicleTypeId);
  return !!vehicle?.supportedCargoTypes.includes(load.cargoType) &&
    (profile.capacityKg ?? 0) >= load.weightKg && (profile.capacityM3 ?? 0) >= load.volumeM3 &&
    (!load.sharedLoadAllowed ||
      (profile.sharedLoadAvailableKg >= load.weightKg && profile.sharedLoadAvailableM3 >= load.volumeM3));
}

/** Only public verification evidence, never document bytes or storage paths. */
export function publicDriverEvidence(profile: StoredDriverProfile) {
  return {
    operational: isOperationalDriver(profile),
    reviewStatus: effectiveDriverReviewStatus(profile),
    capacityKg: profile.capacityKg ?? 0,
    capacityM3: profile.capacityM3 ?? 0,
    verifiedDocuments: (profile.documents ?? []).filter(doc => doc.status === "approved" && documentValid(doc)).map(documentEvidence),
    ratingHistory: profile.ratingHistory ?? [],
  };
}

// Shared with cargo offer/assignment writes. Hold from validation through commit
// and publication so eligibility changes cannot race with operational grants.
let writeTail: Promise<unknown> = Promise.resolve();
export async function withDriverWrite<T>(operation: () => Promise<T>): Promise<T> {
  const job = writeTail.catch(() => {}).then(operation);
  writeTail = job;
  return job;
}
