---
name: Single authentication form
description: Owner's single-entry requirement and bounded GPS permission handling.
---

Keep one full entry form containing language selection, manual country selection or optional GPS permission/location selection, name, phone, and the authentication credential. Do not reintroduce a separate phone-only sign-in screen or put required entry controls only in an initial popup or second step.

**Why:** The owner explicitly asked to keep the fuller registration experience and repeated that language, country or GPS, name, phone, and code must all be in the entry section itself.

**How to apply:** Preserve returning-account access through the same form without overwriting the stored name, role, location, or orders. GPS denial must allow manual location selection rather than block account access. Any retained password path must still verify the existing password.

The owner clarified that the account holder chooses their own code; it is not an SMS-delivered code. A valid login should remain saved rather than requesting the code at every app launch.

**Why:** After the SMS option was presented, the owner explicitly corrected it to a self-chosen, remembered code.

**How to apply:** Retain the existing hashed password credential behind the user-facing “kirish kodi” wording, including verification for returning users. Persist the authenticated session until explicit sign-out, server expiry, or revocation; do not prompt on every app launch. Preserve existing account identities and profile data. Do not add SMS or a fixed test code.

Preserve the published authentication entry appearance when changing cart, categories, or cargo.

**Why:** The owner clarified that only the entry screen should return to the published version, while category navigation, cart, and cargo changes must remain.

**How to apply:** Keep language/manual-country selection available inside the full entry form. Do not force an additional first-install chooser to reopen on authentication routes. Keep session-expiry security and unrelated cart/cargo functionality intact.

Bound the entire GPS attempt, including permission acquisition and location detection, not only the final coordinate request.

**Why:** Expo's web permission request can itself invoke geolocation without a timeout. A timeout added only after permission resolves does not prevent the entry form from waiting indefinitely.

**How to apply:** Use browser geolocation for web consent and coordinates, retain native permission APIs on mobile, and ensure timeout or denial releases the form for manual location selection. Ignore late results after the attempt has timed out.
