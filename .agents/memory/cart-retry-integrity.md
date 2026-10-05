---
name: Cart retry integrity
description: Safely retrying checkout when an order response or cart storage update fails.
---

When checkout has an uncertain outcome, preserve the original request identity on retry. Do not tell a buyer to remove and re-add the product as a way to retry that request; first direct them to their existing orders.

**Why:** An order can already be saved even if its response is lost or removing the saved cart item fails. A newly added cart item represents a new purchase and can create a second order.

**How to apply:** Keep retries tied to the original purchase attempt, show ambiguous outcomes without claiming that no order exists, and require review of orders when a retry conflicts with changed quantities.
