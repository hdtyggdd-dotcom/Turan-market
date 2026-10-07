# Google Play uchun tayyorgarlik

Tayyorlangan: 2026-10-06. Bu tayyorgarlik hujjati; imzolangan AAB yaratilmadi va Google Play’ga yuklanmadi.

## Mavjud identifikatorni saqlang
- Android package: `com.turanmarket.app`.
- Egasi tasdiqlagan ommaviy yordam emaili: `fazliddin.16.09.2004@gmail.com`. Play Console’da ham shu kontakt kiritilsin.
- Version: `1.0.0`, versionCode: `1`. Shu package oldin Play Console’ga yuklangan bo‘lsa, keyingi AAB versionCode avvalgisidan yuqori bo‘lsin. Package yoki signing identity’ni o‘zboshimchalik bilan o‘zgartirmang.
- SDK: Expo 54 / React Native 0.81.5. Dependency alignment tekshiruvi o‘tdi; bu imzolangan native build tekshiruvi emas.
- Native release uchun build muhitida `EXPO_PUBLIC_DOMAIN=turanmarket.net` berilishi kerak. Bu ochiq API hostname, maxfiy kalit emas. Development `replit.dev` manzilini native release ichiga qo‘ymang.
- Backend va uning eng yangi API funksiyalari alohida production versiyasida ishlashi kerak. Workspace’da ishlashi production’da mavjudligini isbotlamaydi.
- `app.json` statik qoladi; dynamic Expo config yoki maxfiy kalitlar qo‘shilmadi.
- Native builder butun pnpm workspace, lockfile va local dependency patch’larini saqlasin; faqat bitta artifact katalogini ko‘chirish shared API client importlarini uzadi. Build uchun devDependencies ham kerak. Anthropic va signing maxfiy kalitlari mobil bundle yoki `EXPO_PUBLIC_*` ichiga kiritilmasin.
- Materiallar va statik Android sozlamalari uchun `pnpm --filter @workspace/osavdo-app run check:android-preparation` bor. Bu native build yoki store siyosatlari tasdig‘i emas.

## Android ruxsatlari
- Kamera: foydalanuvchi suratga olishni tanlaganida so‘raladi.
- Galereya: tizim photo picker’i faqat tanlangan faylga kirish beradi. Barcha surat/video kutubxonasiga kirish so‘ralmaydi.
- Mikrofon, keng foto/video o‘qish va tashqi storage ruxsatlari bloklangan. Faqat rasmlar ishlatiladi; video yozish mavjud emas.
- Joylashuv: foreground GPS va haydovchining alohida roziligi bilan faol yukdagi background GPS saqlangan. GPS funksiyasi chiqarilishdan oldin haqiqiy Android qurilmada tekshirilsin.
- Background location deklaratsiyasi, asosiy foydalanish sababini ko‘rsatuvchi video, ruxsatdan oldingi disclosure va location foreground-service deklaratsiyasi kerak. Tasdiq berilmasdan bu ruxsatlar Google tomonidan qabul qilingan deb aytmang.
- Telefon push xabarlari uchun native loyiha identifikatori va Android push sozlamalari native build xizmatida tekshirilsin. Ilova ichidagi xabarlar bundan mustaqil.

## Materiallar
- `store-listing-uz.txt`: Play Console’ga ko‘chirish uchun o‘zbekcha tavsif.
- `play-console-guide.html`: egasi uchun qisqa, yuklab olinadigan qo‘llanma.
- `../assets/images/android-icon.png`: Expo ilova ikonkasi, 1024×1024.
- `../assets/images/android-adaptive-foreground.png`: launcher foreground, 1024×1024.
- `../../../release-assets/turan-market/play-icon.png`: Play Store ikonkasi, 512×512 RGB PNG.
- `../../../release-assets/turan-market/feature-graphic.png`: 1024×500 PNG.
- Kamida 2 ta haqiqiy Android release skrinshoti kerak. 1080×1920 portret rasmlar tavsiya qilinadi. Browserdagi mocked AI natijalarini haqiqiy AI aniqligining dalili sifatida store’ga qo‘ymang.

## Chiqarishni to‘xtatadigan ochiq talablar
1. **Akkaunt o‘chirish:** profil ichidagi “Hisobni o‘chirish” va `/api/account-deletion` web sahifasi qo‘shilgan. Faol buyurtma yoki qabul qilingan tashish avval yakunlanadi/bekor qilinadi; oxirgi admin boshqaruvni topshirishi kerak. Kontakt, GPS, surat va hujjat ma’lumotlari olib tashlanadi; boshqa tomonning tugallangan tarixi kontaktsiz, minimal kirib bo‘lmaydigan texnik identifikator bilan qoladi. Hujjat fayllari uchun qayta urinadigan server navbati bor. Production backend yangilanmaguncha web manzil Google Play uchun tayyor deb belgilanmasin.
2. **Maxfiylik:** ommaviy yordam emaili va saqlash/o‘chirish shartlari qo‘shilgan; siyosat AI provayderiga yuboriladigan surat va matnlar, haydovchi hujjatlari, fon GPS va push xizmatini ham tushuntiradi. Workspace’dagi siyosat o‘zgarishi production’ga avtomatik chiqarilgan deb hisoblanmasin. Play Console Data safety javoblari haqiqiy yig‘ish, uzatish va saqlash tartibiga mos tekshirilsin.
3. **Backend:** production API’da yangi photo-search va bildirishnoma funksiyalarini tekshiring; shunchaki development preview bilan chiqarib bo‘lmaydi.
4. **Native AAB:** Android build va signing Replit ichida bu tayyorgarlik bilan bajarilmadi. Replit Expo Launch hozir Google Play submission’ni qo‘llamaydi; yakuniy native build va Google Play submission mustaqil Android chiqarish jarayonida qilinadi.
5. **Native sinov:** kamera, gallery, hujjat yuklash, ruxsat rad etilishi, account/session, buyurtma, ekran o‘chiq va uzoq safardagi GPS, push, internet uzilishi tekshirilsin.
6. **Rasmli qidiruvdan e’longa o‘tish:** oynaning ko‘rinishi faol route bilan cheklangan. Tuzatishdan keyingi signed-in browser tekshiruvi test worker’i sessiyani yo‘qotgani sabab yakunlanmadi. E’lon ochilganda modal yopilishi va qaytishda o‘z-o‘zidan ochilmasligi native sinovda tasdiqlansin.

## Play Console bosqichlari
1. Create app: Turan Market; App; Free. Ommaviy kontakt, mamlakat, maqsadli auditoriya va kategoriya egasi tomonidan tasdiqlansin.
2. Main store listing: matn, 512×512 ikonka, 1024×500 feature graphic va haqiqiy telefon skrinshotlarini yuklang.
3. App content: privacy policy, Data safety, app access (reviewer uchun alohida test akkaunti), kontent reytingi, auditoriya, reklama va permission deklaratsiyalarini to‘ldiring. “Reklama yo‘q” faqat yakuniy build’dagi barcha SDKlar tekshirilgach belgilanadi.
4. Internal testing’da imzolangan AAB’ni tekshiring. Target SDK, signing, native kutubxonalar va 16 KB page-size mosligini aynan yakuniy AAB’da tasdiqlang.
5. Kerak bo‘lsa Closed testing va Production access jarayonini o‘ting. Testchi soni va muddati akkaunt turiga va Play Console ko‘rsatgan amaldagi talabga bog‘liq; tasdiqni oldindan va’da qilmang.
6. Pre-launch report va policy xatolarini tuzating; shundan keyin Production review’ga yuboring.

2026-08-31’dan yangi app/update uchun telefon Android target API 36 yoki yuqori talabi bor. Yakuniy native builder va Play Console’da amaldagi talab qayta tekshirilsin.

## Data safety uchun ishchi ro‘yxat — avtomatik tasdiq emas
| Ma’lumot | Amaldagi foydalanish | Tekshirish |
| --- | --- | --- |
| Ism, telefon, account identifikatori | Account va e’lon/buyurtma munosabatlari | Collection, deletion, retention |
| GPS, manzil va hudud | Mahalliy qidiruv, yetkazish, rozilik bilan yuk kuzatuvi | Approximate/precise location, background, optional |
| Suratlar | Ommaviy e’lonlar; vaqtinchalik AI qidiruvi; shaxsiy haydovchi hujjatlari | Ephemeral/persistent, public/private, service-provider sharing |
| AI matni | Maslahat va mahsulot tasnifi | Anthropic provider, ephemeral processing va retention shartlari |
| Haydovchi hujjatlari va transport ma’lumoti | Admin tekshiruvi | Personal/other information, private access, retention |
| Buyurtma narxi va tarixi | Savatcha, savdo, tashish | Purchase history; bank karta ma’lumoti yig‘ilmaydi |
| Ichki akkaunt IDsi, sinov obunasi/xaridi va SDK texnik so‘rovlari | RevenueCat Test Store’dagi ustalar obunasi sinovi | Pseudonymous user ID, purchase history, SDK data; live billing disabled; provider retention/deletion reviewed before launch |
| Xabarlar va push token | Ilova ichidagi bildirishnoma va telefon xabarlari | Messages/device identifiers, optional notification permission |

Ma’lumot almashish bo‘yicha Google’dagi “service provider” istisnolari va shartnomalar tekshirilsin; “hech narsa yig‘ilmaydi” yoki “hech narsa uchinchi tomonga uzatilmaydi” deb noto‘g‘ri belgilanmasin. To‘lovlar hozir yoqilmagan. Kelajakdagi ustalar obunasi va sotuvchi komissiyasining billing talablari alohida ko‘rib chiqilishi kerak.

## Manbalar
- https://docs.replit.com/features/artifact-types/building-mobile-apps
- https://support.google.com/googleplay/android-developer/answer/11926878
- https://support.google.com/googleplay/android-developer/answer/17190352
- https://docs.expo.dev/versions/v54.0.0/sdk/imagepicker/
