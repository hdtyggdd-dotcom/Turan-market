---
name: Account closure policy
description: Privacy and shared-history boundaries when customers close their accounts.
---

Account closure must remove personal contacts and exact locations without destroying another participant’s completed receipt. Keep only a non-login anonymous technical identity for shared completed history; remove free-text contacts and embedded product/profile snapshots as well as the main profile.

**Why:** One customer’s closure should not erase another customer’s transaction record or let someone abandon an accepted delivery. A profile disappearing from one screen alone is not meaningful deletion if other carts, sessions, or server copies still expose its contacts.

**How to apply:** Block closure while orders or accepted transport remain active, and protect the last administrator until management is transferred. Revoke sessions across workers, clean this account’s local state without clearing other accounts’ carts, and make private-file deletion failures durably retryable rather than claiming immediate completion.
