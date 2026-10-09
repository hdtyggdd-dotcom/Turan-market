---
name: Display-brand and application-identity compatibility
description: Why old internal identifiers must survive display-brand changes, including Cosmis.
---

The owner confirmed the exact visible name **Cosmis**, replacing Cosmos Market. This is a display-brand rename, not a new application or account migration. Historical Turan/osavdo identifiers intentionally remain behind the new visible name.

**Why:** Existing native installations, deep links, remembered sessions, saved carts and provider connections depend on stable identity and storage namespaces. Cosmetic normalization of those old strings can break upgrades or make customer state appear missing.

**How to apply:** Update displayed names, AI guidance, legal text, app metadata and active artwork together. Do not rename native identifiers, Expo routing identity, saved-storage keys, API domains or provider identities merely to remove old brand strings. A deliberate identity or domain migration requires separate scope and compatibility planning.

The owner selected **cosmicmarket.net** for the website address. This is an explicit domain-migration request, not a further change to the confirmed display name **Cosmis**.

**Why:** The owner asked to replace the old website address separately from the application-name decision. A selected or registered domain is not necessarily connected to this deployment.

**How to apply:** Verify domain ownership through the publishing/DNS connection process before treating the new URL as live. Keep the existing domain available until the new address works over HTTPS, and preserve compatibility for installed apps and old image links. Do not claim the migration is complete based only on source-code replacements or domain registration.
