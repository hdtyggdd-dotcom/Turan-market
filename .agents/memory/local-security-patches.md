---
name: Local security patch auditing
description: How to interpret dependency scan results when an upstream fix is unavailable.
---

A version-based dependency scan still reports advisories for packages fixed by
pnpm local patches. Do not spoof versions, suppress advisories, or describe that
audit as clean. Verify the installed patched code with exploit regression tests
and distinguish upstream upgrades from local mitigations in delivery.

**Why:** The project's scan continued reporting locally mitigated vulnerabilities
because it checks release versions rather than patch contents.

**How to apply:** When a maintained release has no upstream fix, keep a documented
patch and regression coverage. Prefer an upstream fixed release once available.
Consult docs/dependency-security.md for current mitigation scope before changing
the dependency configuration.
