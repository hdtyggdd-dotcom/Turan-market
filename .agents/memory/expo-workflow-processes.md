---
name: Expo workflow process lifetime
description: An old Expo child may retain the preview port after a managed restart.
---

Confirm that the newly managed Expo process actually owns the configured preview port after restarting.

**Why:** A pnpm-launched Expo child outlived its old workflow; the replacement waited at an interactive alternate-port prompt while the old server still served previews.

**How to apply:** If logs show a port conflict, identify the exact old Expo process before stopping it and restarting the managed workflow. Do not accept a different port or broadly terminate unrelated Node services.
