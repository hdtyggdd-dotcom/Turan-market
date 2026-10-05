---
name: Generated schema initialization
description: Runtime verification for eagerly evaluated generated validation schemas.
---

Keep a runtime import check in the API generation pipeline, not just a TypeScript check. Bounds used by eager validation schemas must be initialized before their consumers.

**Why:** A generated schema can reference a minimum or maximum that appears later in the module. The module then crashes during import, before any route or regression test runs. Fixes made only to generated files disappear on regeneration.

**How to apply:** Preserve the generation-time ordering safeguard and import smoke test when upgrading the generator or changing OpenAPI operations. Put any corrective transformation in the generation process rather than a manual output edit.
