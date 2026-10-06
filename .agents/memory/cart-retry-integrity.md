---
name: Cart retry integrity
description: Safely retrying checkout when an order response or cart storage update fails.
---

When checkout has an uncertain outcome, preserve the original request identity on retry. Do not tell a buyer to remove and re-add the product as a way to retry that request; first direct them to their existing orders.

**Why:** An order can already be saved even if its response is lost or removing the saved cart item fails. A newly added cart item represents a new purchase and can create a second order.

**How to apply:** Keep retries tied to the original purchase attempt, show ambiguous outcomes without claiming that no order exists, and require review of orders when a retry conflicts with changed quantities.

When migrating device carts, merge overlapping unsubmitted products using the higher quantity rather than adding both counts. If different purchase identities already involve an order, retain them as separate attempts instead of folding them together.

**Why:** Device carts may be copies of the same intended purchase; summing them doubles quantities. Combining order-linked identities can erase the only safe retry identifier.

**How to apply:** Keep the original identity and quantity for recorded purchases. Account logout, authentication expiry, or a lost response must not replace an uncertain operation with a new one.
