---
name: Native handoff verification
description: Limits of headless browser checks for phone dialers and cleanup of disposable test accounts.
---

Browser checks cannot establish that a phone dialer or another native app actually opens.

**Why:** Headless phone-link interception did not observe the OS handoff; repeated attempts exceeded the browser worker lifetime and erased its temporary credentials.

**How to apply:** Use bounded browser checks for correct participant contacts, safe destinations and absence of unintended navigation/payment requests. Report native handoff as unverified until checked on a real supported device. Do not repeatedly retry OS-dependent behavior in headless browsers.

Keep the exact disposable test-account identifier available outside the browser notebook until cleanup succeeds.

**Why:** A browser worker reset can erase its local variables and credentials before account deletion.

**How to apply:** Record only the synthetic account identifier in temporary test coordination, not real-user credentials or project memory. Delete only the positively identified synthetic account using the existing account-closure lifecycle; never broadly remove similarly named users.
