---
name: Stripe payment integrity
description: Currency minor-unit and idempotency-key rules for marketplace checkout.
---

Stripe checkout amounts must be sent in the connected account's smallest currency unit, and an idempotency key must encode every parameter whose change would alter the Stripe request, including currency and amount version.

**Why:** Reusing an idempotency key after changing a Price or Checkout Session amount causes Stripe to reject the request, while sending a major-unit UZS value creates an unexpectedly tiny charge and can hit Stripe's minimum amount.

**How to apply:** When payment parameters change, change the request's idempotency key version or parameter suffix too; persist the exact minor-unit amount with cached Price records and invalidate cached records when it differs.