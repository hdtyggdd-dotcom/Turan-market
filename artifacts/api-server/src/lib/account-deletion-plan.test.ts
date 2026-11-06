import assert from "node:assert/strict";
import test from "node:test";
import { buildDeletionPlan, DeletionConflict, type CoreRecord } from "./account-deletion-plan.js";
import { hashPassword, verifyPassword, type StoredUser } from "../data/store.js";

const owner: StoredUser = {
  id: "synthetic-owner", name: "Private Synthetic Name", phone: "+00000000000",
  password: hashPassword("synthetic-password"), role: "seller", deleted: false,
  sellerBadge: null, verificationStatus: "none", regionId: "private-region",
  districtId: "private-district", neighborhoodId: "private-neighborhood",
  rating: 4, totalSales: 20, createdAt: "2026-01-01",
};
const row = (collection: string, id: string, payload: Record<string, unknown>): CoreRecord => ({ collection, id, payload: { id, ...payload } });
const base = () => [
  row("users", owner.id, owner as unknown as Record<string, unknown>),
  row("listings", "product", { userId: owner.id, title: "Private title", description: "Private contact", images: ["/api/images/img_test"], lat: 11, lng: 12, regionId: "private-region", districtId: "private-district" }),
];
test("unreferenced listings are removed; login identity and locality are erased", () => {
  const result = buildDeletionPlan(owner, base());
  assert(result.deleted.some(r => r.collection === "listings" && r.id === "product"));
  assert.deepEqual(result.imageIds, ["img_test"]);
  const user = result.updated.find(r => r.collection === "users")!.payload as unknown as StoredUser;
  assert.equal(user.deleted, true); assert.equal(user.phone, ""); assert.equal(user.regionId, null);
  assert.equal(verifyPassword("synthetic-password", user.password), false);
  assert(!JSON.stringify(result).includes(owner.name));
  assert(!JSON.stringify(result).includes(owner.phone));
});
test("third-party completed receipts survive without contact, image, note or locality", () => {
  const rows = [...base(), row("orders", "receipt", { buyerId: "other-person", sellerId: owner.id, listingId: "product", status: "delivered", totalPrice: 150, notes: "Private contact" })];
  const result = buildDeletionPlan(owner, rows);
  const receipt = result.updated.find(r => r.collection === "orders")!.payload;
  assert.equal(receipt.totalPrice, 150); assert.equal(receipt.buyerId, "other-person"); assert.equal(receipt.notes, null);
  const listing = result.updated.find(r => r.collection === "listings")!.payload;
  assert.deepEqual(listing.images, []); assert.equal(listing.status, "paused");
  assert.equal(listing.regionId, ""); assert.equal(listing.lat, null);
});
for (const status of ["pending", "confirmed", "delivering"]) {
  test(`active ${status} order prevents any plan from being returned`, () => {
    assert.throws(() => buildDeletionPlan(owner, [...base(), row("orders", "active", { buyerId: owner.id, sellerId: "other", status })]), DeletionConflict);
  });
}
test("active accepted transport prevents closing either shipper or assigned driver", () => {
  const load = row("cargo_loads", "trip", { shipperId: owner.id, status: "in_transit" });
  assert.throws(() => buildDeletionPlan(owner, [...base(), load]), DeletionConflict);
  assert.throws(() => buildDeletionPlan(owner, [...base(),
    row("driver_profiles", "driver", { userId: owner.id }),
    row("cargo_loads", "trip", { shipperId: "other", status: "accepted" }),
    row("cargo_offers", "offer", { loadId: "trip", driverId: "driver", status: "accepted" }),
  ]), DeletionConflict);
});
test("private documents are queued; completed truck history becomes non-identifying", () => {
  const result = buildDeletionPlan(owner, [...base(),
    row("driver_profiles", "driver", { userId: owner.id, vehiclePlate: "PRIVATE", currentRegionId: "private-region", documents: [{ objectPath: "driver-documents/synthetic" }] }),
    row("cargo_loads", "trip", { shipperId: "other", status: "delivered" }),
    row("cargo_offers", "offer", { loadId: "trip", driverId: "driver", status: "accepted", message: "Private contact", counterMessage: "Private contact" }),
  ]);
  assert.deepEqual(result.objectPaths, ["driver-documents/synthetic"]);
  const profile = result.updated.find(r => r.collection === "driver_profiles")!.payload;
  assert.deepEqual(profile.documents, []); assert.equal(profile.vehiclePlate, ""); assert.equal(profile.currentRegionId, "");
  assert.equal(result.updated.find(r => r.collection === "cargo_offers")!.payload.message, null);
  assert(result.trackingLoadIds.includes("trip"));
});
test("last administrator is protected but a transferable administrator can close", () => {
  const admin = { ...owner, role: "admin" as const };
  assert.throws(() => buildDeletionPlan(admin, [row("users", admin.id, admin as unknown as Record<string, unknown>)]), DeletionConflict);
  assert.doesNotThrow(() => buildDeletionPlan(admin, [row("users", "other-admin", { role: "admin" })]));
});
