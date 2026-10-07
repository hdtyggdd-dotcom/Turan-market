---
name: Payment scope
description: Owner's payment suspension, introductory access pricing, and seller commission policy.
---

Keep live charging disabled until the requested domestic-payment flow is selected and properly configured. Do not automatically reconnect Stripe. The earlier suspension is not authorization to delete historical data.

**Why:** On 2026-10-05 the owner requested temporary Stripe removal while reporting that publishing was blocked. On 2026-10-06 a Publishing screenshot explicitly showed “Connect a live Stripe account before publishing”: the workspace integration can block publication even when application payments are disabled.

**How to apply:** Continue supporting order creation and tracking without online card payment. Preserve historical payment records unless the owner explicitly authorizes deleting them. Distinguish disabled application code from the workspace connection: do not claim the latter is disconnected until it has actually been disconnected.
When publication is blocked by the live Stripe requirement, removing code alone is insufficient. Use the documented workspace integration removal flow; do not reconnect Stripe or use fake credentials to avoid the blocker.

## Payment rollout geography

The owner wants payments within Uzbekistan first, with international payment functions added later. The domestic phase includes both customer product-purchase payments and household-service provider subscriptions / seller commissions.

Include the requested card-acceptance scope for Uzum, AVO and other banks, including Visa where supported. Do not treat an issuer name as proof of the card network or guaranteed acceptance.

**Why:** The owner explicitly set this order while preparing the app for Google Play, confirmed both payment purposes, and authorized support for these cards.

**How to apply:** Scope the first payment phase to Uzbekistan. Confirm merchant eligibility and actual card acceptance before integration; do not assume a global provider supports an Uzbekistan merchant or activate international payments as part of this phase. Preserve the already agreed pricing rules.

## Download and introductory access pricing

The owner stated: downloading the app is free, and using it is free for one month.
The owner specified household services ("maishiy xizmatlar") at 30,000 per month
after introductory access, payable by the service-providing ustalar, not the
customers ordering those services. Currency, trial start event, pricing for other
categories apart from the seller commission below, and collection method remain
unconfirmed.

**Why:** The owner clarified the intended pricing while preparing the Google Play
listing. Free download is distinct from free ongoing access.

**How to apply:** Treat the store download as free. Do not apply the household
services price to every category, invent missing terms, or implement a
trial/paywall or reconnect payments until its terms are confirmed.

## Seller commission

Seller commission ranges from 2% to 20%. The owner explicitly says selling more
increases the rate, while selling less reduces it. Do not reverse this into a
volume discount.

**Why:** The owner stated "sotuvchi qancha ko‘p sotsa shuncha ko‘p ... kam sotsa
foiz ham kam bo‘ladi" while defining the app's commercial terms, then changed
the maximum to 20% and confirmed the final range as "2 foizdan 20 foizgacha".

**How to apply:** Preserve the increasing rate and 20% cap. Sales measurement
is the total monetary sales amount, not the number of products sold, as confirmed
by the owner. The owner confirmed each month's sales are measured separately,
not lifetime sales. Exact thresholds, commission base, and interaction with the
free introductory month are not confirmed. Do not implement an unapproved tier
table or enable deductions before these terms are settled.
