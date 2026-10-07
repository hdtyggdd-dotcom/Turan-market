import { ReplitConnectors } from "@replit/connectors-sdk";
import { writeFile } from "node:fs/promises";

// Only RevenueCat configuration is created here, never a charge or entitlement
// grant. Store billing credentials and native release remain separate.
const projectId = process.argv[2] ?? process.env.REVENUECAT_PROJECT_ID;
if (!projectId) throw new Error("Pass the RevenueCat project ID; do not select another project's customers.");
const connectors = new ReplitConnectors();
const base = `/v2/projects/${encodeURIComponent(projectId)}`;
async function request(path: string, method = "GET", body?: unknown): Promise<any> {
  const response = await connectors.proxy("revenuecat", path, {
    method,
    ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`RevenueCat ${method} ${path}: ${response.status} ${JSON.stringify(data)}`);
  return data;
}
async function list(path: string): Promise<any[]> {
  let next: string | null = path;
  const items: any[] = [];
  while (next) {
    const page = await request(next);
    items.push(...page.items);
    next = page.next_page ? new URL(page.next_page, "https://api.revenuecat.com").pathname + new URL(page.next_page, "https://api.revenuecat.com").search : null;
  }
  return items;
}
const apps = await list(`${base}/apps`);
const test = apps.find((app) => app.type === "test_store");
if (!test) throw new Error("The connected project has no Test Store.");
const play = apps.find((app) => app.type === "play_store" && app.play_store?.package_name === "com.turanmarket.app")
  ?? await request(`${base}/apps`, "POST", { name: "Turan Market Android", type: "play_store", play_store: { package_name: "com.turanmarket.app" } });
const products = await list(`${base}/products`);
const testProduct = products.find((product) => product.app_id === test.id && product.store_identifier === "usta_monthly_test")
  ?? await request(`${base}/products`, "POST", { app_id: test.id, store_identifier: "usta_monthly_test", type: "subscription", title: "Ustalar obunasi — sinov", subscription: { duration: "P1M" } });
const playProduct = products.find((product) => product.app_id === play.id && product.store_identifier === "usta_monthly:monthly")
  ?? await request(`${base}/products`, "POST", { app_id: play.id, store_identifier: "usta_monthly:monthly", type: "subscription" });
const pricesPath = `${base}/products/${testProduct.id}/test_store_prices`;
const prices = await request(pricesPath);
if (!(Array.isArray(prices) ? prices : prices.prices)?.length) {
  // Test Store does not accept UZS. This is a 1 USD sandbox sample, NOT a
  // conversion of the planned 30,000 fee, and never a production price.
  await request(pricesPath, "POST", { prices: [{ amount_micros: 1_000_000, currency: "USD" }] });
}
const entitlements = await list(`${base}/entitlements`);
const entitlement = entitlements.find((entry) => entry.lookup_key === "usta_access")
  ?? await request(`${base}/entitlements`, "POST", { lookup_key: "usta_access", display_name: "Maishiy xizmat ustalari obunasi" });
const linkedProducts = await list(`${base}/entitlements/${entitlement.id}/products`);
const toAttach = [testProduct, playProduct].filter((product) => !linkedProducts.some((linked) => linked.id === product.id));
if (toAttach.length) await request(`${base}/entitlements/${entitlement.id}/actions/attach_products`, "POST", { product_ids: toAttach.map((product) => product.id) });
const offerings = await list(`${base}/offerings`);
const offering = offerings.find((entry) => entry.lookup_key === "usta_test")
  ?? await request(`${base}/offerings`, "POST", { lookup_key: "usta_test", display_name: "Ustalar obunasi sinovi" });
if (!offering.is_current) {
  if (offerings.some((entry) => entry.is_current && entry.id !== offering.id)) throw new Error("Another offering is current; do not replace it silently.");
  await request(`${base}/offerings/${offering.id}`, "PATCH", { is_current: true });
}
const packages = await list(`${base}/offerings/${offering.id}/packages`);
const pkg = packages.find((entry) => entry.lookup_key === "$rc_monthly")
  ?? await request(`${base}/offerings/${offering.id}/packages`, "POST", { lookup_key: "$rc_monthly", display_name: "Oylik ustalar obunasi" });
const attached = await list(`${base}/packages/${pkg.id}/products`);
const missing = [testProduct, playProduct].filter((product) => !attached.some((entry) => (entry.product?.id ?? entry.id) === product.id));
if (missing.length) await request(`${base}/packages/${pkg.id}/actions/attach_products`, "POST", { products: missing.map((product) => ({ product_id: product.id, eligibility_criteria: "all" })) });
const testKeys = await list(`${base}/apps/${test.id}/public_api_keys`);
const publicKey = testKeys[0]?.key;
if (!publicKey?.startsWith("test_")) throw new Error("Expected a public Test Store key; never export a private key.");
await writeFile("/tmp/turan-revenuecat-config.json", JSON.stringify({
  REVENUECAT_PROJECT_ID: projectId,
  REVENUECAT_TEST_STORE_APP_ID: test.id,
  REVENUECAT_GOOGLE_PLAY_STORE_APP_ID: play.id,
  EXPO_PUBLIC_REVENUECAT_TEST_API_KEY: publicKey,
  EXPO_PUBLIC_REVENUECAT_MODE: "test",
}));
console.log("Test Store, Android draft product, entitlement and monthly offering configured. No live billing enabled.");
