---
name: Single authentication form
description: Owner's single-entry requirement and bounded GPS permission handling.
---

Keep one full entry form containing name, country, GPS permission/location selection, phone, and password. Do not reintroduce a separate phone-only sign-in screen.

**Why:** The owner explicitly asked to remove the short phone/password/country form and keep the fuller registration experience.

**How to apply:** Preserve returning-account access through the same form. Authentication must verify the existing password without overwriting the stored name, role, location, or orders. GPS denial must allow manual location selection rather than block account access.

Preserve the published authentication entry appearance when changing cart, categories, or cargo.

**Why:** The owner clarified that only the entry screen should return to the published version, while category navigation, cart, and cargo changes must remain.

**How to apply:** Keep the published language/manual-country chooser and full entry form. Do not force the first-install chooser to reopen on every authentication route. Keep session-expiry security and unrelated cart/cargo functionality intact.

Bound the entire GPS attempt, including permission acquisition and location detection, not only the final coordinate request.

**Why:** Expo's web permission request can itself invoke geolocation without a timeout. A timeout added only after permission resolves does not prevent the entry form from waiting indefinitely.

**How to apply:** Use browser geolocation for web consent and coordinates, retain native permission APIs on mobile, and ensure timeout or denial releases the form for manual location selection. Ignore late results after the attempt has timed out.
