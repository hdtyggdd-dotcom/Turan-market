---
name: Native handoff verification
description: Limits of headless browser checks for phone dialers and cleanup of disposable test accounts.
---

Browser checks cannot establish that a phone dialer or another native app actually opens.

**Why:** Headless phone-link interception did not observe the OS handoff; repeated attempts exceeded the browser worker lifetime and erased its temporary credentials.

**How to apply:** Use bounded browser checks for correct participant contacts, safe destinations and absence of unintended navigation/payment requests. Report native handoff as unverified until checked on a real supported device. Do not repeatedly retry OS-dependent behavior in headless browsers.

Keep the exact disposable test-account identity and its synthetic deletion credentials outside ephemeral browser, shell or notebook variables before creating it, until cleanup succeeds.

**Why:** Browser worker resets and short-lived scripts can erase local variables and synthetic credentials before account deletion.

**How to apply:** Use a private temporary file for synthetic test identity, never project memory or real-user credentials. Confirm the deletion contract and retain a stable request ID for retries. Delete only the positively identified synthetic account using the existing account-closure lifecycle; never broadly remove similarly named users.
