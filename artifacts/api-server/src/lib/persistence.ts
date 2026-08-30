import { and, eq } from "drizzle-orm";
import { appRecords, db } from "@workspace/db";
import {
  users,
  listings,
  orders,
  driverProfiles,
  cargoLoads,
  cargoOffers,
  hashPassword,
  type StoredUser,
  type StoredListing,
  type StoredOrder,
  type StoredDriverProfile,
  type StoredCargoLoad,
  type StoredCargoOffer,
} from "../data/store.js";

type PersistedItem =
  | StoredUser
  | StoredListing
  | StoredOrder
  | StoredDriverProfile
  | StoredCargoLoad
  | StoredCargoOffer;

type Collection = {
  name: string;
  items: PersistedItem[];
};

const collections: Collection[] = [
  { name: "users", items: users },
  { name: "listings", items: listings },
  { name: "orders", items: orders },
  { name: "driver_profiles", items: driverProfiles },
  { name: "cargo_loads", items: cargoLoads },
  { name: "cargo_offers", items: cargoOffers },
];

function normalizeUser(user: StoredUser): StoredUser {
  if (!user.password.startsWith("scrypt$")) {
    user.password = hashPassword(user.password);
  }
  return user;
}

function recordValue(item: PersistedItem) {
  return {
    collection: "",
    id: item.id,
    payload: item as unknown as Record<string, unknown>,
    updatedAt: new Date(),
  };
}

export async function initializePersistence(): Promise<void> {
  for (const collection of collections) {
    const rows = await db
      .select()
      .from(appRecords)
      .where(eq(appRecords.collection, collection.name));

    if (rows.length === 0) {
      const preparedItems = collection.name === "users"
        ? collection.items.map((item) => normalizeUser(item as StoredUser))
        : collection.items;
      if (preparedItems.length > 0) {
        await db.insert(appRecords).values(
          preparedItems.map((item) => ({
            ...recordValue(item),
            collection: collection.name,
          })),
        );
      }
      continue;
    }

    const loaded = rows.map((row) => row.payload as unknown as PersistedItem);
    if (collection.name === "users") {
      loaded.forEach((item) => normalizeUser(item as StoredUser));
    }
    collection.items.splice(0, collection.items.length, ...loaded);
  }
}

export async function initializeImagePersistence(
  imageStore: Map<string, string>,
): Promise<void> {
  const rows = await db
    .select()
    .from(appRecords)
    .where(eq(appRecords.collection, "images"));
  for (const row of rows) {
    const payload = row.payload as { dataUrl?: unknown };
    if (typeof payload.dataUrl === "string") {
      imageStore.set(row.id, payload.dataUrl);
    }
  }
}

export async function persistRecord(
  collection: string,
  id: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await db
    .insert(appRecords)
    .values({
      collection,
      id,
      payload,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [appRecords.collection, appRecords.id],
      set: {
        payload,
        updatedAt: new Date(),
      },
    });
}

export async function getRecord(
  collection: string,
  id: string,
): Promise<Record<string, unknown> | null> {
  const [row] = await db
    .select()
    .from(appRecords)
    .where(and(eq(appRecords.collection, collection), eq(appRecords.id, id)))
    .limit(1);
  return row ? row.payload : null;
}

export async function persistItem(collection: string, item: PersistedItem): Promise<void> {
  const prepared = collection === "users" ? normalizeUser(item as StoredUser) : item;
  await persistRecord(
    collection,
    prepared.id,
    prepared as unknown as Record<string, unknown>,
  );
}

export async function deleteItem(collection: string, id: string): Promise<void> {
  await db
    .delete(appRecords)
    .where(and(eq(appRecords.collection, collection), eq(appRecords.id, id)));
}