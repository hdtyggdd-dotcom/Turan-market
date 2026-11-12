---
name: Administrative location integrity
description: Preserve historical references when repairing location choices, and do not invent reference coordinates.
---

When fixing Uzbek administrative choices, preserve every historical district identity. Distinguish same-named cities and districts. Hide obsolete or invalid entries from new selection without silently assigning historical records to a different place; equivalent duplicates must remain compatible with location filters.

**Why:** The owner explicitly required existing accounts and listings to survive the location correction. One legacy entry was not a recognized district, so guessing what customers meant would corrupt their location data.

**How to apply:** Treat location corrections as compatibility changes, not destructive seed replacements or arbitrary database rewrites. Keep old IDs resolvable and test both canonical and historical references.

Missing verified reference coordinates must remain unknown, not become a region-centre approximation or zero. Cargo can be posted with unknown distance; a numeric delivery quote needs real coordinates.

**Why:** Recently created districts were absent from the available coordinate gazetteer. Inventing points would create false GPS suggestions, distances and prices.

**How to apply:** Use authoritative administrative lists for coverage and separately sourced, attributed coordinates for approximate points. Require exact GPS when an estimate cannot be calculated; never manufacture a distance or price.
