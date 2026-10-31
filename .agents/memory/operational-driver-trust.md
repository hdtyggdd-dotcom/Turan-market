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

Treat expiry as a current operating restriction, not as deletion of the moderator's historical decision. Missing legacy expiry metadata must require renewed evidence; do not invent dates or assume old documents are permanent.

**Why:** A historical approval cannot prove a document is still valid, while erasing that approval would lose review history. Requiring fresh evidence keeps renewal tied to documents actually checked.

**How to apply:** Keep historical review decisions, but derive current eligibility whenever creating or accepting a new transport commitment and when showing verification status. Existing committed trips are not automatically cancelled by expiry.

Document dates use the full named UTC calendar day. Driving licenses require an expiry date; identity and vehicle registration can be explicitly declared permanent, subject to moderator confirmation.

**Why:** Document types and issuing jurisdictions differ; an absent date is not proof that a document is permanent. A single disclosed date boundary prevents device timezone differences from changing eligibility.

**How to apply:** Show the UTC convention in renewal forms and require moderators to confirm the submitted date or permanent-document declaration against the image before restoring eligibility.