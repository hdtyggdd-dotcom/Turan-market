---
name: Moderation notification privacy
description: Keep driver review notifications safe for lock-screen display.
---

Driver review alerts show the decision and direct the driver to their own private application. Never include the moderator's free-text reason, document images, names, phone numbers or vehicle identifiers in alert text or push data.

**Why:** Rejection reasons may themselves contain personal information. A notification can appear on a locked device, so truncating a reason is not a privacy guarantee.

**How to apply:** Keep reasons available in the authenticated application, use only known notification destinations, and preserve the saved decision and in-app message even when remote push fails.
