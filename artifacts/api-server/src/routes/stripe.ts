import { Router } from "express";
import {
  listings,
  orders,
  users,
  sanitizeUser,
  type StoredOrder,
} from "../data/store.js";
import { authenticateToken, type AuthRequest } from "../middleware/auth.js";
import { getRecord, persistItem, persistRecord } from "../lib/persistence.js";
import { getUncachableStripeClient } from "../stripeClient.js";

const router = Router();
const PAYMENT_COLLECTION = "payments";
const CUSTOMER_COLLECTION = "stripe_customers";
const PRICE_COLLECTION = "stripe_prices";

type PaymentRecord = {
  id: string;
  orderId: string;
  userId: string;
  sessionId: string;
  paymentIntentId: string | null;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "expired";
  createdAt: string;
  updatedAt: string;
};

function getParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

function orderTotal(order: StoredOrder): number {
  return order.totalPrice + (order.deliveryPrice ?? 0);
}

function stripeAmount(amount: number, currency: string): number {
  // Stripe expects the smallest unit. UZS is represented with two decimal
  // places by the connected account, just like USD.
  return ["uzs", "usd"].includes(currency) ? Math.round(amount * 100) : Math.round(amount);
}

async function syncPaymentStatus(
  payment: PaymentRecord,
): Promise<PaymentRecord> {
  const stripe = await getUncachableStripeClient();
  const session = await stripe.checkout.sessions.retrieve(payment.sessionId);
  const nextStatus: PaymentRecord["status"] =
    session.payment_status === "paid"
      ? "paid"
      : session.status === "expired"
        ? "expired"
        : payment.status;
  const nextPayment: PaymentRecord = {
    ...payment,
    status: nextStatus,
    paymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : payment.paymentIntentId,
    updatedAt: new Date().toISOString(),
  };

  if (
    nextPayment.status !== payment.status ||
    nextPayment.paymentIntentId !== payment.paymentIntentId
  ) {
    await persistRecord(PAYMENT_COLLECTION, payment.orderId, nextPayment);
  }

  if (nextPayment.status === "paid") {
    const order = orders.find((item) => item.id === payment.orderId);
    if (order && order.status === "pending") {
      order.status = "confirmed";
      await persistItem("orders", order);
    }
  }
  return nextPayment;
}

router.post(
  "/payments/checkout",
  authenticateToken,
  async (req: AuthRequest, res) => {
    const { orderId, currency = "uzs" } = req.body as {
      orderId?: string;
      currency?: string;
    };
    if (!orderId || !["uzs", "usd"].includes(currency)) {
      res.status(400).json({ error: "validation", message: "orderId and a supported currency are required" });
      return;
    }

    const order = orders.find((item) => item.id === orderId);
    if (!order) {
      res.status(404).json({ error: "not_found", message: "Order not found" });
      return;
    }
    if (order.buyerId !== req.userId) {
      res.status(403).json({ error: "forbidden", message: "Only the buyer can pay this order" });
      return;
    }
    if (order.status !== "pending") {
      res.status(409).json({ error: "conflict", message: "This order is not awaiting payment" });
      return;
    }

    const existing = await getRecord(PAYMENT_COLLECTION, order.id) as PaymentRecord | null;
    if (existing?.status === "pending") {
      try {
        const stripe = await getUncachableStripeClient();
        const session = await stripe.checkout.sessions.retrieve(existing.sessionId);
        if (session.status !== "expired" && session.url) {
          res.json({
            orderId: order.id,
            sessionId: existing.sessionId,
            url: session.url,
            status: existing.status,
          });
          return;
        }
        await persistRecord(PAYMENT_COLLECTION, order.id, {
          ...existing,
          status: "expired",
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Unable to recover pending Stripe checkout", error);
        res.status(502).json({
          error: "payment_provider_error",
          message: "Visa checkout sessiyasini qayta ochib bo'lmadi.",
        });
        return;
      }
    }
    if (existing?.status === "paid") {
      res.json({ orderId: order.id, sessionId: existing.sessionId, status: existing.status });
      return;
    }

    try {
      const stripe = await getUncachableStripeClient();
      let customerId = (await getRecord(CUSTOMER_COLLECTION, req.userId!))?.customerId as string | undefined;
      const buyer = users.find((item) => item.id === req.userId);
      if (!customerId) {
        const customer = await stripe.customers.create(
          {
            name: buyer?.name,
            metadata: { turanUserId: req.userId! },
          },
          { idempotencyKey: `turan-customer-${req.userId}` },
        );
        customerId = customer.id;
        await persistRecord(CUSTOMER_COLLECTION, req.userId!, { customerId });
      }

      const listing = listings.find((item) => item.id === order.listingId);
      const total = orderTotal(order);
      const priceRecord = await getRecord(PRICE_COLLECTION, order.id);
      const expectedUnitAmount = stripeAmount(total, currency);
      let priceId = priceRecord?.priceId as string | undefined;
      if (
        priceId &&
        (priceRecord?.currency !== currency ||
          priceRecord?.unitAmount !== expectedUnitAmount)
      ) {
        priceId = undefined;
      }
      if (!priceId) {
        const product = await stripe.products.create(
          {
            name: listing?.title ?? `Turan Market order ${order.id}`,
            metadata: { turanOrderId: order.id, listingId: order.listingId },
          },
          { idempotencyKey: `turan-product-${order.id}` },
        );
        const price = await stripe.prices.create(
          {
            product: product.id,
            unit_amount: expectedUnitAmount,
            currency,
            metadata: { turanOrderId: order.id },
          },
          { idempotencyKey: `turan-price-v2-${order.id}-${currency}-${expectedUnitAmount}` },
        );
        priceId = price.id;
        await persistRecord(PRICE_COLLECTION, order.id, {
          priceId,
          productId: product.id,
          amount: total,
          unitAmount: expectedUnitAmount,
          currency,
        });
      }

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const session = await stripe.checkout.sessions.create(
        {
          customer: customerId,
          mode: "payment",
          payment_method_types: ["card"],
          line_items: [{ price: priceId, quantity: 1 }],
          metadata: { turanOrderId: order.id, turanUserId: req.userId! },
          success_url: `${baseUrl}/api/payments/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/api/payments/cancel`,
        },
        { idempotencyKey: `turan-checkout-v3-card-${order.id}-${currency}-${expectedUnitAmount}` },
      );
      if (!session.url) {
        res.status(502).json({ error: "payment_unavailable", message: "Stripe checkout URL was not returned" });
        return;
      }

      const payment: PaymentRecord = {
        id: order.id,
        orderId: order.id,
        userId: req.userId!,
        sessionId: session.id,
        paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
        amount: total,
        currency,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await persistRecord(PAYMENT_COLLECTION, order.id, payment);
      res.status(201).json({ orderId: order.id, sessionId: session.id, url: session.url, status: payment.status });
    } catch (error) {
      console.error("Stripe checkout failed", error);
      res.status(502).json({
        error: "payment_provider_error",
        message: "Stripe checkout yaratib bo'lmadi. Buyurtma hali to'lanmagan.",
      });
    }
  },
);

router.get(
  "/payments/orders/:orderId",
  authenticateToken,
  async (req: AuthRequest, res) => {
    const orderId = getParam(req.params.orderId);
    const order = orders.find((item) => item.id === orderId);
    if (!order) {
      res.status(404).json({ error: "not_found", message: "Order not found" });
      return;
    }
    if (order.buyerId !== req.userId && order.sellerId !== req.userId) {
      res.status(403).json({ error: "forbidden", message: "Access denied" });
      return;
    }
    const payment = await getRecord(PAYMENT_COLLECTION, order.id) as PaymentRecord | null;
    if (!payment) {
      res.json({ payment: null, orderStatus: order.status });
      return;
    }
    const current = payment.status === "pending" ? await syncPaymentStatus(payment) : payment;
    res.json({ payment: current, orderStatus: order.status });
  },
);

router.get("/payments/success", (_req, res) => {
  res.type("html").send("<!doctype html><html><body><h1>To‘lov qabul qilindi</h1><p>Turan Market ilovasiga qaytishingiz mumkin.</p></body></html>");
});

router.get("/payments/cancel", (_req, res) => {
  res.type("html").send("<!doctype html><html><body><h1>To‘lov bekor qilindi</h1><p>Buyurtma hali to‘lanmagan.</p></body></html>");
});

export default router;