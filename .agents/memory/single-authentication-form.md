---
name: Single authentication form
description: Country/language-only startup, transaction-time identity/locality, remembered self-chosen code and bounded optional GPS.
---

Initial entry requires only explicit country and language choices. Allow anonymous product browsing without asking for name, phone, GPS, province or district. Collect identity and locality when entering purchase, selling/ad posting or cargo actions.

**Why:** The owner revised the earlier full-entry requirement after reporting locality-selection friction: country and language are mandatory at entry; phone, name and locality are asked before buying, selling, posting ads or cargo transport.

**How to apply:** Keep one real credential form for transaction-time authentication, not fake guest accounts. Preserve returning-account identity, role, locality, orders and remembered code. Gate protected actions without blocking catalogue browsing; allow manual locality if GPS fails. Country and language remain separate explicit choices; browsing locality must not overwrite account or ad locality.

The owner clarified that the account holder chooses their own code; it is not an SMS-delivered code. A valid login should remain saved rather than requesting the code at every app launch.

**Why:** After the SMS option was presented, the owner explicitly corrected it to a self-chosen, remembered code.

**How to apply:** Retain the existing hashed password credential behind the user-facing “kirish kodi” wording, including verification for returning users. Persist the authenticated session until explicit sign-out, server expiry, or revocation; do not prompt on every app launch. Preserve existing account identities and profile data. Do not add SMS or a fixed test code.

Province/district selection at entry is a user-reported usability problem, not a requirement to expand onboarding.

**Why:** The owner reported that choosing province and district in the entry section causes inconvenience and asked for advice on removing that friction.

**How to apply:** The owner chose deferred locality collection at transaction time. Keep transaction validation intact; preserve saved account and listing localities rather than replacing them with guessed defaults.

Do not change authentication when working on unrelated cart, category or cargo requests.

**Why:** The owner clarified that only the entry screen should return to the published version, while category navigation, cart, and cargo changes must remain.

**How to apply:** Follow the current country/language-only initial entry scope above; do not reintroduce mandatory account/locality collection on app launch. Do not reopen a completed chooser every launch. Keep session-expiry security and unrelated cart/cargo functionality intact.

Bound the entire GPS attempt, including permission acquisition and location detection, not only the final coordinate request.

**Why:** Expo's web permission request can itself invoke geolocation without a timeout. A timeout added only after permission resolves does not prevent the entry form from waiting indefinitely.

**How to apply:** Use browser geolocation for web consent and coordinates, retain native permission APIs on mobile, and ensure timeout or denial releases the form for manual location selection. Ignore late results after the attempt has timed out.

Show a representative country flag beside every language choice and the selected language.

**Why:** The owner explicitly requested flags in the language selector, separately from the existing country selector.

**How to apply:** Treat the flag as a language-selection visual, not as the user's actual country. Adding or changing these flags must not change saved country/location, phone numbering, credentials or session behavior.
