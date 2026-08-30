import { jsonb, pgTable, text, timestamp, primaryKey, index } from "drizzle-orm/pg-core";

/**
 * Durable application records.
 *
 * The API currently has rich domain objects that are shared by many route
 * handlers. Keeping each record as JSON lets us make the existing domain
 * model durable without changing response shapes during the migration to
 * fully normalized tables.
 */
export const appRecords = pgTable(
  "app_records",
  {
    collection: text("collection").notNull(),
    id: text("id").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.collection, table.id] }),
    collectionIndex: index("app_records_collection_idx").on(table.collection),
  }),
);

export type AppRecord = typeof appRecords.$inferSelect;