---
name: RevenueCat sandbox scope
description: Domestic subscription rollout, public API provisioning quirks and safeguards before live billing.
---

Keep household-service provider subscriptions in sandbox only until live currency, trial-start terms and Google Play billing configuration are confirmed. Sandbox access is not proof of a real payment and must never enable seller commission deductions or a general marketplace paywall.

**Why:** The owner authorized domestic product payments and provider subscriptions, but merchant onboarding and real billing terms remain incomplete. RevenueCat Test Store rejected UZS; its USD sample is explicitly not a conversion or replacement of the planned 30-thousand fee.

**How to apply:** Display prices from the SDK, clearly label test purchases and keep production keys/charging gated. Do not apply household-service pricing to all sellers. Bind SDK operations to stable internal account IDs, not phone numbers, and prevent stale account operations or state from carrying across logins.

The generic connected project can initially have no apps. The public create-app API rejects type test_store; creating a named project through the public create-project API automatically provisions its Test Store.

**Why:** Assuming the connector's initial project had a Test Store prevented setup, and the create-app API explicitly rejected that type. A normally created project did provision one.

**How to apply:** Inspect apps before seeding. Reuse the configured product project on subsequent runs; do not repeatedly create projects or attempt unsupported Test Store create-app calls. Use the connection's authenticated proxy rather than expecting the legacy generated credential helper to exist.

Inspect browser SDK support before using native-only cache or receipt operations.

**Why:** The installed browser SDK rejects invalidateCustomerInfoCache asynchronously, outside the public wrapper's returned promise, so catching the awaited call did not prevent an Expo error overlay.

**How to apply:** Use the supported browser getCustomerInfo path. Browser restore reads the existing customer state and is not proof of restoring a Google Play receipt; verify real restore separately in a native build.

Verify actual customer-information permissions before promising server verification or remote account erasure.

**Why:** The connector advertised general read/write permissions and allowed catalog setup, but customer DELETE returned 403 requiring customer_information:customers:read_write. Synthetic local accounts were erased, while external Test Store records could not be removed with that credential.

**How to apply:** Treat catalog permissions as separate from customer-data permissions. Resolve the provider scope before live billing and account-deletion integration; do not silently claim remote cleanup succeeded.
