# Ustalar obunasi: faqat sinov rejimi

## Ilovada

Sotuvchi akkauntida Profil → **Ustalar obunasi (sinov)** yoki `/subscription`.
Bu maishiy xizmat ko‘rsatuvchi ustalar uchun tayyorgarlik, barcha sotuvchilarni
pulli rejimga o‘tkazmaydi. Xaridor va haydovchi obuna xaridini boshlay olmaydi.

Sinov xaridini boshlashdan oldin ilovaning tasdiqlash oynasi ochiladi.
Bekor qilish, holatni yangilash va xaridlarni tiklash mavjud. Faol obuna bo‘lsa
takroriy xarid tugmasi yashiriladi. Holat SDK’dan qayta olinadi, mahalliy
`paid=true` belgisi yoki brauzer qaytish havolasi to‘lov isboti emas.

Kirish shakli, kategoriya joylashuvi, savatcha va cargo tavsiyasi o‘zgartirilmadi.
Tovar ekvayringi va sotuvchi komissiyasini yechish yoqilmagan.

## Narx va bepul oy

RevenueCat Test Store UZS narxini qabul qilmadi. Shuning uchun sinov mahsulotida
**1 USD namunaviy narx** bor; haqiqiy pul yechilmaydi. Bu rejalashtirilgan
30 minglik oylik tarifning konvertatsiyasi yoki o‘zgarishi emas.
Ilova mahsulot nomi va narxini SDK’dan oladi.

Test Store bepul trial’ni qo‘llamaydi. Rejalashtirilgan bir oy bepul foydalanish
hozir obuna trial’i yoki paywall sifatida yoqilmagan. Haqiqiy valyuta, bepul oy
boshlanish hodisasi va store shartlari tasdiqlanib, Google Play Console’da alohida
sozlanishi kerak. Haqiqiy tarifni sinov namunasidan avtomatik ko‘chirmang.

## Texnik sozlash

- `react-native-purchases` Expo workspace’da o‘rnatilgan.
- Test Store ommaviy kaliti va `EXPO_PUBLIC_REVENUECAT_MODE=test` Replit
  environment sozlamalarida. Private API kaliti mobil bundle’da yo‘q.
- Ishlatilayotgan loyiha/app identifikatorlari environment sozlamalarida;
  katalog IDlarini client kodiga ko‘chirmang.
- Standalone katalog skripti:
  `pnpm --filter @workspace/scripts exec tsx src/seedRevenueCat.ts <configured-project-id>`.
  Loyiha IDsi `REVENUECAT_PROJECT_ID` orqali ham olinadi.
- Skript mavjud loyiha resurslarini qayta ishlatadi. Live store narxlari,
  bank hisoblari yoki foydalanuvchi entitlements grantlarini yaratmaydi.
- SDK foydalanuvchisi `turan:<internal-user-id>`; telefon/email yuborilmaydi.
  SDK amallari seriallashtiriladi, akkaunt o‘zgargan kechikkan chaqiruv rad etiladi.
- Mavjud savdo funksiyalari bu client holati bilan cheklanmaydi.

## Haqiqiy billing oldidan

Brauzerda real Test Store xaridi, tasdiqlashni bekor qilish, qayta yuklanganda
faol holat, restore va ikki sotuvchi orasidagi holat izolyatsiyasi tekshirildi.
Sinov uchun yaratilgan lokal akkauntlar o‘chirildi. RevenueCat’dagi sinov
yozuvlarini o‘chirish esa 403 berdi: ulanishda
`customer_information:customers:read_write` ruxsati yetishmayapti.
Haqiqiy billing va tashqi obuna ma’lumotlarini avtomatik o‘chirishdan oldin shu
ruxsat va provider retention/deletion jarayoni hal qilinsin. Mahalliy akkaunt
o‘chirilishi barcha tashqi provider yozuvlari o‘chirildi degani emas.

Google Play Console mahsuloti va monthly base plan, haqiqiy narx, trial,
RevenueCat–Google Play server ruxsatlari va Android native build kerak.
Faqat `MODE=live` deb yozish yetarli emas: mavjud client himoyasi live kalitni
rad etadi. Alohida tasdiqlangan implementatsiya talab qilinadi.

Pulli imkoniyatlar ochilishidan oldin backend foydalanuvchining store holatini
mustaqil tekshirsin; Test Store/sandbox natijasi haqiqiy to‘lovga tenglashtirilmasin.
Refund, bekor qilish, trial tugashi, internet uzilishi, restore va boshqa akkauntga
o‘tish native Android’da ham tekshirilsin. Browser Test Store sinovi Google Play
to‘lovi yoki Expo Go native xaridi tasdiqlangani degani emas.
