# Turan Market — Android / Google Play

## Joriy Android sozlamalari

- Expo ilova: `artifacts/osavdo-app/`.
- Android package ID: `com.turanmarket.osavdo`.
- `artifacts/osavdo-app/eas.json` preview uchun APK va production uchun Google Play’ga mos AAB profillarini belgilaydi. EAS sozlamalari mobil app papkasida turishi kerak.
- GitHub Actions build workflow hozircha yo‘q. Build buyruqlari quyida EAS CLI uchun berilgan.

## Builddan oldin

### 1. Production API manzilini sozlang

Mobil ilova API manzilini `EXPO_PUBLIC_DOMAIN` dan oladi va unga `https://` qo‘shadi. EAS project’ning production environment’ida `EXPO_PUBLIC_DOMAIN` ni faqat host nomi bilan belgilang, masalan `api.example.com`.

Builddan oldin `https://<host>/api/healthz` manzili HTTP `200` va `{"status":"ok"}` qaytarishini tekshiring. Repo’dagi `DEPLOYMENT.md` da ko‘rsatilgan `turan-api-prod.up.railway.app` manzili hozir `404 Application not found` qaytaryapti; u ishlamasa production buildga kiritmang.

### 2. Expo/EAS project’ni ulang

Repo root’dan dependency’larni o‘rnating, keyin EAS CLI buyruqlarini app papkasidan bajaring:

```bash
pnpm install
cd artifacts/osavdo-app
pnpm dlx eas-cli@latest login
pnpm dlx eas-cli@latest init
```

`eas init` ilovani Expo account’dagi EAS project’ga bog‘laydi va project ID’ni app config’ga yozadi. Android signing keystore’ni EAS’da yaratib, EAS credentials’da saqlang; keystore yoki parollarni GitHub’ga commit qilmang.

## Build

Sinov uchun APK:

```bash
pnpm dlx eas-cli@latest build --platform android --profile preview
```

Google Play’ga yuklash uchun AAB:

```bash
pnpm dlx eas-cli@latest build --platform android --profile production
```

Build EAS dashboard’da tugagach AAB’ni yuklab oling. Production buildni boshlashdan avval production API health check muvaffaqiyatli bo‘lishi shart.

## Google Play’ga yuklash

1. Play Console’da `com.turanmarket.osavdo` package ID bilan app listing yarating yoki mavjud listing ID’si aynan shu ekanini tasdiqlang.
2. AAB’ni avval **Internal testing** track’iga yuklab, Android qurilmada tekshiring.
3. Store listing, privacy policy, Data safety, content rating va qolgan Play Console talablarini to‘ldiring.
4. Sinovdan so‘ng Play Console’dan production release’ga o‘ting. `eas.json` dagi EAS Submit profili hozir `internal` track’ga mo‘ljallangan.

EAS Submit’ni avtomatlashtirish uchun Google Play service-account kalitini EAS credentials’ga yuklash kerak; kalitni GitHub’ga commit qilmang va chatga yubormang. Birinchi release’ni Play Console’da qo‘lda yuklash ham mumkin.

## Versiyalar

Birinchi `versionCode` — `1`. Har bir yangi Play Store uploadidan oldin `artifacts/osavdo-app/app.json` ichidagi Android `versionCode` ni oshiring. Android package ID nashrdan keyin o‘zgarmaydi.
