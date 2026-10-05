import { Storage } from "@google-cloud/storage";
import { randomUUID } from "node:crypto";

const sidecar = "http://127.0.0.1:1106";
const storage = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${sidecar}/token`,
    type: "external_account",
    credential_source: { url: `${sidecar}/credential`, format: { type: "json", subject_token_field_name: "access_token" } },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

function documentFile(path: string) {
  const directory = process.env.PRIVATE_OBJECT_DIR?.replace(/\/$/, "");
  if (!directory) throw new Error("Private document storage is not configured");
  if (!/^driver-documents\/[a-f0-9-]+$/.test(path)) throw new Error("Invalid document path");
  const [, bucket, ...prefix] = directory.startsWith("/") ? directory.split("/") : `/${directory}`.split("/");
  if (!bucket) throw new Error("Invalid private storage configuration");
  return storage.bucket(bucket).file([...prefix, path].join("/"));
}

export const driverDocumentStorage = {
  async save(bytes: Buffer, mimeType: string): Promise<string> {
    const path = `driver-documents/${randomUUID()}`;
    await documentFile(path).save(bytes, {
      resumable: false,
      metadata: { contentType: mimeType, cacheControl: "private, no-store" },
    });
    return path;
  },
  async remove(path: string): Promise<void> {
    await documentFile(path).delete({ ignoreNotFound: true });
  },
  async readUrl(path: string): Promise<string> {
    const file = documentFile(path);
    const response = await fetch(`${sidecar}/object-storage/signed-object-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bucket_name: file.bucket.name,
        object_name: file.name,
        method: "GET",
        expires_at: new Date(Date.now() + 300_000).toISOString(),
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error("Unable to open private document");
    const result = await response.json() as { signed_url: string };
    return result.signed_url;
  },
};
