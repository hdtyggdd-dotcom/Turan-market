---
name: Android cloud release strategy
description: Why Android needs independent cloud native builds and careful source export rather than Expo Launch or blindly building the GitHub main branch.
---

Use a dedicated, owner-approved source snapshot for Android cloud builds. Verify repository visibility before exporting new code; an app-store release request is not consent to make newer source public. Exclude uploads, customer data, agent memory, local configuration, credentials and signing keys.

**Why:** The existing remote repository was public, older than the workspace and contained additional applications. Building it directly would omit newer behavior; blindly syncing or deleting remote-only files could break unrelated code and lockfile consistency.

**How to apply:** Export the current app with the complete required workspace manifests, shared libraries, lockfile and security patches. Prefer an isolated build snapshot rather than modifying an unrelated remote application's files. Obtain approval for public source publication or a separate private build repository.

Do not assume Expo's web GitHub build button can bootstrap a new Android project.

**Why:** The official Expo GitHub build documentation requires an already successful platform build. Replit Expo Launch does not submit Android, and EAS CLI is prohibited in this environment. Direct cloud Gradle is the selected initial Android test-build approach, without transferring or changing the managed Expo account.

**How to apply:** Generate native Android only in the cloud checkout. Label the initial APK as internal testing; it is not a signed Play AAB. Resolve durable upload-key management and the real-device/store gates before claiming production readiness.

Declare Metro/Babel plugins and presets used by the mobile app directly in that app's package manifest, even when Expo pulls them transitively.

**Why:** The local development workspace could bundle successfully while a clean pnpm cloud checkout failed to resolve the Expo Babel preset during the native release bundle. Transitive Expo dependencies are not a substitute for direct package ownership in a strict workspace install.

**How to apply:** For native cloud builds, verify a clean frozen install and the release JavaScript bundle; do not use a successful dev-server preview as proof that production Android bundling works.

Connected GitHub workflow-dispatch requests in this workspace returned empty HTTP 500 responses through both the proxy and its SDK. A separate, temporary branch push trigger did eventually queue an Actions run, but it only appeared in the runs API after a delay; the branch was restored to manual-only afterward.

**Why:** An immediate runs API check showed no new run even though GitHub later queued the event. A successfully updated source branch by itself was still not proof that an APK was built.

**How to apply:** Allow for delayed Actions event indexing, then verify both a successful run and its artifact before calling an APK current. Keep the workflow manual-only rather than leaving an automatic cost-bearing trigger as a workaround. If the connected API still cannot start a run, direct the owner to the exact branch and workflow in GitHub Actions for a manual start.
