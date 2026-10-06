---
name: Payment scope
description: Owner's payment suspension and intended introductory access pricing.
---

Keep online card payments disabled and Stripe disconnected until the owner explicitly requests re-enabling them. This is a temporary suspension, not authorization to delete historical data.

**Why:** On 2026-10-05 the owner requested temporary Stripe removal while reporting that publishing was blocked. On 2026-10-06 a Publishing screenshot explicitly showed “Connect a live Stripe account before publishing”: the workspace integration can block publication even when application payments are disabled.

**How to apply:** Continue supporting order creation and tracking without online card payment. Preserve historical payment records unless the owner explicitly authorizes deleting them. Distinguish disabled application code from the workspace connection: do not claim the latter is disconnected until it has actually been disconnected.
When publication is blocked by the live Stripe requirement, removing code alone is insufficient. Use the documented workspace integration removal flow; do not reconnect Stripe or use fake credentials to avoid the blocker.

## Download and introductory access pricing

The owner stated: downloading the app is free, and using it is free for one month.
The owner specified household services ("maishiy xizmatlar") at 30,000 per month
after introductory access, payable by the service-providing ustalar, not the
customers ordering those services. Currency, trial start event, pricing for other
categories, and collection method remain unconfirmed.

**Why:** The owner clarified the intended pricing while preparing the Google Play
listing. Free download is distinct from free ongoing access.

**How to apply:** Treat the store download as free. Do not apply the household
services price to every category, invent missing terms, or implement a
trial/paywall or reconnect payments until its terms are confirmed.
