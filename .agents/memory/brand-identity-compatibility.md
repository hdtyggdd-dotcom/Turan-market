---
name: Display-brand and application-identity compatibility
description: Why old internal identifiers must survive the Cosmos Market display rebrand.
---

The Cosmos Market change is a display-brand rename, not a new application or account migration. Historical Turan/osavdo identifiers intentionally remain behind the new visible name.

**Why:** Existing native installations, deep links, remembered sessions, saved carts and provider connections depend on stable identity and storage namespaces. Cosmetic normalization of those old strings can break upgrades or make customer state appear missing.

**How to apply:** Update displayed names, AI guidance, legal text, app metadata and active artwork together. Do not rename native identifiers, Expo routing identity, saved-storage keys, API domains or provider identities merely to remove old brand strings. A deliberate identity or domain migration requires separate scope and compatibility planning.
