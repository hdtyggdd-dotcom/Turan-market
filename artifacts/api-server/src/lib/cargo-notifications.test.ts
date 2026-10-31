import assert from "node:assert/strict";
import { test } from "node:test";
import { deliverStoredNotification, registerToken, unregisterToken } from "./cargo-notifications.js";
import type { StoredCargoNotification } from "../data/store.js";

test("verification push uses only the owner's tokens and a safe application target; gateway failures are contained", async () => {
  const notification: StoredCargoNotification = {
    id: "push-review-test", userId: "push-review-owner", loadId: null, target: "driver_verification",
    title: "Haydovchi arizangiz rad etildi", message: "Sababini arizangizda ko‘ring.",
    type: "system", read: false, createdAt: new Date().toISOString(),
  };
  const originalFetch = globalThis.fetch;
  const ownerToken = "ExpoPushToken[review-owner]";
  const otherToken = "ExpoPushToken[review-other]";
  registerToken(notification.userId, ownerToken);
  registerToken("push-review-other", otherToken);
  try {
    let payload: Array<{ to: string; body: string; data: Record<string, unknown> }> = [];
    globalThis.fetch = async (_url, options) => {
      payload = JSON.parse(options!.body as string);
      return new Response(JSON.stringify({ data: [{ status: "ok" }] }), { status: 200 });
    };
    deliverStoredNotification(notification);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(payload.length, 1);
    assert.equal(payload[0]!.to, ownerToken);
    assert.equal(payload[0]!.body, notification.message);
    assert.deepEqual(payload[0]!.data, { loadId: null, notificationId: notification.id, target: "driver_verification" });

    globalThis.fetch = async () => { throw new Error("Simulated network outage"); };
    assert.doesNotThrow(() => deliverStoredNotification(notification));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(notification.read, false);

    globalThis.fetch = async () => new Response(JSON.stringify({
      data: [{ status: "error", details: { error: "DeviceNotRegistered" } }],
    }), { status: 200 });
    deliverStoredNotification(notification);
    await new Promise(resolve => setImmediate(resolve));
    let calls = 0;
    globalThis.fetch = async () => { calls++; return new Response("{}"); };
    deliverStoredNotification(notification);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(calls, 0, "expired device tokens must be removed");
  } finally {
    globalThis.fetch = originalFetch;
    unregisterToken(notification.userId, ownerToken);
    unregisterToken("push-review-other", otherToken);
  }
});
