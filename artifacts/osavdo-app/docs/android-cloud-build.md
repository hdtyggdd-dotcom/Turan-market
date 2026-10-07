# Telefonda Android build

## Hozirgi bosqich

GitHub Actions’da kompyutersiz standalone APK yig‘ish uchun
`.github/workflows/android-cloud-test.yml` ishga tushirildi va Android test APK
muvaffaqiyatli yig‘ildi. Joriy source `android-phone-test-...` branchida;
`main`dagi eski loyiha fayllari almashtirilmadi. Artifact har builddan keyin
7 kun saqlanadi. Bu native telefonda sinov yoki Google Play tasdig‘i emas.

GitHub’dagi eski kodni to‘g‘ridan-to‘g‘ri build qilmang: u hozirgi login,
kategoriya, savatcha, cargo va obuna o‘zgarishlaridan oldingi holat bo‘lishi mumkin.
Butun monorepo, lockfile va patches saqlansin. Mijozlar bazasi, hujjat/suratlar,
attached_assets, agent xotirasi, tokenlar, .git, .env va signing kalitlari source
eksportiga kiritilmasin. Existing remote-only kodni o‘zboshimchalik bilan o‘chirmang.

## GitHub sozlamalari

- Egasi joriy source’ni mavjud ommaviy GitHub repository’sining alohida
  branchida saqlashni tasdiqlagan. Keyingi yangi kodni export qilishdan oldin
  unda foydalanuvchi ma’lumoti va maxfiy kalit yo‘qligini qayta tekshiring.
- Actions repository variable `TURAN_API_DOMAIN` tasdiqlangan production
  hostname bo‘lsin. Native build development hostname bilan chiqarilmaydi.
- `EXPO_PUBLIC_REVENUECAT_TEST_API_KEY` faqat Test Store public SDK key.
  Private RevenueCat, Anthropic yoki bank kalitini bu variable’ga qo‘ymang.
- Workflow faqat qo‘lda ishga tushadi; source push avtomatik build yoki
  Google Play submission boshlamaydi.
- Repo visibility/account plan’ga qarab Actions limitlari va xarajatlari
  owner tomonidan tekshirilsin; bepul yoki cheksiz deb va’da berilmasin.

## Telefonda olish

GitHub → repository → Actions → **Turan Market - Android phone test**
→ **Run workflow**. Branch sifatida `android-phone-test-...` ni tanlang;
`main`da eski kod turibdi. Muvaffaqiyatli run ichidagi
**turan-market-internal-phone-test** ZIP’ni yuklab olib oching.
Ichidagi `turan-market-internal-test.apk` ni o‘rnating.
Android kerak bo‘lsa aynan shu brauzer/file manager uchun o‘rnatish ruxsatini
so‘raydi. Begona noma’lum APK’larni o‘rnatmang.

Bu APK Expo prebuild’ning debug signing’i bilan faqat ichki sinov uchun:
Metro/Expo Go kerak bo‘lmasligi kerak, lekin haqiqiy build bilan tasdiqlansin.
Kamera, GPS/fon GPS, bildirishnoma, login, akkaunt o‘chirish, savatcha, buyurtma,
cargo va internet uzilishi Android telefonda tekshirilsin.

## Google Play oldidan

APK Google Play uchun signed AAB o‘rnini bosmaydi. Mavjud package/signing identity
tekshirilib, production upload key xavfsiz boshqarilishi, versionCode aniqlanishi,
signed release AAB qurilishi va native test/policy talablarining bajarilishi kerak.
Upload key va parollar public source yoki build artifact’da saqlanmasin.
Google Play Console ichidagi Internal testing, zarur Closed testing va Production
review’ni hisob egasi tasdiqlaydi. Faqat workflow success’ga qarab chiqarildi
deb aytmang.
