---
name: Operational driver trust
description: Trust boundary between provisional driver registration and marketplace operating privileges.
---

A self-selected driver role or provisional profile must not grant cargo-market operating privileges. Bidding, acceptance, and active-driver discovery require server-authoritative identity approval plus verified real vehicle data; client badges and controls must reflect that state.

**Why:** Treating provisional accounts as verified drivers creates a physical handoff safety risk and falsely signals trust to shippers.

**How to apply:** Recheck operational eligibility when an offer is created and accepted, filter discovery results server-side, and never infer verification from role or profile existence.

Do not automatically turn legacy badges or sample driver profiles into document approvals during migrations. Require the existing driver to submit evidence for manual review, even when this temporarily reduces the discoverable driver pool.

**Why:** Older approvals did not establish that anyone had actually reviewed identity and vehicle documents. Preserving their operating privileges would defeat the new physical-handoff safety boundary.

**How to apply:** Preserve old profile and rating aggregates without inventing document evidence or historical reviews; re-onboard the driver through the verification flow.

Eligibility changes and new transport commitments must share a synchronization boundary from authorization checks through persistence and publication.

**Why:** Independent moderation and cargo queues allow approval to be revoked while an already-validated acceptance is awaiting storage; it can then publish a new assignment after revocation completed.

**How to apply:** Coordinate bidding, counter acceptance and shipper acceptance with document/profile changes and moderator decisions. For multiple server instances, move this guarantee into a database transaction with approval/revision preconditions instead of relying on process-local queues.