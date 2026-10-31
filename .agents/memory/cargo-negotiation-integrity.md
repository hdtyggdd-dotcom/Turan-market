---
name: Cargo negotiation integrity
description: State and authorization rules that make counter-offer prices binding and auditable.
---

A shipper counterproposal cannot be accepted as a transport booking until the offering driver explicitly accepts it. Driver acceptance must promote the counter amount to the authoritative offer amount before the shipper performs final acceptance; rejection must leave no actionable booking at the old price.

**Why:** Displaying a counter without binding it to the final accepted amount creates transaction-integrity failures and disputes over the payable price.

**How to apply:** Keep each transition server-authoritative and actor-scoped: driver offers, shipper counters, that driver accepts or rejects the counter, and the shipper finally accepts only the resulting pending agreed-price offer.