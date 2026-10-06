---
name: Background location runtime
description: Consent and native runtime limits for cargo GPS sharing.
---

Background cargo GPS must remain a separate driver opt-in, never a side effect of
opening tracking or granting ordinary foreground location permission.

**Why:** The product explicitly requires consent before broadening tracking to
long journeys outside the active screen.

**How to apply:** Preserve separate foreground/background controls and explain
who receives location and how to stop before requesting OS background permission.

Browser distribution and Expo Go cannot provide native cargo background GPS.
Native permission/plugin changes require a new Android/iOS build. Do not promise
tracking after force-quit, reboot or battery restrictions; show the last fix age
instead of claiming the driver is live.

**Why:** Mobile operating systems control background scheduling and app
termination; a browser screenshot or mocked native test cannot prove it works
on a locked physical device.

**How to apply:** Use physical Android/iOS release checks for native scheduling,
and keep browser access usable with honest foreground-only behavior.

Status inspection that can clean up native tracking must share the same
lifecycle serialization as starting/stopping it.

**Why:** Permission prompts and native startup leave intentional temporary gaps
in stored consent or OS registration. A poll that treats such a gap as abandoned
state can cancel a successful opt-in immediately after startup.

**How to apply:** Make recovery decisions only after pending lifecycle operations
finish, and cover polls during permission prompts, server validation and native
startup with concurrency tests.
