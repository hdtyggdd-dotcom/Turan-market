---
name: Expo browser preview host
description: Locating the actual Expo host when the browser tester lacks its environment variable.
---

Do not assume the browser testing environment exposes the Expo preview hostname, or that the general development hostname serves the mobile web app.

**Why:** The browser tester had only the general development hostname and reached an API 404/blank page, although the Expo service was available at its separate preview host.

**How to apply:** If the Expo hostname is absent in the tester, obtain the exact URL from the running Expo workflow output and pass it explicitly. Wait for the web bundle to finish before browser verification; do not guess a hostname or change application routing to work around a tester environment mismatch.
