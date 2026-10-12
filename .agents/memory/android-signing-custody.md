---
name: Android upload-key custody
description: Why public cloud builds must keep private signing material out of source and artifacts.
---

Create upload keys only in an isolated cloud runner and return only provider-sealed ciphertext for registration in GitHub Secrets. Never inspect, print, publish or put plaintext keystores/passwords in downloadable artifacts.

**Why:** The owner uses only a phone and explicitly approved an open build repository. Public source and build artifacts are not safe locations for private signing material. Sealed boxes allow the connector to register the key without the agent receiving its plaintext.

**How to apply:** Reuse the existing encrypted upload identity and verify its public certificate fingerprint before signing. Refuse to replace another identity silently; generating a new key is not an update strategy. Limit secret environment values to the restore/sign steps, remove temporary key files and treat an independently encrypted recovery backup as separate work.

Only call a Play bundle ready after the exact source revision's run succeeds and its signed artifact exists. Compiling a bundle is not Google Play submission, policy approval or physical-device testing.

**Why:** This release process verifies signing, bundle metadata and native alignment but cannot attest to owner-only Play Console declarations or device behavior.

**How to apply:** Keep owner console steps and background-GPS/push/camera device tests explicit. Do not substitute the Replit Publish button or an older debug APK for a Play release.
