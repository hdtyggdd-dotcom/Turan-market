import Stripe from "stripe";
import { StripeSync } from "stripe-replit-sync";

async function getStripeCredentials(): Promise<{ secretKey: string; webhookSecret?: string }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const replitToken = process.env.REPLIT_IDENTITY
    ? `repl ${process.env.REPLIT_IDENTITY}`
    : process.env.WEB_REPL_RENEWAL
      ? `depl ${process.env.WEB_REPL_RENEWAL}`
      : null;
  if (!hostname || !replitToken) throw new Error("Stripe connection environment is missing");
  const response = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=stripe`,
    { headers: { Accept: "application/json", X_REPLIT_TOKEN: replitToken } },
  );
  if (!response.ok) throw new Error(`Unable to load Stripe connection: ${response.status}`);
  const data = await response.json() as { items?: Array<{ settings?: { secret_key?: string; webhook_secret?: string } }> };
  const settings = data.items?.[0]?.settings;
  if (!settings?.secret_key) throw new Error("Stripe connection has no secret key");
  return { secretKey: settings.secret_key, webhookSecret: settings.webhook_secret };
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  return new Stripe((await getStripeCredentials()).secretKey);
}

export async function getStripeSync(): Promise<StripeSync> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required for Stripe Sync");
  const credentials = await getStripeCredentials();
  return new StripeSync({
    poolConfig: { connectionString: databaseUrl },
    stripeSecretKey: credentials.secretKey,
    stripeWebhookSecret: credentials.webhookSecret ?? "",
  });
}