# Driver moderation access

Driver verification is available in the mobile app at `/admin/drivers`.
Only existing accounts with the `admin` role may review applications. Public
registration cannot create an administrator.

For the first administrator, the workspace owner can grant access to an
existing, separate non-driver account:

```sh
pnpm --filter @workspace/scripts exec tsx ../artifacts/api-server/scripts/grant-admin.ts USER_ID --confirm-admin-access
```

This grants full administrator privileges, not just driver-review privileges.
Choose a trusted account. Restart the API workflow afterward so its durable
account state reloads, then sign in again to refresh the mobile session.

Old driver accounts without reviewed vehicle data and all three approved
documents are not eligible to bid. They must submit their application through
`/driver/verification`; previous self-reported badges do not migrate into
document approvals.

Private images are kept in App Storage. PostgreSQL contains only object paths
and review metadata. Owner/admin access links expire after five minutes; do not
share those links.
