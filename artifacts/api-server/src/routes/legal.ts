import { Router } from "express";

const router = Router();

router.get("/privacy-policy", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="uz">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Cosmos Market — Maxfiylik siyosati</title>
    <style>
      body { margin: 0; padding: 32px 18px; background: #f6f8f7; color: #17221d; font: 16px/1.65 Arial, sans-serif; }
      main { max-width: 760px; margin: 0 auto; padding: 28px; background: #fff; border-radius: 18px; box-shadow: 0 8px 30px rgba(20, 50, 35, .08); }
      h1 { margin-top: 0; color: #087f5b; } h2 { margin-top: 28px; color: #155c46; }
      li { margin: 8px 0; } .muted { color: #617069; }
    </style>
  </head>
  <body>
    <main>
      <h1>Cosmos Market maxfiylik siyosati</h1>
      <p class="muted">Yangilangan sana: 9-oktabr 2026</p>
      <p>Cosmos Market foydalanuvchilarga mahsulot, xizmat va yuk tashish e’lonlarini joylash, ko‘rish va kelishuv qilish imkonini beradi.</p>

      <h2>Qanday ma’lumotlar yig‘iladi</h2>
      <ul>
        <li>Ro‘yxatdan o‘tish uchun ism, telefon raqami, rol va tanlangan hudud.</li>
        <li>Foydalanuvchi joylagan e’lonlar, rasmlar, narxlar va yuk ma’lumotlari.</li>
        <li>Foydalanuvchi ruxsat bergandagina joylashuv ma’lumotlari — hududni aniqlash va yukni kuzatish uchun.</li>
        <li>Buyurtma va transport taklifi holatlari.</li>
        <li>Haydovchi o‘zi topshirgan shaxsiy hujjatlar va transport ma’lumotlari — administrator tekshiruvi uchun.</li>
        <li>AI maslahat matni, rasmli mahsulot qidiruvi va ruxsat berilgan telefon bildirishnomalari uchun texnik push token.</li>
      </ul>

      <h2>To‘lovlar</h2>
      <p>Ilova ichida onlayn karta to‘lovlari hozircha mavjud emas. Cosmos Market karta raqami, amal qilish muddati yoki xavfsizlik kodini so‘ramaydi va saqlamaydi.</p>
      <p>Xaridor va sotuvchi o‘zaro kelishib, o‘z bank ilovalari orqali bevosita pul o‘tkazishi mumkin. Kelishuv uchun buyurtma ishtirokchilariga bir-birining mavjud bog‘lanish telefoni ko‘rsatiladi. Cosmos Market bu o‘tkazmani amalga oshirmaydi, bank tasdig‘ini olmaydi va “to‘landi” deb avtomatik belgilamaydi. Buyurtma yoki yetkazish holati to‘lov tasdig‘i emas. Pul yuborishdan oldin oluvchining ismi va summani bank ilovasida tekshiring; sotuvchi pul tushganini o‘z bank hisobidan tekshirsin. SMS kod, PIN va CVVni boshqa foydalanuvchilarga bermang.</p>
      <p>Ustalar obunasi bo‘limida faqat RevenueCat Test Store sinov xaridlari mavjud. Ekrandagi sinov narxi haqiqiy tarif emas va pul yechilmaydi. Ilova ichidagi haqiqiy obuna, bepul oy tarifi va avtomatik bank to‘lovlari hozircha yoqilmagan.</p>

      <h2>Ma’lumotlardan foydalanish</h2>
      <p>Ma’lumotlar akkauntni boshqarish, e’lonlarni ko‘rsatish, buyurtmalarni bajarish, yuk tashishni tashkil qilish va xavfsizlikni ta’minlash uchun ishlatiladi. Ma’lumotlar reklama maqsadida sotilmaydi.</p>

      <h2>Uchinchi tomon xizmatlari</h2>
      <p>Akkaunt, e’lon va buyurtma ma’lumotlari API serveri va PostgreSQL bazasida saqlanadi. Haydovchi hujjat fayllari shaxsiy App Storage’da saqlanadi va faqat vakolatli tekshiruv uchun ochiladi.</p>
      <p>Ustalar obunasi bo‘limi ochilganda RevenueCat xizmatiga ichki akkaunt identifikatori va SDK so‘rovlari yuboriladi; sinov xaridi va obuna holati shu xizmatda qayd qilinadi. Integratsiya ism, telefon raqami yoki GPS ma’lumotini RevenueCat’ga yubormaydi. Xizmat tarmoq so‘rovlari orqali texnik ma’lumotlarni ham qayta ishlashi mumkin. Xaridni tiklash va holatni ko‘rsatish uchun shu xizmatdan foydalaniladi.</p>
      <p>AI maslahat uchun yuborilgan matn va rasm orqali qidirishda tanlangan surat Anthropic AI xizmatiga ishlov berish uchun yuboriladi. Rasmli qidiruvning asl surati qidiruv tarixi sifatida bazaga saqlanmaydi; rasm va shaxsiy kontakt sotuvchilarga yuborilmaydi. Anthropic o‘z ma’lumotlarni saqlash va xavfsizlik shartlariga ega. Suratga ortiqcha shaxsiy ma’lumot kiritmang.</p>
      <p>Telefon bildirishnomalari yoqilganda texnik push token va xabar Expo push xizmatiga yuboriladi. Haydovchi alohida rozilik bilan faqat faol tashish uchun fon GPS’ni ulashadi; ekran yopiq holatdagi ish operatsion tizim cheklovlariga bog‘liq va kuzatuvni to‘xtatish mumkin.</p>

      <h2>Saqlash va o‘chirish</h2>
      <p>Akkauntni profil ichidagi “Hisobni o‘chirish” orqali yoki ilovani o‘rnatmasdan <a href="./account-deletion">akkauntni o‘chirish sahifasi</a> orqali yopish mumkin. Amaldagi parol va aniq tasdiq talab qilinadi. O‘chirish qaytarilmaydi; faol buyurtma yoki qabul qilingan tashish avval yakunlanishi yoki bekor qilinishi kerak.</p>
      <p>Ism, telefon, profil hududi, savatcha, e’lon rasmlari va haydovchi hujjatlari olib tashlanadi, eski sessiyalar va bildirishnoma obunalari bekor bo‘ladi. Shaxsiy hujjat fayllari serverdagi navbat orqali o‘chiriladi; saqlash xizmati vaqtincha ishlamasa tizim qayta urinadi va natijada fayl o‘chirish kutilayotgani ko‘rsatiladi.</p>
      <p>Boshqa ishtirokchining tugallangan buyurtma va tashish tarixi ism, telefon, aniq manzil, surat va shaxsiy izohlarsiz saqlanadi. Akkauntni qayta tiklanib ketishdan himoyalash uchun minimal texnik identifikatorlar saqlanadi; ular bilan kirib bo‘lmaydi. Noaniq o‘chirish javobini xavfsiz qayta tekshirish uchun kontakt yoki parolning o‘zi emas, so‘rov identifikatori bilan aralashtirilgan texnik nazorat izi 7 kungacha saqlanadi va avtomatik tozalanadi. Umumiy AI xarajatining anonim hisoblagichi saqlanadi.</p>
      <p>Avval boshqa foydalanuvchilarga ochiq tarqatilgan e’lon rasmlari yoki ulardagi nusxalarni qaytarib olish kafolatlanmaydi. Parolni unutish yoki faol buyurtma bo‘yicha muammo bo‘lsa, yordam emailiga murojaat qiling; parol va hujjat suratlarini email orqali yubormang.</p>

      <h2>Bog‘lanish</h2>
      <p>Cosmos Market bo‘yicha yordam va maxfiylik savollari uchun: <a href="mailto:fazliddin.16.09.2004@gmail.com">fazliddin.16.09.2004@gmail.com</a>.</p>

      <h2>Bolalar xavfsizligi</h2>
      <p>Cosmos Market 13 yoshdan kichik bolalar uchun mo‘ljallanmagan. Biz bunday foydalanuvchilardan ataylab ma’lumot yig‘maymiz.</p>

      <h2>O‘zgarishlar</h2>
      <p>Ushbu siyosat yangilansa, ilovada va shu sahifada yangi sana ko‘rsatiladi.</p>
    </main>
  </body>
</html>`);
});

export default router;