import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  enum as pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Categories va Subcategories
 * Platform kategoriyalari dinamik, admin boshqaradi.
 * Har bir kategoriya:
 *  - ID
 *  - Nomi (O'zbek + Rus)
 *  - Icon (rasm/emoji)
 *  - Tavsif
 *  - Subcategories ro'yxati
 */

export const categoriesTable = pgTable("categories", {
  id: varchar("id", { length: 50 }).primaryKey(), // "cat_transport", "cat_agro"
  nameUz: varchar("name_uz", { length: 255 }).notNull(), // "Transport"
  nameRu: varchar("name_ru", { length: 255 }).notNull(), // "Транспорт"
  descriptionUz: text("description_uz"), // kategoriya haqida
  descriptionRu: text("description_ru"),
  icon: varchar("icon", { length: 255 }), // emoji yoki rasm URL: "🚗"
  slug: varchar("slug", { length: 100 }).unique(), // "transport", "agro"
  displayOrder: integer("display_order").notNull().default(0), // admin qaysi catni yuqorida ko'rish uchun
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata"), // {color: "#FF5733", tags: [...]}
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categoriesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categoriesTable.$inferSelect;

/**
 * Subcategories
 * Har bir kategoriya uchun subcategory'lar.
 * Masalan: Transport → Avtomobil, Ehtiyot, Mototsikl, etc.
 */

export const subcategoriesTable = pgTable("subcategories", {
  id: varchar("id", { length: 50 }).primaryKey(), // "sub_avtomobil", "sub_ehtiyot"
  categoryId: varchar("category_id", { length: 50 })
    .notNull()
    .references(() => categoriesTable.id, { onDelete: "cascade" }),
  nameUz: varchar("name_uz", { length: 255 }).notNull(), // "Avtomobil"
  nameRu: varchar("name_ru", { length: 255 }).notNull(), // "Автомобиль"
  descriptionUz: text("description_uz"),
  descriptionRu: text("description_ru"),
  icon: varchar("icon", { length: 255 }), // "🚙"
  slug: varchar("slug", { length: 100 }), // "avtomobil"
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  bookingMode: varchar("booking_mode", { length: 50 }).default("showcase"), // "showcase" | "preorder" | "custom"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSubcategorySchema = createInsertSchema(subcategoriesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSubcategory = z.infer<typeof insertSubcategorySchema>;
export type Subcategory = typeof subcategoriesTable.$inferSelect;

/**
 * Attributes va Atribut Tanlari
 * Har bir subcategory uchun atributlar.
 * Masalan: Avtomobil → Marka, Model, Yil, Dvigatel, etc.
 *
 * Atribut turlari:
 *  - enum: dropdown (marka, dvigatel, etc.)
 *  - text: matn (nomi, tavsif, etc.)
 *  - number: raqam (probeg, yil, etc.)
 *  - date: sana (ishlab chiqarilgan yili)
 *  - boolean: ha/yo'q
 *  - multiselect: bir nechta tanlash
 */

const attributeTypeEnum = pgEnum("attribute_type", [
  "enum",
  "text",
  "number",
  "date",
  "boolean",
  "multiselect",
  "textarea",
  "url",
  "phone",
  "email",
]);

export const attributesTable = pgTable("attributes", {
  id: varchar("id", { length: 50 }).primaryKey(), // "attr_marka", "attr_model"
  subcategoryId: varchar("subcategory_id", { length: 50 })
    .notNull()
    .references(() => subcategoriesTable.id, { onDelete: "cascade" }),
  nameUz: varchar("name_uz", { length: 255 }).notNull(), // "Marka"
  nameRu: varchar("name_ru", { length: 255 }).notNull(), // "Марка"
  type: attributeTypeEnum("type").notNull(), // enum, text, number, etc.
  isRequired: boolean("is_required").notNull().default(false),
  isFilterable: boolean("is_filterable").notNull().default(false), // qidiruvda filtr sifatida foydalanish mumkinmi
  isSearchable: boolean("is_searchable").notNull().default(false), // qidiruvda qidirish mumkinmi
  displayOrder: integer("display_order").notNull().default(0),
  placeholder: varchar("placeholder", { length: 255 }), // "Masalan: Chevrolet"
  helpText: text("help_text"), // "Avtomobil markasini tanlang"
  validationRules: jsonb("validation_rules"), // {min: 1980, max: 2024} yoki {pattern: "^[A-Z]"}
  defaultValue: text("default_value"), // enum uchun default tanlash
  enumOptions: jsonb("enum_options"), // [{id: "marka_chevrolet", nameUz: "Chevrolet", nameRu: "Шевролет"}, ...]
  displayInListing: boolean("display_in_listing").notNull().default(true), // e'londa ko'rinsin
  displayInSearch: boolean("display_in_search").notNull().default(true), // qidiruvda ko'rinsin
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAttributeSchema = createInsertSchema(attributesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAttribute = z.infer<typeof insertAttributeSchema>;
export type Attribute = typeof attributesTable.$inferSelect;

/**
 * AI Questions per Subcategory
 * AI sotuvchiga qanday savollarni berishi kerakligini belgilaydi.
 * Masalan: Avtomobil → "Marka?", "Model?", "Yil?", etc.
 */

export const aiQuestionsTable = pgTable("ai_questions", {
  id: varchar("id", { length: 50 }).primaryKey(),
  subcategoryId: varchar("subcategory_id", { length: 50 })
    .notNull()
    .references(() => subcategoriesTable.id, { onDelete: "cascade" }),
  attributeId: varchar("attribute_id", { length: 50 }).references(
    () => attributesTable.id,
    { onDelete: "set null" }
  ), // qaysi atributga tegishli
  questionUz: text("question_uz").notNull(), // "Avtomobil markasi?"
  questionRu: text("question_ru").notNull(), // "Марка автомобиля?"
  order: integer("order").notNull().default(0), // savollar tartibi
  isRequired: boolean("is_required").notNull().default(false),
  helpTextUz: text("help_text_uz"), // savolga yordam
  helpTextRu: text("help_text_ru"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAiQuestionSchema = createInsertSchema(aiQuestionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAiQuestion = z.infer<typeof insertAiQuestionSchema>;
export type AiQuestion = typeof aiQuestionsTable.$inferSelect;

/**
 * Category Thresholds (B2B, Komissiya, etc.)
 * Admin har bir kategoriya uchun alohida qoidalarni belgilaydi.
 */

export const categoryThresholdsTable = pgTable("category_thresholds", {
  id: serial("id").primaryKey(),
  categoryId: varchar("category_id", { length: 50 })
    .notNull()
    .references(() => categoriesTable.id, { onDelete: "cascade" }),
  b2bMinQuantity: integer("b2b_min_quantity").default(50), // optom minimal miqdori
  b2bCommissionPercent: integer("b2b_commission_percent").default(3), // optom komissiyasi
  regularCommissionPercent: integer("regular_commission_percent").default(5), // oddiy komissiya
  requiresVerification: boolean("requires_verification").notNull().default(false), // sotuvchi tekshirish talab qilinsin
  requiresModerationBefore: boolean("requires_moderation_before").notNull().default(false), // e'lon chiqarishdan oldin moderator tasdiqlashi talab qilinsin
  allowExchange: boolean("allow_exchange").notNull().default(false), // ayirboshlash mumkinmi
  allowWholesale: boolean("allow_wholesale").notNull().default(false), // optom mumkinmi
  metadata: jsonb("metadata"), // {maxListingsPerSeller: 1000, autoApprove: false}
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCategoryThresholdSchema = createInsertSchema(
  categoryThresholdsTable
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCategoryThreshold = z.infer<typeof insertCategoryThresholdSchema>;
export type CategoryThreshold = typeof categoryThresholdsTable.$inferSelect;

/**
 * Enum Options (untuk dropdown attributes)
 * Misalnya: Marka → Chevrolet, Toyota, BMW, etc.
 */

export const enumOptionsTable = pgTable("enum_options", {
  id: varchar("id", { length: 50 }).primaryKey(), // "opt_marka_chevrolet"
  attributeId: varchar("attribute_id", { length: 50 })
    .notNull()
    .references(() => attributesTable.id, { onDelete: "cascade" }),
  valueUz: varchar("value_uz", { length: 255 }).notNull(), // "Chevrolet"
  valueRu: varchar("value_ru", { length: 255 }).notNull(), // "Шевролет"
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEnumOptionSchema = createInsertSchema(enumOptionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertEnumOption = z.infer<typeof insertEnumOptionSchema>;
export type EnumOption = typeof enumOptionsTable.$inferSelect;

export type StoredSubcategory = Subcategory;
