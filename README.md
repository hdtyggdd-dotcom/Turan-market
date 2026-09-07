# Turan Market 🚀

**AI-powered marketplace para sa Central Asia** — Uzbekistan, Turkmenistan, Kyrgyzstan, at higit pa!

## 📱 Quick Start

```bash
# 1. Clone repository
git clone https://github.com/hdtyggdd-dotcom/Turan-market.git
cd Turan-market

# 2. Install dependencies
pnpm install

# 3. Start development server
pnpm --filter @workspace/web run dev

# 4. Open browser
# http://localhost:3000
```

---

## 🎯 Features

- ✨ **AI Image Recognition** — Upload photo → AI generates listing title, description, tags
- 🏪 **Personal Store** — Sellers get their own branded storefront
- 🔍 **Smart Search** — Dynamic filters, fuzzy search, category hierarchy
- 🚚 **Logistics** — In-city, inter-city, international shipping + hazmat support
- 💰 **B2B Mode** — Wholesale pricing, minimum quantities, tiered discounts
- 🔄 **Bartering** — Trade items, negotiate extra payment
- 🌐 **Bilingual** — Uzbek (O'zbekcha) + Russian (Русский)
- 📦 **Categories** — Transport, Agriculture, Livestock, Industrial, Real Estate, Services, Used Items

---

## 📊 Tech Stack

### Frontend
- **Next.js 14** — React framework
- **TypeScript** — Type safety
- **Tailwind CSS** — Styling
- **Axios** — API calls
- **Zustand** — State management

### Backend
- **Express.js** — REST API
- **PostgreSQL** — Database
- **Prisma** — ORM
- **OpenAI/Anthropic** — AI image analysis

### Deployment
- **Vercel** — Frontend hosting
- **Railway** — Backend hosting
- **Railway Postgres** — Database

---

## 🗂️ Project Structure

```
Turan-market/
├── artifacts/
│   ├── web/                          # Frontend (Next.js)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── page.tsx          # Landing page
│   │   │   │   ├── marketplace/      # Marketplace listings
│   │   │   │   ├── seller/           # Seller dashboard
│   │   │   │   └── layout.tsx        # Root layout
│   │   │   ├── components/           # Reusable components
│   │   │   └── styles/               # Global styles
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tailwind.config.ts
│   │   └── next.config.js
│   │
│   ├── api-server/                   # Backend (Express)
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── listings.ts       # Listing endpoints
│   │   │   │   ├── categories.ts     # Category endpoints
│   │   │   │   ├── sellers.ts        # Seller endpoints
│   │   │   │   └── auth.ts           # Auth endpoints
│   │   │   ├── middleware/
│   │   │   ├── services/             # AI, Image processing
│   │   │   └── index.ts              # Server entry
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── db/                           # Database
│       ├── schema.prisma             # Data model
│       └── migrations/
│
├── vercel.json                       # Deployment config
├── DEPLOYMENT.md                     # Detailed deployment guide
└── README.md                         # This file
```

---

## 🚀 Deployment

### **Quick Deploy (5 mins)**

#### Step 1: Frontend (Vercel)
```bash
1. Go to vercel.com
2. Import GitHub repo → hdtyggdd-dotcom/Turan-market
3. Set root directory: artifacts/web
4. Add env vars:
   - NEXT_PUBLIC_API_URL=https://turan-api.railway.app
5. Deploy!
```

#### Step 2: Backend (Railway)
```bash
1. Go to railway.app
2. New Project → Deploy from GitHub
3. Select Turan-market repo
4. Add PostgreSQL database
5. Set env vars (DATABASE_URL, API keys)
6. Deploy!
```

**Full guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📖 Pages & Routes

### Public Pages
| Route | Purpose |
|-------|---------|
| `/` | Landing page with features |
| `/marketplace` | All listings with filters |
| `/marketplace/[id]` | Single listing detail |
| `/seller/[id]` | Seller storefront |

### Seller Pages
| Route | Purpose |
|-------|---------|
| `/seller/register` | Seller signup |
| `/seller/dashboard` | My listings & stats |
| `/seller/create-listing` | Add new item with AI |
| `/seller/edit/[id]` | Edit listing |

### Admin Pages
| Route | Purpose |
|-------|---------|
| `/admin` | Dashboard |
| `/admin/categories` | Manage categories |
| `/admin/sellers` | Approve/reject sellers |

---

## 🔌 API Endpoints

### Listings
```
GET    /api/listings              # All listings
POST   /api/listings              # Create listing
GET    /api/listings/:id          # Get listing
PUT    /api/listings/:id          # Update listing
DELETE /api/listings/:id          # Delete listing
```

### Categories
```
GET    /api/categories            # All categories
GET    /api/categories/:id        # Get category with subcategories
GET    /api/attributes            # All attributes
```

### Sellers
```
GET    /api/sellers/:id           # Seller profile
POST   /api/sellers/register      # Seller signup
GET    /api/sellers/:id/listings  # Seller's listings
```

### AI Image Analysis
```
POST   /api/ai/analyze-image      # Upload image → AI generates listing
```

---

## 🎨 Styling

Uses **Tailwind CSS** with custom utilities:

```tsx
// Button styles
<button className="btn-primary">Primary</button>
<button className="btn-outline">Outline</button>

// Card component
<div className="card">Content</div>

// Container
<div className="container-max">Content</div>
```

---

## 📝 Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=Turan Market
```

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/turanmarket
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
NODE_ENV=production
PORT=5000
CORS_ORIGIN=http://localhost:3000
```

---

## 🧪 Testing

### Frontend
```bash
pnpm --filter @workspace/web run dev
# Open http://localhost:3000
```

### Backend
```bash
pnpm --filter @workspace/api-server run dev
# API at http://localhost:5000
```

### Database
```bash
# Run migrations
pnpm --filter @workspace/db run push

# View database
pnpm --filter @workspace/db run studio
```

---

## 📦 Categories & Attributes

### Main Categories (10+)
1. **🚗 Transport** — Cars, motorcycles, spare parts
2. **🌾 Agriculture** — Seeds, crops, fertilizers
3. **🐄 Livestock** — Cattle, sheep, poultry
4. **🏭 Industrial** — Machinery, equipment, tools
5. **🏠 Real Estate** — Apartments, houses, offices
6. **💼 Services** — Construction, repair, IT
7. **♻️ Used Items** — Anything secondhand
8. **🎯 Other** — Antiques, vintage, collectibles

### Subcategories (50+)
Each category has 5-10 subcategories (e.g., Transport → Cars, Motorcycles, Spare Parts, Tires, etc.)

### Dynamic Attributes (500+)
Auto-generated based on category:
- Transport: Brand, Model, Year, Mileage, Fuel Type, Transmission, Color
- Agriculture: Crop Type, Quantity, Unit, Origin, Certification
- Livestock: Species, Quantity, Age, Gender, Health Status

---

## 🔐 Authentication

```tsx
// Login/Register (coming soon)
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout

// JWT token storage in localStorage
// Auto-refresh on expiry
```

---

## 📊 Database Schema

### Users
- id, email, password, name, phone, role (buyer/seller/admin)

### Sellers
- id, userId, storeName, storeImage, rating, verified

### Listings
- id, sellerId, title, description, category, price, condition, image
- location, createdAt, updatedAt, status (active/sold/removed)

### Categories
- id, name, parent_id (null = main category), icon, description

### Attributes
- id, categoryId, name, type (text/select/number)

---

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Landing page
- ✅ Marketplace with filters
- ⏳ Seller registration
- ⏳ AI image analysis

### Phase 2
- Authentication (JWT)
- Seller dashboard
- Messaging between buyers/sellers
- Payment integration

### Phase 3
- Mobile app (React Native)
- Admin panel
- Advanced search (Elasticsearch)
- Recommendation engine

### Phase 4
- Video listings
- Live auctions
- Insurance integration
- Logistics API integration

---

## 🤝 Contributing

```bash
# 1. Fork the repo
# 2. Create feature branch
git checkout -b feature/amazing-feature

# 3. Commit changes
git commit -m "feat: add amazing feature"

# 4. Push to branch
git push origin feature/amazing-feature

# 5. Open Pull Request
```

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/hdtyggdd-dotcom/Turan-market/issues)
- **Email:** hdtyggdd@gmail.com
- **Docs:** [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📜 License

MIT License - see LICENSE file

---

## 🌍 Localization

- **O'zbekcha** (Uzbek)
- **Русский** (Russian)
- **English** (coming soon)

---

## 📈 Performance

- ⚡ Next.js Static Generation
- 🚀 API response caching
- 📦 Image optimization
- 🔄 Database query optimization

---

**Made with ❤️ for Central Asia** 🚀

Visit: **[turan-market.vercel.app](https://turan-market.vercel.app)**

---

**Last Updated:** September 2024
