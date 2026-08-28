---
name: Operational driver trust
description: Trust boundary between provisional driver registration and marketplace operating privileges.
---

A self-selected driver role or provisional profile must not grant cargo-market operating privileges. Bidding, acceptance, and active-driver discovery require server-authoritative identity approval plus verified real vehicle data; client badges and controls must reflect that state.

**Why:** Treating provisional accounts as verified drivers creates a physical handoff safety risk and falsely signals trust to shippers.

**How to apply:** Recheck operational eligibility when an offer is created and accepted, filter discovery results server-side, and never infer verification from role or profile existence.