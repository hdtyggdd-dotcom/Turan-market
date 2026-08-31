import { Router } from "express";

const router = Router();

router.get("/privacy-policy", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="uz">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Turan Market — Maxfiylik siyosati</title>
    <style>
      body { margin: 0; padding: 32px 18px; background: #f6f8f7; color: #17221d; font: 16px/1.65 Arial, sans-serif; }
      main { max-width: 760px; margin: 0 auto; padding: 28px; background: #fff; border-radius: 18px; box-shadow: 0 8px 30px rgba(20, 50, 35, .08); }
      h1 { margin-top: 0; color: #087f5b; } h2 { margin-top: 28px; color: #155c46; }
      li { margin: 8px 0; } .muted { color: #617069; }
    </style>
  </head>
  <body>
    <main>
      <h1>Turan Market maxfiylik siyosati</h1>
      <p class="muted">Yangilangan sana: 30-avgust 2026</p>
      <p>Turan Market foydalanuvchilarga mahsulot, xizmat va yuk tashish e’lonlarini joylash, ko‘rish va kelishuv qilish imkonini beradi.</p>

      <h2>Qanday ma’lumotlar yig‘iladi</h2>
      <ul>
        <li>Ro‘yxatdan o‘tish uchun ism, telefon raqami, rol va tanlangan hudud.</li>
        <li>Foydalanuvchi joylagan e’lonlar, rasmlar, narxlar va yuk ma’lumotlari.</li>
        <li>Foydalanuvchi ruxsat bergandagina joylashuv ma’lumotlari — hududni aniqlash va yukni kuzatish uchun.</li>
        <li>Buyurtma, to‘lov va transport taklifi holatlari.</li>
      </ul>

      <h2>To‘lovlar</h2>
      <p>Visa va boshqa bank karta ma’lumotlari Turan Market serverida saqlanmaydi. Karta ma’lumotlari xavfsiz Stripe Checkout sahifasida qayta ishlanadi. Turan Market faqat buyurtma va to‘lov holati hamda Stripe identifikatorlarini saqlaydi.</p>

      <h2>Ma’lumotlardan foydalanish</h2>
      <p>Ma’lumotlar akkauntni boshqarish, e’lonlarni ko‘rsatish, buyurtmalarni bajarish, yuk tashishni tashkil qilish, xavfsizlikni ta’minlash va to‘lov holatini tekshirish uchun ishlatiladi. Ma’lumotlar reklama maqsadida sotilmaydi.</p>

      <h2>Uchinchi tomon xizmatlari</h2>
      <p>Ma’lumotlar ilovaning API serveri va PostgreSQL bazasida saqlanadi. Karta to‘lovlari Stripe tomonidan qayta ishlanadi. Ushbu xizmatlar o‘zlarining maxfiylik va xavfsizlik qoidalariga ega.</p>

      <h2>Saqlash va o‘chirish</h2>
      <p>Ma’lumotlar akkaunt va buyurtma munosabatlari zarur bo‘lgan muddatda saqlanadi. Akkaunt yoki ma’lumotlarni o‘chirish bo‘yicha so‘rov Play Console’dagi Turan Market developer kontaktiga yuborilishi mumkin.</p>

      <h2>Bolalar xavfsizligi</h2>
      <p>Turan Market 13 yoshdan kichik bolalar uchun mo‘ljallanmagan. Biz bunday foydalanuvchilardan ataylab ma’lumot yig‘maymiz.</p>

      <h2>O‘zgarishlar</h2>
      <p>Ushbu siyosat yangilansa, ilovada va shu sahifada yangi sana ko‘rsatiladi.</p>
    </main>
  </body>
</html>`);
});

export default router;