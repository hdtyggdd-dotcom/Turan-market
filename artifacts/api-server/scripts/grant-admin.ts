/**
 * Workspace-owner-only bootstrap. No public endpoint can grant admin access.
 * Run using the scripts package's tsx runtime with an existing account ID.
 */
import { getRecord, persistItem } from "../src/lib/persistence.js";
import type { StoredUser } from "../src/data/store.js";

const [id, confirmation] = process.argv.slice(2);
if (!id || confirmation !== "--confirm-admin-access") {
  throw new Error("Usage: grant-admin.ts USER_ID --confirm-admin-access. This grants full administrator access.");
}
const record = await getRecord("users", id);
if (!record) throw new Error("Existing account not found");
const user = record as unknown as StoredUser;
if (user.role === "driver") throw new Error("Use a separate non-driver account for administration.");
await persistItem("users", { ...user, role: "admin" });
process.stdout.write("Administrator access saved. Restart the API server and sign in again to refresh the role.\n");
process.exit(0);
