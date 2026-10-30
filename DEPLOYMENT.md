# 🚀 DEPLOYMENT GUIDE — Turan Market

## 📋 Quick Start

Turan Market **3 ta server**dan iborat:
1. **Frontend** (Next.js) — Vercel'da
2. **Backend API** (Express) — Railway/Render'da
3. **Database** (PostgreSQL) — Vercel Postgres yoki Railway

---

## 🔵 **STEP 1: Frontend Deploy (Vercel)**

### A. GitHub'ni Vercel'ga ulash

1. **Vercel.com'ga kiring**
   ```
   https://vercel.com
   ```

2. **"Import Project" bosing**

3. **GitHub repo'ni tanlang:**
   ```
   hdtyggdd-dotcom/Turan-market
   ```

4. **Settings:**
   - **Root Directory:** `artifacts/web`
   - **Build Command:** `pnpm run build`
   - **Output Directory:** `.next`

5. **Environment Variables qo'shing:**
   ```
   NEXT_PUBLIC_API_URL=https://turan-api.railway.app
   DATABASE_URL=postgresql://...
   ```

6. **Deploy bosing** → **Vercel havola paydo bo'ladi**

### ✅ Result:
```
https://turan-market.vercel.app
```

---

## 🔴 **STEP 2: Backend API Deploy (Railway)**

### A. Railway'ga sign up

1. **Railway.app'ga kiring**
   ```
   https://railway.app
   ```

2. **"New Project" → "Deploy from GitHub"**

3. **GitHub'da authorize qiling**

4. **Repo tanlang:** `hdtyggdd-dotcom/Turan-market`

### B. Environment qo'shing

Railway dashboard'da:

```env
DATABASE_URL=postgresql://user:pass@host:5432/turanmarket
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
NODE_ENV=production
PORT=5000
```

### C. Build & Start Commands

```json
{
  "scripts": {
    "build": "pnpm run build",
    "start": "node artifacts/api-server/dist/index.js"
  }
}
```

### ✅ Result:
```
https://turan-api-prod.up.railway.app
```

---

## 🟢 **STEP 3: Database Setup (Railway Postgres)**

### A. Railway'da PostgreSQL qo'shish

1. Railway dashboard'da **"Create"** → **"Database"** → **"Postgres"**

2. **Automatic** `DATABASE_URL` o'ziga qo'shiladi

3. **Copy DATABASE_URL:**
   ```
   postgresql://user:password@containers.railway.app:7193/railway
   ```

### B. Migration qilish

Repository'dan:

```bash
pnpm --filter @workspace/db run push
```

Yoki Vercel CLI orqali:

```bash
vercel env pull .env.local
pnpm --filter @workspace/db run push
```

### ✅ Result:
- Database jadvallari yaratiladi
- `categories`, `subcategories`, `attributes` jadvallari ham

---

## 📝 **STEP 4: Environment Variables**

### **Frontend (.env.local — Vercel)**
```env
NEXT_PUBLIC_API_URL=https://turan-api-prod.up.railway.app
NEXT_PUBLIC_APP_NAME=Turan Market
```

### **Backend (.env — Railway)**
```env
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://turan-market.vercel.app
```

---

## 🔗 **STEP 5: Custom Domain (Optional)**

### **Vercel'da:**
1. Settings → **Domains**
2. `turanmarket.uz` qo'shing
3. DNS settings'ni nameserver'ga qo'shing

### **Railway'da:**
1. Settings → **Custom Domain**
2. `api.turanmarket.uz` yoki `api-prod.turanmarket.uz`

---

## ✅ **FINAL LINKS**

| Server | URL |
|--------|-----|
| **Frontend** | `https://turan-market.vercel.app` |
| **API** | `https://turan-api-prod.up.railway.app` |
| **Admin** | `https://turan-market.vercel.app/admin` |
| **Docs** | `https://turan-market.vercel.app/docs` |

---

## 🧪 **TEST QILISH**

### Frontend:
```bash
curl https://turan-market.vercel.app
```

### API:
```bash
curl https://turan-api-prod.up.railway.app/api/categories
```

### Database:
```bash
psql $DATABASE_URL -c "SELECT * FROM categories;"
```

---

## 🔄 **Auto-Deployment (CI/CD)**

Push qilganda **automatic** deploy bo'ladi:

1. **GitHub'da code push qilamiz**
   ```bash
   git add .
   git commit -m "fix: update categories"
   git push origin main
   ```

2. **Vercel** → Auto-build + Deploy
3. **Railway** → Auto-build + Deploy

**Status ko'rish:**
- Vercel: `https://vercel.com/dashboard`
- Railway: `https://railway.app/dashboard`

---

## ⚠️ **Common Issues**

### **1. Database connection error**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
✅ Fix: Railway'dan `DATABASE_URL` o'zgartirilganini tekshiring

### **2. API CORS error**
```
Access to XMLHttpRequest blocked by CORS policy
```
✅ Fix: Backend `.env`'da:
```env
CORS_ORIGIN=https://turan-market.vercel.app
```

### **3. Build error**
```
pnpm: command not found
```
✅ Fix: Railway/Vercel settings'da `Node 24` tanlang

---

## 📞 **Support**

- **Vercel Issues:** vercel.com/support
- **Railway Issues:** railway.app/support
- **GitHub:** hdtyggdd-dotcom/Turan-market/issues

---

## 🎯 **Next Steps**

1. ✅ Frontend deploy (Vercel)
2. ✅ Backend deploy (Railway)
3. ✅ Database setup
4. ⏭️ Admin panel (kategoriya manager)
5. ⏭️ Marketplace page (listings)
6. ⏭️ AI image analysis
7. ⏭️ Mobile app (React Native)

**Tayyorlardamiz!** 🚀
