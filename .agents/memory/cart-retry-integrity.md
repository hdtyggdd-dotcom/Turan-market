---
name: Cart retry integrity
description: Safely retrying checkout when an order response or cart storage update fails.
---

An explicit authentication rejection requires reauthentication, not deletion of this account's cart or uncertain purchase journals.

**Why:** Restoring a cached profile after a server 401 made the app appear signed in while every cart operation failed. An expired credential is not an account-deletion response.

**How to apply:** Treat 401 separately from network outages and account closure. Keep pending purchase identities across renewed sessions, and bind late unauthorized responses to their original token so they cannot sign out a newer session.

When checkout has an uncertain outcome, preserve the original request identity on retry. Do not tell a buyer to remove and re-add the product as a way to retry that request; first direct them to their existing orders.

**Why:** An order can already be saved even if its response is lost or removing the saved cart item fails. A newly added cart item represents a new purchase and can create a second order.

**How to apply:** Keep retries tied to the original purchase attempt, show ambiguous outcomes without claiming that no order exists, and require review of orders when a retry conflicts with changed quantities.

When migrating device carts, merge overlapping unsubmitted products using the higher quantity rather than adding both counts. If different purchase identities already involve an order, retain them as separate attempts instead of folding them together.

**Why:** Device carts may be copies of the same intended purchase; summing them doubles quantities. Combining order-linked identities can erase the only safe retry identifier.

**How to apply:** Keep the original identity and quantity for recorded purchases. Account logout, authentication expiry, or a lost response must not replace an uncertain operation with a new one.

Checkout must share the buyer-cart database lock with cart changes and use insert-only purchase creation. Reading a server-local cache before an upsert does not provide idempotency across workers.

**Why:** Simultaneous retries can otherwise replace the first accepted quantity, and cart edits can pass their "no order yet" check while checkout is committing.

**How to apply:** Serialize checkout with cart edits, compare retry input against the durable purchase before checking current listing availability, and keep saved price/date/status instead of recomputing them.
