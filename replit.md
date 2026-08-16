# Turan Market — O'zbekiston va qo'shni mamlakatlar uchun AI-powered marketplace

Turan Market — lokal va regional savdo platformasi. Sotuvchilar rasm yuklab, AI avtomatik e'lonni tayyorlasin deb jo'natadi. Tizim kategoriya, atributlar, narx, tavsif va bozor tahlilini avtomatik bajaradi. Xaridorlar fuzzy qidiruvdan foydalanib, masalan "10 yillik chiroyli avtomobil" yoki "sog' qoramol" deb qidirsalar, AI tizim mos e'lonlarni topadi.

**Biznesni** 3 ta ustun belgilanadi:
1. **Marketplace commission** — har bir sotilgan mahsulotdan % olamiz
2. **B2B listings** — katta sotuvchilar uchun special tarif
3. **Paid features** — priority, featured, badges

---

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `ANTHROPIC_API_KEY` — Claude AI, `OPENAI_API_KEY` — fallback

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Zod validation
- DB: PostgreSQL + Drizzle ORM
- AI: Anthropic Claude (Haiku 4.5) — rasm tahlili, e'lon tayyorlash, tavsiya
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

| Component | Path | Note |
|-----------|------|------|
| **DB Schema** | `lib/db/src/schema.ts` | Categories, listings, users, orders, attributes |
| **API Spec** | `artifacts/api-spec/openapi.yaml` | Single source of truth for backend ↔ frontend |
| **API Server** | `artifacts/api-server/src` | Express handlers, routes, middleware |
| **Routes** | `artifacts/api-server/src/routes` | Category, listing, AI, auth, locations, orders |
| **Utils** | `artifacts/api-server/src/utils` | Fuzzy search, auto-category, price analysis |
| **Frontend** | `artifacts/web/src/app` | React/Next.js (TBD) |
| **Mobile** | `artifacts/osavdo-app/src` | React Native (TBD) |
| **Data/Store** | `artifacts/api-server/src/data/store.ts` | In-memory data (for MVP, migrate to DB) |

## Architecture decisions

1. **Category + Subcategory + Attributes model**
   - Not just `product → listing`, but `Category → Subcategory → dynamic Attributes`
   - Each subcategory has required/optional/filterable fields
   - AI learns questions per subcategory (e.g., "avtomobil" asks engine, mileage; "qoramol" asks breed, age)

2. **Listing statuses + moderation pipeline**
   - `DRAFT → AI_CHECK → MODERATION → APPROVED → PUBLISHED`
   - `REJECTED`, `BLOCKED`, `SOLD`, `ARCHIVED`, `EXPIRED` as terminal states
   - Sellers can see AI feedback before publishing

3. **Condition field for all products**
   - `condition: NEW | USED | REFURBISHED | VINTAGE`
   - `condition_details`: string (rust, scratches, etc.)
   - Applies to autos, phones, furniture, animals — not just used goods

4. **Listing types: SALE, WHOLESALE, EXCHANGE, SERVICE, ADVERTISEMENT**
   - Platform doesn't assume all listings are sales
   - B2B sellers use WHOLESALE, services use SERVICE
   - Can filter by type

5. **In-memory store (MVP) → PostgreSQL (later)**
   - `lib/db/src/data/store.ts` holds real schemas
   - `artifacts/api-server/src/data/store.ts` is working memory (to be migrated to DB)
   - API endpoints already written; just swap data source

## Product

**For Sellers:**
- Upload image → AI auto-detects category, asks smart questions, generates title + description
- Set price, location, seller type (individual / manufacturer / wholesale)
- See market analysis: price position, competitor count, market insights
- Publish immediately or save as draft
- View orders, ratings, repeat buyers

**For Buyers:**
- Browse by category, search with fuzzy matching (typos OK)
- Filter by price, location, condition, seller type
- See market trends: top products, regional differences
- Message sellers, negotiate price
- Order tracking, dispute resolution

**For Admin:**
- No-code category manager: add category, subcat, attributes, questions
- Moderation queue: approve/reject/block listings
- Analytics: GMV, seller count, top categories
- Commission settings, B2B rates, fees

**For AI:**
- Image analysis → category detection
- Missing attribute detection → auto-questions
- Title + description generation in Uzbek
- Price recommendations based on market
- Seasonal insights ("winter → more heaters")

---

## User preferences

1. **Uzbek first, then Russian**
   - All system messages, errors, prompts in Uzbek (`O'zbek`, not `uz` or `UZ`)
   - Russian (`titleRu`, `descriptionRu`) for cross-border buyers
   - No English in user-facing UI

2. **Seller types matter**
   - `individual` — regular person selling used items or small qty
   - `manufacturer` → requires admin approval (more credibility)
   - `wholesale` → bulk seller, uses B2B listing type

3. **Regional pricing**
   - Same product: different price in Tashkent vs. Samarkand vs. Kashgar
   - AI should note regional price variance
   - Market analysis includes regional competitors

4. **Categories are curated, not user-created**
   - Users can suggest custom subcategories (`customSubcategoryName`)
   - AI auto-classifies into best existing category
   - Admin reviews and approves custom ones

5. **AI should not hallucinate**
   - If image is ambiguous, ask seller follow-up questions
   - If unsure of category, show top 3 options
   - Never assume condition, mileage, or price range from photo alone

---

## Gotchas

1. **Always run typecheck before push**
   ```bash
   pnpm run typecheck
   ```
   Drizzle + Zod types are strict; easy to break on schema changes.

2. **Schema changes → must push to DB**
   ```bash
   pnpm --filter @workspace/db run push
   ```
   Dev mode only; production uses migrations (TBD).

3. **API spec is source of truth**
   - Update `openapi.yaml` first
   - Then run `pnpm --filter @workspace/api-spec run codegen`
   - Frontend code auto-updates from spec

4. **In-memory store is temporary**
   - `artifacts/api-server/src/data/store.ts` will be deleted once DB is live
   - All queries currently filter in-memory arrays
   - Performance OK for 10k listings, but swap to DB ASAP

5. **AI API keys are optional (for MVP)**
   - If `ANTHROPIC_API_KEY` not set, show static advice instead
   - Fallback to `OPENAI_API_KEY` if Claude is down
   - Test both paths before deploy

6. **Listing `/analyse` endpoint is called twice in code**
   - Line 78 (simple, no AI)
   - Line 337 (full, with Claude)
   - TODO: consolidate or document why both exist

7. **User sanitization**
   - Never return `passwordHash` or `phone` to untrusted clients
   - `sanitizeUser()` is called before JSON response
   - Review before adding new user fields

---

## Pointers

- **Workspace structure**: See `pnpm-workspace` skill
- **OpenAPI/Orval codegen**: `artifacts/api-spec/openapi.yaml` + `artifacts/api-spec/orval.config.ts`
- **DB schema walkthrough**: next session should audit `lib/db/src/schema.ts` (categories, attributes, listings)
- **Category engine**: `artifacts/api-server/src/utils/autoCategory.ts` + keyword matching
- **Fuzzy search**: `artifacts/api-server/src/utils/fuzzy.ts` (edit distance)
- **Next audit**: compare API endpointsvs. business logic; identify missing endpoints
