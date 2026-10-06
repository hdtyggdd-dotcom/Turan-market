---
name: Payment scope
description: Owner's decision to remove Stripe from Turan Market.
---

Keep online card payments disabled and Stripe disconnected until the owner explicitly requests re-enabling them. This is a temporary suspension, not authorization to delete historical data.

**Why:** On 2026-10-05 the owner requested temporary Stripe removal while reporting that publishing was blocked. On 2026-10-06 a Publishing screenshot explicitly showed “Connect a live Stripe account before publishing”: the workspace integration can block publication even when application payments are disabled.

**How to apply:** Continue supporting order creation and tracking without online card payment. Preserve historical payment records unless the owner explicitly authorizes deleting them. Distinguish disabled application code from the workspace connection: do not claim the latter is disconnected until it has actually been disconnected.
When publication is blocked by the live Stripe requirement, removing code alone is insufficient. Use the documented workspace integration removal flow; do not reconnect Stripe or use fake credentials to avoid the blocker.
