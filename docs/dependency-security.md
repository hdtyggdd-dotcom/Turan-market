# Dependency security maintenance

The dependency updates remove the critical `proxy-addr` publish blocker and
upgrade 84 of the 87 dependency findings to fixed releases. Expo stays on SDK 54;
React and native modules are not upgraded to an incompatible SDK.

## Locally patched packages

The remaining three advisory records have no fixed upstream release as of
2026-10-06. Their vulnerable code paths are patched through pnpm's
`patchedDependencies`. Package versions remain honest, so a version-only scanner
still reports **two high findings and one moderate finding**. They are not ignored
or allowlisted. Do not claim a zero-finding audit.

| Package | Advisory | Local fix |
| --- | --- | --- |
| braces 3.0.3 | GHSA-vfj7-8cjw-p6xm | Parser caps brace/parenthesis nesting; iterative validation rejects deep or cyclic ASTs before compile, expand, and stringify recurse. |
| node-forge 1.4.0 | GHSA-86w9-cpqp-85rv | RSA verification validates the nested DigestAlgorithm child count and rejects malformed NULL parameters, not just the outer DigestInfo structure. |
| sprintf-js 1.0.3 | GHSA-hp3w-g68c-fv3c | Numeric precision is bounded before Number formatting methods; valid inputs are unchanged, oversized precision saturates at the supported limit rather than causing a RangeError. |

These are narrow mitigations of the named advisories, not guarantees that those
packages have no other issues. Prefer fixed upstream releases when they become
available; remove the relevant patch only after its regression tests pass without
it and a fresh dependency audit confirms the advisory is resolved.

## Compatibility patches

Metro 0.83.3 and 0.83.7 used image-size 1's callable default export and filename
API. Their patches use image-size 2's named `imageSize` export and read image
bytes explicitly. This permits a fixed image-size release without a major Expo
or React Native upgrade. Test both Metro dependency paths when changing these
patches.

uuid is updated to the fixed, CommonJS-compatible 11.1.1 release for existing
Expo/ngrok/xcode callers. Do not replace it blindly with an ESM-only release.

## Verification

```sh
pnpm install --frozen-lockfile
pnpm run test:dependency-security
pnpm run typecheck
pnpm --filter @workspace/osavdo-app run build:web
pnpm --filter @workspace/api-server run build
```

The security regressions resolve the installed dependencies and test malformed
RSA DigestAlgorithm signatures, deeply nested patterns/ASTs, oversized numeric
precision, UUID buffer bounds, and both Metro image-asset paths.

No secrets, payment records, or security policy exclusions were changed.
