# Yuk uchun fon GPS

## Ishlash chegaralari

- Faqat haydovchi alohida rozilik berib yoqqan bitta yuk kuzatiladi.
- Brauzer va Expo Go fon GPSni qo‘llamaydi. Android/iOS native ilovasini
  yangi `expo-location` konfiguratsiyasi va `expo-task-manager` bilan qayta
  yig‘ish kerak; faqat JavaScript yangilanishi yetarli emas.
- Android xizmat bildirishnomasi va iOS joylashuv indikatori yoqiladi.
  Taxminan 60 soniya / 100 metr, Balanced aniqlik; aniq vaqtni operatsion
  tizim belgilaydi. iOS uchun yuborish tezligi ham dasturda cheklangan.
- Ilova minimallashtirilganda va ekranlar almashganda davom etadi.
  Majburan yopish, telefonni qayta ishga tushirish, ruxsatni bekor qilish
  yoki batareya cheklovlaridan keyin davom etish kafolatlanmaydi.
- Yetkazish/bekor qilishdan keyin server GPSni darhol rad etadi. Haydovchi
  o‘zi yetkazishni belgilasa xizmat darhol to‘xtatiladi; boshqa qurilmadan
  o‘zgarsa keyingi fon chaqirig‘i yoki ilova faol tekshiruvida to‘xtaydi.
- Chiqish/akkaunt almashtirish oldidan mahalliy rozilik o‘chiriladi,
  ketayotgan so‘rov bekor qilinadi. Fon jarayoni kirish holatini diskdan
  tekshiradi; tokenning alohida nusxasi saqlanmaydi. 401/403/404/409
  javoblari ulashishni tugatadi, avtomatik qayta kirish amalga oshirilmaydi.
- Internet yo‘q paytda koordinatalar navbatga yig‘ilmaydi. 3 daqiqadan eski
  GPS “eskirgan / oflayn” ko‘rinadi; bu telefon hozir aynan shu nuqtada
  ekanini bildirmaydi. Yuborilgan fix vaqti serverga alohida uzatiladi.

## Native qurilmada release tekshiruvi

1. Android va iOS build o‘rnating. Oddiy kirish hech qanday fon ruxsati
   so‘ramasligini tekshiring.
2. Biriktirilgan haydovchi sifatida fon GPS tugmasini bosing; rozilikni
   bekor qilish ruxsat so‘rovi yoki ulashishni boshlamasligini tekshiring.
3. Rozilik berib old va fon ruxsatlarini yoqing; Android bildirishnomasi
   va iOS indikatorini tekshiring.
4. Boshqa ekranga o‘ting, telefonni qulflang va harakatlaning. Yuk egasi
   ikkinchi qurilmada yangi fix vaqtini ko‘rishi kerak.
5. Internetni o‘chiring: eski nuqta jonli ko‘rinmasin. Qayta ulang:
   eski nuqtalar yangi kabi qayta yuborilmasin.
6. Global to‘xtatish, yetkazish, chiqish, akkaunt almashtirish va ruxsatni
   bekor qilishni sinang; bundan keyin yangi koordinata yuborilmasin.
7. Telefonni majburan yopish/batareya cheklovlarini sinang va egada stale
   holati chiqishini tasdiqlang. App Store/Google Play uchun fon joylashuv
   asoslanishi, maxfiylik siyosati va ruxsat deklaratsiyalarini to‘ldiring.

Brauzer skrinshoti native operatsion tizimdagi fon ishini tasdiqlamaydi.
