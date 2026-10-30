# 📱 ANDROID AAB BUILD GUIDE — Turan Market

**Maqsad:** GitHub Actions orqali avtomatik Android AAB build qilish va Play Market'ga yuklash.

---

## 🚀 STEP 1: Expo Account Setup

### A. Expo.dev'da ro'yxatdan o'tish

1. **https://expo.dev'ga kiring**
2. **Sign up** qiling (email + password)
3. **Confirm email**

### B. Expo CLI install

```bash
npm install -g expo-cli
# yoki
pnpm add -g expo-cli
```

### C. Expo login (local)

```bash
expo login
# Email: hdtyggdd@gmail.com
# Password: ***
```

---

## 🔐 STEP 2: EAS Build Credentials Setup

### A. Android Keystore yaratish

```bash
cd artifacts/osavdo-app

# EAS build init
eas build:configure --platform android
```

Javob:

```
? Android experience on Expo Go? → No
? Generate new Keystore? → Yes
```

Bu jarayondan:
- ✅ **Keystore fayli** yaratiladi (`android/app/release.keystore`)
- ✅ **Parollar** saqlanadi (Expo console'da)
- ✅ **app.json** avtomatik update bo'ladi

### B. Keystore fayl'ni base64'ga convert qilish

```bash
# Linux/Mac
base64 android/app/release.keystore | pbcopy

# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("android/app/release.keystore")) | Set-Clipboard
```

**Natija:** uzun text string (copy qiling ✂️)

---

## 🔑 STEP 3: GitHub Secrets Setup

### A. GitHub repo settings

1. Repository → **Settings**
2. **Secrets and variables** → **Actions** (left menu)
3. **"New repository secret"** bosing

### B. Secrets qo'shish

**4 ta secret kerak:**

| Secret Name | Value | Qayerdan? |
|-------------|-------|----------|
| `EXPO_TOKEN` | Expo CLI token | `expo login` → `~/.expo/credentials.json` |
| `ANDROID_KEYSTORE_BASE64` | Keystore (base64) | Step 2B'dan (copy qiling) |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore parol | EAS init'dan |
| `ANDROID_KEY_PASSWORD` | Key parol | EAS init'dan |

### C. EXPO_TOKEN qayerdan olish?

**Option 1: CLI orqali**
```bash
expo auth:token
# Token paydo bo'ladi — copy qiling
```

**Option 2: Expo Console**
1. https://expo.dev/accounts/hdtyggdd-dotcom/settings/tokens
2. **Create token** bosing
3. Token copy qiling

### D. Secrets qo'shish (misol)

```
Secret name: EXPO_TOKEN
Value: [paste token]

Secret name: ANDROID_KEYSTORE_BASE64
Value: [paste base64 keystore]

Secret name: ANDROID_KEYSTORE_PASSWORD
Value: [parol — masalan: Turan@2024]

Secret name: ANDROID_KEY_PASSWORD
Value: [parol — masalan: Turan@2024]
```

**Hammasi qo'shildi?** ✅ Continue.

---

## ⚙️ STEP 4: eas.json Configure

Repository root'da `eas.json` faylini yaratish:

```bash
# Turan-market/ root'da
touch eas.json
```

**`eas.json` content:**

```json
{
  "cli": {
    "version": ">= 8.0.0",
    "promptToConfigurePushNotifications": false
  },
  "build": {
    "production": {
      "node": "24.0.0",
      "env": {
        "EXPO_PUBLIC_APP_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccount": "$ANDROID_SERVICE_ACCOUNT_BASE64",
        "track": "internal"
      }
    }
  }
}
```

---

## 📝 STEP 5: app.json Check

`artifacts/osavdo-app/app.json` ichida Android config:

```json
{
  "expo": {
    "name": "Turan Market",
    "slug": "osavdo-app",
    "version": "1.0.0",
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.hdtyggdd.osavdo"
    }
  }
}
```

**Muhim:** `android.package` o'zgartirilsin! (Play Market uchun unique)

```json
"package": "com.turanmarket.osavdo"
```

---

## 🔄 STEP 6: Build Trigger

### A. Avtomatik (Push)

```bash
git add .
git commit -m "feat: ready for Android build"
git push origin main
```

GitHub Actions avtomatik ishga tushadi:
- ✅ `artifacts/osavdo-app/` o'zgartirilsa
- ✅ `main` branch'ga push bo'lsa

### B. Manual (Console)

1. GitHub → **Actions**
2. **"🚀 Build Android AAB for Play Market"** tanlang
3. **"Run workflow"** bosing
4. **"Build"** (green) bosing

**Status ko'rish:**
- **In progress:** ⏳ Running
- **Done:** ✅ Success
- **Error:** ❌ Failed (logs ko'ring)

---

## 📊 STEP 7: Build Status Monitoring

### A. GitHub Actions logs

```
Repository → Actions → "🚀 Build Android AAB" → Click run
```

**Stages:**
1. 📥 Checkout (1 min)
2. 🔧 Setup Node.js (2 min)
3. 📦 Install dependencies (5 min)
4. ✅ TypeCheck (2 min)
5. 🏗️ Build AAB (30-60 min) ← **Eng uzoq**
6. 📤 Upload artifact (5 min)

### B. EAS Console

```
https://expo.dev/accounts/hdtyggdd-dotcom/builds
```

**Real-time build status ko'rishingiz mumkin:**
- Build #001: 🟡 Queued
- Build #002: 🟢 Succeeded
- Build #003: 🔴 Failed

### C. Build Log'ini Download

```
EAS Console → Build #00X → Download logs
```

---

## ✅ STEP 8: Play Market Submission

### A. AAB faylini download qilish

**Yo'l 1: GitHub Actions'dan**
```
Actions → Build run → Artifacts → osavdo-app-aab.zip
```

**Yo'l 2: EAS Console'dan**
```
Expo.dev → Builds → Build #00X → Download
```

### B. Play Market'ga upload

1. **https://play.google.com/console** → Sign in
2. **"Turan Market" app** tanlang
3. **Release** → **Android App Bundles**
4. **Upload new version** bosing
5. **.aab faylini** tanlang
6. **Review details** (tavsif, rasm, version notes)
7. **Submit for review** bosing

---

## 🐛 TROUBLESHOOTING

### ❌ "EXPO_TOKEN not found"
**Fix:**
```
GitHub Settings → Secrets → EXPO_TOKEN qo'shilganini check qiling
```

### ❌ "Keystore password incorrect"
**Fix:**
```
ANDROID_KEYSTORE_PASSWORD va ANDROID_KEY_PASSWORD to'g'ri ekanini check qiling
```

### ❌ "Build failed: Node version"
**Fix:** `build-android-aab.yml`'da Node version o'zgartirilsin:
```yaml
NODE_VERSION: 24
```

### ❌ "Type errors during build"
**Fix:**
```bash
pnpm run typecheck
# Xatolikni tuzing
git push origin main
```

### ❌ "EAS build queue full"
**Solution:** 30 daqiqa kutib, qayta try qiling.

---

## 📈 STEP 9: Version Management

### A. Version increment

`artifacts/osavdo-app/app.json`:
```json
{
  "expo": {
    "version": "1.0.0"  // ← Har build uchun increment
  }
}
```

**Sequence:**
- v1.0.0 → First release
- v1.0.1 → Bug fixes
- v1.1.0 → New features
- v2.0.0 → Major update

### B. Build number (versionCode)

```json
{
  "android": {
    "versionCode": 1  // ← Auto increment (EAS)
  }
}
```

---

## 🔄 STEP 10: Continuous Updates

### Quyidagi o'zgarishlar automatikly build trigger qiladi:

```yaml
paths:
  - 'artifacts/osavdo-app/**'  ← App papkasi
  - 'lib/**'                   ← Shared libraries
  - 'package.json'             ← Dependencies
  - 'pnpm-workspace.yaml'      ← Workspace config
```

**Yangi build startlaşi uchun:**
```bash
cd artifacts/osavdo-app
# App o'zgartirilsin
git push origin main  # → Build avtomatik ishga tushadi
```

---

## 🎯 FINAL CHECKLIST

```
✅ Expo account created (https://expo.dev)
✅ EAS configured (eas.json)
✅ Android Keystore generated
✅ GitHub Secrets added (4 ta)
✅ app.json updated (package name, version)
✅ .github/workflows/build-android-aab.yml active
✅ Code push → Build triggered
✅ AAB downloaded from EAS Console
✅ Play Market console account active
✅ App listing created (com.turanmarket.osavdo)
✅ AAB uploaded to Play Market
✅ Submitted for review
```

---

## 📞 SUPPORT

- **Expo Docs:** https://docs.expo.dev/build/
- **EAS Submit:** https://docs.expo.dev/submit/android/
- **Play Market:** https://support.google.com/googleplay/

---

## 🚀 QUICK START (TL;DR)

```bash
# 1. Expo login
expo login

# 2. Generate keystore
cd artifacts/osavdo-app
eas build:configure --platform android

# 3. Copy base64 keystore
base64 android/app/release.keystore | pbcopy

# 4. Add GitHub Secrets (4 ta)
# Settings → Secrets → Actions

# 5. Push code
git push origin main

# 6. Watch build (GitHub Actions)
# → Download AAB (EAS Console)

# 7. Upload to Play Market
# https://play.google.com/console
```

---

**Turon Market — Play Market'da jiydaladi! 🚀📱**
