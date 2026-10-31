---
name: Cargo privacy boundary
description: Trust boundary for contact, address, and personal locality data in cargo workflows.
---

Public cargo and pending-offer responses must use minimized user projections: mask phone numbers and remove personal region, district, and neighborhood profile data. Exact cargo addresses and full counterparty contact/profile details may be revealed only to the cargo owner and the driver whose offer was accepted.

**Why:** Browsing a load or submitting a pending bid does not establish enough trust to expose either party's personal location or contact details.

**How to apply:** Any new cargo list, detail, offer, chat, map, or notification response must preserve this boundary server-side; UI hiding alone is not sufficient.