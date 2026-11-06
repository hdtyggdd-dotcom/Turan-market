import { hashPassword, type StoredUser, type StoredListing, type StoredOrder, type StoredDriverProfile, type StoredCargoLoad, type StoredCargoOffer } from "../data/store.js";
import { randomBytes } from "node:crypto";

export const CORE_COLLECTIONS = ["users", "listings", "orders", "driver_profiles", "cargo_loads", "cargo_offers"];
export type CoreRecord = { collection: string; id: string; payload: Record<string, unknown> };
export class DeletionConflict extends Error {}

export function buildDeletionPlan(owner: StoredUser, rows: CoreRecord[]) {
  const items = <T>(collection: string) => rows.filter(row => row.collection === collection).map(row => row.payload as T);
  const allUsers = items<StoredUser>("users");
  const allOrders = items<StoredOrder>("orders");
  const profiles = items<StoredDriverProfile>("driver_profiles");
  const loads = items<StoredCargoLoad>("cargo_loads");
  const offers = items<StoredCargoOffer>("cargo_offers");
  const ownDrivers = new Set(profiles.filter(p => p.userId === owner.id).map(p => p.id));
  const ownLoads = new Set(loads.filter(p => p.shipperId === owner.id).map(p => p.id));
  const historicalLoads = new Set(offers.filter(o => ownDrivers.has(o.driverId) && o.status === "accepted").map(o => o.loadId));
  if (allOrders.some(o => (o.buyerId === owner.id || o.sellerId === owner.id) && !["delivered", "cancelled"].includes(o.status))) {
    throw new DeletionConflict("Faol buyurtmani avval yakunlang yoki bekor qiling. Yordam uchun maxfiylik sahifasidagi emailga yozishingiz mumkin.");
  }
  if (loads.some(l => (ownLoads.has(l.id) || historicalLoads.has(l.id)) && ["accepted", "in_transit"].includes(l.status))) {
    throw new DeletionConflict("Davom etayotgan yukni avval yakunlang yoki bekor qiling.");
  }
  if (owner.role === "admin" && !allUsers.some(u => u.id !== owner.id && u.role === "admin" && !u.deleted)) {
    throw new DeletionConflict("Oxirgi administrator akkaunti o‘chirilmaydi. Avval boshqaruvni boshqa administratorga topshiring.");
  }
  const deleted: { collection: string; id: string }[] = [];
  const updated: CoreRecord[] = [];
  const remove = (collection: string, id: string) => deleted.push({ collection, id });
  const save = <T extends { id: string }>(collection: string, item: T) => updated.push({ collection, id: item.id, payload: item as unknown as Record<string, unknown> });
  // A non-login technical identity keeps other parties' historical receipts
  // usable. No name, phone, password, locality or profile survives.
  const anonymous: StoredUser = {
    id: owner.id, deleted: true, name: "O‘chirilgan akkaunt", phone: "",
    password: hashPassword(randomBytes(32).toString("hex")), role: owner.role,
    sellerBadge: null, verificationStatus: "none", regionId: null, districtId: null,
    neighborhoodId: null, rating: null, totalSales: 0, createdAt: new Date().toISOString(),
  };
  save("users", anonymous);
  const relatedOrders = allOrders.filter(o => o.buyerId === owner.id || o.sellerId === owner.id);
  for (const order of relatedOrders) save("orders", { ...order, notes: null, deliveryOption: null });
  const referencedListings = new Set(relatedOrders.map(o => o.listingId));
  const imageIds = new Set<string>();
  for (const listing of items<StoredListing>("listings").filter(l => l.userId === owner.id)) {
    for (const url of listing.images) {
      const match = url.match(/\/api\/images\/([^/?#]+)(?:[?#]|$)/);
      if (match) imageIds.add(match[1]!);
    }
    if (referencedListings.has(listing.id)) save("listings", {
      ...listing, title: "O‘chirilgan mahsulot", titleRu: null, description: null,
      images: [], status: "paused", lat: null, lng: null, regionId: "", districtId: "", neighborhoodId: null, sellerType: null,
    });
    else remove("listings", listing.id);
  }
  const removedLoads = new Set<string>();
  for (const load of loads.filter(l => ownLoads.has(l.id))) {
    if (["delivered", "cancelled"].includes(load.status)) save("cargo_loads", {
      ...load, title: "Yopilgan yuk", description: null, pickupAddress: null, deliveryAddress: null,
    });
    else { remove("cargo_loads", load.id); removedLoads.add(load.id); }
  }
  const objectPaths: string[] = [];
  for (const profile of profiles) {
    if (ownDrivers.has(profile.id)) {
      objectPaths.push(...(profile.documents ?? []).map(d => d.objectPath));
      const referenced = offers.some(o => o.driverId === profile.id && o.status === "accepted" && !removedLoads.has(o.loadId));
      if (referenced) save("driver_profiles", {
        ...profile, vehiclePlate: "", currentRegionId: "", bio: null, documents: [], reviewHistory: [], ratingHistory: [],
        reviewStatus: "none", reviewReason: null, rating: 0, ratingCount: 0, completedTrips: 0,
        availableFrom: new Date().toISOString(), capacityKg: 0, capacityM3: 0, sharedLoadAvailableKg: 0, sharedLoadAvailableM3: 0,
      });
      else remove("driver_profiles", profile.id);
    } else {
      const reviewHistory = profile.reviewHistory?.filter(r => r.reviewerId !== owner.id);
      const ratingHistory = profile.ratingHistory?.filter(r => !ownLoads.has(r.loadId));
      if (reviewHistory?.length !== profile.reviewHistory?.length || ratingHistory?.length !== profile.ratingHistory?.length) {
        save("driver_profiles", { ...profile, reviewHistory, ratingHistory });
      }
    }
  }
  for (const offer of offers) {
    if (removedLoads.has(offer.loadId)) remove("cargo_offers", offer.id);
    else if (ownDrivers.has(offer.driverId)) {
      if (offer.status === "accepted") save("cargo_offers", { ...offer, message: null, counterMessage: null });
      else remove("cargo_offers", offer.id);
    } else if (ownLoads.has(offer.loadId)) save("cargo_offers", { ...offer, message: null, counterMessage: null });
  }
  return { deleted, updated, imageIds: [...imageIds], objectPaths: [...new Set(objectPaths)], trackingLoadIds: [...new Set([...ownLoads, ...historicalLoads])] };
}
