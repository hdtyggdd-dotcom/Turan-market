---
name: Mobile push runtime
description: Resolve conflicts between general mobile-push guidance and the installed Expo runtime.
---

Treat remote push as a capability of the actual native runtime, not something a successful web preview proves. Check the installed SDK and build metadata before promising Expo Go support.

**Why:** During cargo tracking implementation, Replit's general push documentation described Android Expo Go support, but the installed Expo SDK 54 notifications package explicitly said remote Android push was removed from Expo Go in SDK 53. Web and simulator testing cannot establish lock-screen delivery. Build-provided Expo project metadata must not be replaced with an invented project ID.

**How to apply:** Keep in-app delivery usable without native push, display missing native/build setup explicitly, and verify lock-screen receipt plus notification-tap routing on a real installed build before claiming device delivery was tested.
