import type { StoredDriverDocument } from "../data/store.js";

/** Expiry dates include the whole named UTC calendar day, independently of device timezone. */
export function validExpiryInput(kind: StoredDriverDocument["kind"], expiresAt: string | null | undefined, noExpiry: boolean | undefined): boolean {
  if (noExpiry === true) return kind !== "license" && expiresAt === null;
  if (noExpiry !== false || typeof expiresAt !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(expiresAt)) return false;
  const parsed = new Date(`${expiresAt}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === expiresAt;
}

export function documentDateCurrent(doc: Pick<StoredDriverDocument, "kind" | "expiresAt" | "noExpiry">, now = new Date()): boolean {
  return validExpiryInput(doc.kind, doc.expiresAt, doc.noExpiry) &&
    (doc.noExpiry === true || doc.expiresAt! >= now.toISOString().slice(0, 10));
}

export function documentValid(doc: StoredDriverDocument, now = new Date()): boolean {
  return doc.expiryVerified === true && documentDateCurrent(doc, now);
}

export function documentEvidence(doc: StoredDriverDocument) {
  const { objectPath, mimeType, ...metadata } = doc;
  return {
    ...metadata, expiresAt: doc.expiresAt ?? null, noExpiry: doc.noExpiry ?? false,
    expiryVerified: doc.expiryVerified ?? false, renewalRequired: !documentValid(doc),
  };
}
