import { cargoNotifications, generateId, type StoredCargoNotification } from "../data/store.js";
import { logger } from "./logger.js";

const tokens = new Map<string, string>();

export function registerToken(userId: string, token: string) {
  // One device token belongs to only its currently signed-in account.
  tokens.set(token, userId);
}

export function unregisterToken(userId: string, token: string) {
  if (tokens.get(token) === userId) tokens.delete(token);
}

export function sendCargoNotification(
  userId: string,
  loadId: string,
  title: string,
  message: string,
  type: "tracking" | "offer" | "system",
) {
  const notification = {
    id: generateId(), userId, loadId, title, message, type, read: false,
    createdAt: new Date().toISOString(),
  };
  cargoNotifications.unshift(notification);
  deliverStoredNotification(notification);
}

// Durable callers commit their in-app notification before invoking best-effort push.
export function deliverStoredNotification(notification: StoredCargoNotification) {
  const { userId, loadId, title, message } = notification;
  const recipients = [...tokens.entries()].filter(([, owner]) => owner === userId);
  if (!recipients.length) return;
  void (async () => {
    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(recipients.map(([to]) => ({
          to, title, body: message, sound: "default", channelId: "cargo",
          data: { loadId, notificationId: notification.id },
        }))),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`Push gateway returned ${response.status}`);
      const result = await response.json() as {
        data?: Array<{ status: string; details?: { error?: string } }>;
        errors?: unknown[];
      };
      if (result.errors?.length) throw new Error("Push gateway rejected notification batch");
      result.data?.forEach((ticket, index) => {
        if (ticket.status !== "error") return;
        if (ticket.details?.error === "DeviceNotRegistered") tokens.delete(recipients[index]![0]);
        logger.warn({ notificationId: notification.id, reason: ticket.details?.error }, "Cargo push delivery rejected");
      });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : "unknown", notificationId: notification.id }, "Cargo push delivery failed; in-app message remains available");
    }
  })();
}
