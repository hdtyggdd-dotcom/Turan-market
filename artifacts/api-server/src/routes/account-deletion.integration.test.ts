import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

// Explicit opt-in: mutate only freshly created synthetic development accounts.
test("development account closure revokes credentials, purges photos and redacts third-party receipts", { skip: process.env.RUN_DELETION_INTEGRATION !== "1" }, async () => {
  const base = `https://${process.env.REPLIT_DEV_DOMAIN}/api`;
  async function call(path: string, method = "GET", body?: unknown, token?: string) {
    const response = await fetch(base + path, { method, headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }, ...(body ? { body: JSON.stringify(body) } : {}) });
    // Integration assertions deliberately exercise heterogeneous JSON routes.
    const data: any = response.headers.get("content-type")?.includes("application/json") ? await response.json() : await response.text();
    return { status: response.status, data };
  }
  const password = `synthetic-${randomUUID()}`;
  const number = String(Date.now()).slice(-5);
  const sellerPhone = `+9980000${number}`;
  const buyerPhone = `+9980001${number}`;
  const seller = await call("/auth/register", "POST", { phone: sellerPhone, password, name: "Synthetic Deletion Seller", role: "seller" });
  const buyer = await call("/auth/register", "POST", { phone: buyerPhone, password, name: "Synthetic Deletion Buyer", role: "buyer" });
  assert.equal(seller.status, 201); assert.equal(buyer.status, 201);
  const token: string = seller.data.token;
  const buyerToken: string = buyer.data.token;
  const deletion = { phone: sellerPhone, password, confirmation: true, requestId: randomUUID() };
  const buyerDeletion = { phone: buyerPhone, password, confirmation: true, requestId: randomUUID() };
  let orderId: string | undefined;
  try {
  const image = await call("/upload", "POST", { mimeType: "image/png", data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aBZ8AAAAASUVORK5CYII=" }, token);
  assert.equal(image.status, 200);
  const catalogue = await call("/listings");
  const ref = catalogue.data.items[0];
  const listing = await call("/listings", "POST", {
    title: "Synthetic deletion-only product", description: "Synthetic private note", price: 1000,
    priceUnit: "dona", categoryId: ref.categoryId, regionId: ref.regionId, districtId: ref.districtId,
    images: [image.data.url], listingType: "savdo", elanTur: "oddiy",
  }, token);
  assert.equal(listing.status, 201);
  const order = await call("/orders", "POST", { listingId: listing.data.id, quantity: 1, notes: "Synthetic private order note" }, buyerToken);
  assert.equal(order.status, 201);
  orderId = order.data.id;
  const cart = await call("/cart/items", "POST", { listingId: listing.data.id, quantity: 1, operationId: randomUUID(), requestId: randomUUID() }, buyerToken);
  assert.equal(cart.status, 200);
  assert.equal((await call("/account-deletion", "POST", { ...deletion, confirmation: false }, token)).status, 400);
  assert.equal((await call("/account-deletion", "POST", { ...deletion, password: "wrong" }, token)).status, 401);
  assert.equal((await call("/account-deletion", "POST", deletion, token)).status, 409);
  assert.equal((await call("/auth/me", "GET", undefined, token)).status, 200);
  assert.equal((await call(`/orders/${order.data.id}/status`, "PUT", { status: "cancelled" }, token)).status, 200);
  const closed = await call("/account-deletion", "POST", deletion, token);
  assert.equal(closed.status, 200); assert.equal(closed.data.status, "deleted"); assert.equal(closed.data.filesPending, false);
  assert.equal((await call("/auth/me", "GET", undefined, token)).status, 410);
  assert.equal((await call("/auth/login", "POST", { phone: sellerPhone, password })).status, 401);
  assert.equal((await call("/account-deletion", "POST", deletion, token)).status, 200, "uncertain response retry uses the same receipt");
  assert.equal((await call(image.data.url.replace("/api", ""))).status, 404);
  const receipts = await call("/orders", "GET", undefined, buyerToken);
  const receipt = receipts.data.find((item: { id: string }) => item.id === order.data.id);
  assert.equal(receipt.seller.phone, ""); assert.equal(receipt.notes, null);
  assert.deepEqual(receipt.listing.images, []); assert.equal(receipt.listing.lat, null);
  assert.equal((await call("/cart", "GET", undefined, buyerToken)).data.items.length, 0);
  assert.equal((await call("/account-deletion", "POST", buyerDeletion, buyerToken)).status, 200);
  } finally {
    if (orderId) await call(`/orders/${orderId}/status`, "PUT", { status: "cancelled" }, token);
    await call("/account-deletion", "POST", deletion, token);
    await call("/account-deletion", "POST", buyerDeletion, buyerToken);
  }
});
