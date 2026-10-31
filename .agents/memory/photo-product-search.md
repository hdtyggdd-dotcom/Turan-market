---
name: Photo product search
description: Owner's intended photo-search and unavailable-product notification behavior.
---

Customers should be able to photograph a product from product search, have AI
find it in the marketplace, and have the relevant entrepreneur notified when the
product is unavailable.

**Why:** The owner explicitly requested camera-based product lookup and an
entrepreneur alert when the searched product is no longer available.

The owner confirmed that an unavailable-product demand alert goes to **all
sellers with a goods listing in the identified category**, not just one listing's
owner. An account's selected role must not exclude someone who actually sells
goods in that category.

**Why:** The owner explicitly selected category-wide sellers as recipients.

**How to apply:** Treat image recognition and actual catalogue availability as
separate facts. A failed match does not prove that stock is exhausted. Send only
the identified product demand, not the customer's photo, location or identity.
Suppress repetitive same-product alerts; don't alert on uncertain recognition.

Use the system's selected-image picker, not permission to read the entire
Android photo/video library, for marketplace photos and driver document images.

**Why:** These flows only need images the user explicitly selects. Broad media
permissions are unnecessary and create Google Play photo-permission review
problems. SDK 54's image picker supports selected-image access without a library
permission request.

**How to apply:** Keep camera consent separate. Do not reintroduce a blanket
gallery permission check that prevents a system picker from opening when broad
media permissions are blocked in a native release.
