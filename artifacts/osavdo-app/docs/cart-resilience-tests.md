# Cart failure and account-switch checks

## Run

From the workspace root:

```sh
pnpm --filter @workspace/osavdo-app run test:cart-resilience
pnpm --filter @workspace/api-server run test:cart-sync
pnpm run typecheck:libs
pnpm --filter @workspace/osavdo-app run typecheck
```

The server suite requires the existing development database. It uses isolated
test identities and cleans up its own records. Do not point it at production.
Building library declarations before the mobile typecheck avoids stale generated
API declarations in this project-reference workspace.

## What is tested

`context/CartContext.test.mjs` mounts the actual `CartProvider` and observes the
actual `useCart` value using React's renderer. Its test-only esbuild harness
replaces imports for AsyncStorage, AppState, auth and the API client. Production
context code, API routes and payment behavior are unchanged.

- Legacy-cart identities must finish persisting before any network call.
- Failed legacy reads or migration writes must not delete or import the cart.
- Lost migration responses and cleanup failures must reuse the saved migration
  operation and product request identities, including after provider remount.
- A POST committed before its response is lost must replay the original payload,
  `operationId` and `requestId`, never a new purchase intent.
- New user actions must not overwrite an uncertain saved mutation.
- Mutation read/write/cleanup failures and replay read failures preserve safe
  recovery behavior.
- HTTP 401 and 429 preserve mutation and migration journals; 401 expiry is
  associated with the original credential, while 429 does not expire a session.
- Delayed GET, POST and merge responses cannot expose the old account's items
  during logout/login. A delayed 401 cannot expire the new account or a renewed
  same-account session.
- Switching accounts during a storage write preserves only the original
  account's journal and prevents sending its operation under another credential.
- Old callbacks, same-account return with the same token, foreground retry,
  polling and listener cleanup respect session generations.
- Existing add/change/refresh/remove/clear behavior remains exercised.

Gates signal the exact storage/network phase reached and are explicitly released
by each test. No sleeps, device network, browser session or real auth is involved.
Timers and ID generation are controlled, fixtures are isolated, and each test has
a bounded timeout.

The fake API models account-scoped receipts so client tests can assert receipt
reuse and effects. It is not proof of database idempotency. That remains covered
by the unchanged `artifacts/api-server/src/routes/cart.test.ts`, which exercises
the real server and database.

## Native verification boundary

These are deterministic provider integration tests, **not** a native AsyncStorage
or device test. This workspace had no Android `adb`, emulator or `/dev/kvm`
available during verification. No emulator/native run is claimed. The test auth
boundary records `expireSession` calls; tests explicitly perform logout/login,
rather than testing the separate authentication provider.

When a native test build and a device/emulator are available:

1. Use test accounts and non-payment products. Confirm add/change/remove persists
   across process restart with the installed native AsyncStorage implementation.
2. Interrupt connectivity after a cart POST is accepted, restart the app, restore
   connectivity and confirm the original operation is replayed without increasing
   the quantity again. Compare operation identities using a controlled test API,
   not an assumption that the timing hit the intended phase.
3. Repeat logout/login between two accounts while a test API delays responses.
   Confirm no old items or old authentication error appear in the new account.
4. Inject native storage read/write/remove rejection in a dedicated test build,
   especially removal after a confirmed import. Confirm the original receipt
   survives restart and no fresh import identity is generated.
5. Repeat expiry and throttling checks with the controlled test API. Keep journal
   contents private; do not put tokens or personal account data in test reports.

Do not enable card payments or add failure-injection switches to release builds
to perform these checks.
