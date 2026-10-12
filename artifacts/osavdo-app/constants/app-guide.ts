export const APP_GUIDE_QUESTION = 'Ilova nimalar qila oladi?';

// Customer-facing guidance describes available screens, not just API endpoints.
export const APP_GUIDE_SECTIONS = [
  {
    id: 'overview',
    title: '1. Cosmis nima?',
    text: 'Cosmis — mahsulotlar, xizmatlar va yuk tashishni bir joyda topish uchun marketplace. Xaridor tovar izlaydi, sotuvchi e’lon beradi, yuk egasi transport izlaydi, tasdiqlangan haydovchi tashish taklifini yuboradi. AI ilovadan foydalanish va savdo bo‘yicha maslahat beradi.',
  },
  {
    id: 'login',
    title: '2. Kirish, til va joylashuv',
    text: 'Kirishda til, davlat, ism, telefon va o‘zingiz tanlagan kirish kodi/parol ishlatiladi. Joylashuvni GPS ruxsati bilan aniqlash yoki qo‘lda tanlash mumkin. Sessiya saqlanadi; chiqish, akkaunt o‘chirilishi yoki sessiya tugashi qayta kirishni talab qilishi mumkin. Bu kirish kodi SMS orqali keladigan tasdiqlash kodi emas.',
  },
  {
    id: 'home',
    title: '3. Bosh sahifa',
    text: 'Bosh sahifada tovarlar va e’lonlar ko‘rsatiladi. Kerakli e’lonni ochib narx, tavsif, mavjud rasm va sotuvchi haqidagi ma’lumotlarni ko‘rasiz. Kategoriya ro‘yxati bosh sahifada emas, “Kategoriyalar” bo‘limida.',
  },
  {
    id: 'categories',
    title: '4. Kategoriya va subkategoriya',
    text: '“Kategoriyalar”dan kerakli yo‘nalishni, keyin unga tegishli subkategoriyani tanlang. E’lon berishda ham faqat tanlangan kategoriyaga mos subkategoriya ishlatiladi. Mahsulot, xizmat va yuk tashish vazifalarini bir-biri bilan adashtirmang.',
  },
  {
    id: 'listing',
    title: '5. E’lon joylash va boshqarish',
    text: '“E’lon joylash”da kategoriya → subkategoriya → nom va tavsif → rasm → narx → joylashuv → tasdiqlash tartibida ma’lumot kiriting. Viloyat va tumanni qo‘lda tanlash yoki GPS orqali aniqlash mumkin. E’lon joylashuvi akkaunt yoki ko‘rib chiqayotgan hududingizni o‘zgartirmaydi. Narx raqamlari o‘qishga qulay guruhlanadi, masalan: 10 000 yoki 100 000. “Mahsulotlarim” orqali o‘z e’lonlaringizni boshqarasiz.',
  },
  {
    id: 'search',
    title: '6. Tovar qidirish',
    text: '“Izlash”da nom bilan qidiring; kategoriya, subkategoriya, viloyat, tuman hamda eng kam/eng yuqori narxni tanlang. Qidiruv ayrim yozuv xatolariga ham mos natija izlaydi. Hozir yangi/ishlatilgan holat, transport turi, yuk turi, og‘irlik va sana bo‘yicha to‘liq qidiruv filtrlari tayyor emas. Davlat tanlashni alohida kengaytirilgan xalqaro qidiruv filtri deb qabul qilmang.',
  },
  {
    id: 'photo-search',
    title: '7. Rasm orqali AI qidiruv',
    text: '“Izlash” → “Rasm orqali qidirish”ni bosing. Tovarni suratga oling yoki galereyadan tanlang. AI rasmni tahlil qilib, katalogdan mos faol e’lonlarni izlaydi. Mos e’lon topilmasa, shu kategoriyada mahsulot e’loni bor sotuvchilarga talab xabari yuboriladi. Mijozning rasmi va shaxsiy ma’lumotlari ularga berilmaydi. AI xato qilishi mumkin; katalogda topilmagani barcha do‘konlarda tovar tugaganini anglatmaydi.',
  },
  {
    id: 'cart',
    title: '8. Savatcha va xarid',
    text: 'Tovar e’lonini oching, miqdorni tanlang va savatchaga qo‘shing. Savatchada mahsulotlar va miqdorlarni tekshirib, buyurtmani o‘zingiz tasdiqlang. E’lonni ko‘rish yoki AI bilan gaplashish avtomatik xarid degani emas. Xizmat e’loni yoki cargo taklifi oddiy tovar savatchasi bilan bir xil ishlamaydi.',
  },
  {
    id: 'orders',
    title: '9. Buyurtmalar va xariddan keyingi cargo',
    text: '“Mening buyurtmalarim”da xarid va sotuv buyurtmalari, yuk tashuvlari hamda tegishli xabarlarni ko‘rasiz. Tovar xarididan keyin yuk tashish tavsiya qilinadi, lekin transport avtomatik band qilinmaydi. Tovar og‘irligi, hajmi va manzillarini tekshirib, kerak bo‘lsa alohida yuk buyurtmasini tasdiqlang.',
  },
  {
    id: 'payment',
    title: '10. To‘lov qanday ishlaydi?',
    text: 'Hozir xaridor va sotuvchi kelishib, o‘z bank ilovalari orqali bir-biriga pul o‘tkazadi. Cosmis karta raqami, PIN, CVV yoki SMS kodini so‘ramaydi, pulni yechmaydi va bank o‘tkazmasini avtomatik tasdiqlamaydi. Buyurtma yoki “yetkazildi” holati “pul to‘landi” degani emas. Oluvchi va summani bank ilovasida tekshiring; sotuvchi pul tushganini o‘z hisobidan tekshirsin. Onlayn karta to‘lovi va avtomatik komissiya undirish yoqilmagan.',
  },
  {
    id: 'cargo',
    title: '11. Yuk tashish',
    text: '“Cargo / Yuklar markazi”da barcha yuklar yoki “Mening yuklarim”ni ko‘ring. “Yuk qo‘shish”da yuk ma’lumotlari, og‘irlik/hajm, boshlanish va yetkazish joylarini kiriting. Haydovchilar tashish narxini taklif qiladi; yuk egasi taklifni tanlaydi yoki qarshi narx beradi. Qarshi narxni haydovchi qabul qilmaguncha u yakuniy kelishilgan narx hisoblanmaydi. Safar holatlarini va yakunlanishini ishtirokchilar boshqaradi.',
  },
  {
    id: 'driver',
    title: '12. Haydovchi profili va transport',
    text: 'Haydovchi profilida verifikatsiya holati, reyting va baholar soni, bajarilgan qatnovlar, transport turi, raqami, yuk ko‘tarish imkoniyati, hajm, mavjud hamroh-yuk imkoniyati, bo‘sh bo‘lish sanasi, tasdiqlangan hujjatlar va yozilgan fikrlar ko‘rsatiladi. Faqat haydovchi rolini tanlash yetarli emas: yuk taklifi uchun hujjatlar va haqiqiy transport tasdiqlanishi kerak. Doimiy yo‘nalishlar va bekor qilingan buyurtmalar statistikasi hozir profilning tayyor funksiyasi emas.',
  },
  {
    id: 'rating',
    title: '13. Reyting va mijoz fikrlari',
    text: 'Haydovchining mavjud reytingi, baholar soni va yozilgan fikrlarini profilida ko‘rish mumkin. Masalan, 4.9 — reyting ko‘rinishining namunasi, barcha haydovchilarning haqiqiy bahosi emas. Buyurtma tugagach mijoz va haydovchi bir-birini baholaydigan to‘liq foydalanuvchi oqimi hali tayyor emas. Baholash tugmasi bor yoki haydovchi mijozga hozir baho bera oladi deb va’da qilinmaydi.',
  },
  {
    id: 'gps',
    title: '14. GPS, safar va maxfiylik',
    text: 'Joylashuv faqat ruxsatingiz bilan olinadi. Yukning aniq manzillari taklif qabul qilingach tegishli safar ishtirokchilariga ochiladi. Fon GPS uchun alohida rozilik, telefon ruxsatlari va mos native ilova kerak. Brauzer, Expo Go, ekran yopilishi yoki ilova majburan yopilishida uzluksiz kuzatuv kafolatlanmaydi. GPS noma’lum bo‘lsa, masofa yoki yetkazish narxi to‘qib chiqarilmaydi.',
  },
  {
    id: 'countries',
    title: '15. Davlatlar va tillar',
    text: 'Davlat tanlashda O‘zbekiston, Rossiya, Xitoy, Eron, Qozog‘iston, Qirg‘iziston, Tojikiston, Turkmaniston, Afg‘oniston va Turkiya mavjud. Kirish va ayrim asosiy yorliqlar uchun o‘zbek, rus, xitoy, fors, ingliz, qozoq, qirg‘iz, tojik, turkman, dari va turk tillari qo‘llanadi. Davlat mavjudligi xalqaro to‘lov, bojxona yoki barcha xorijiy hududlar to‘liq tayyor degani emas.',
  },
  {
    id: 'translation',
    title: '16. AI tarjima — keyingi bosqich',
    text: 'Davlat yoki interfeys tilini tanlash e’lon matnini avtomatik tarjima qilmaydi. E’lon nomi, tavsifi, yuk va transport ma’lumotlarini ruscha, xitoycha, forscha yoki inglizchaga AI orqali tarjima qilish hali alohida tayyor funksiya emas. Bu rejalashtirilgan imkoniyat; mavjud tarjima tugmasi sifatida ko‘rsatilmaydi.',
  },
  {
    id: 'advice',
    title: '17. AI maslahat va e’lon tahlili',
    text: 'AI’dan ilova qanday ishlashi, qaysi kategoriyani tanlash, e’lon matnini yaxshilash, narx va sotish usullari haqida so‘rang. E’lonning maslahat/tahlil bo‘limi mahsulot bo‘yicha tavsiyalar beradi. AI javobi kafolatlangan jonli bozor narxi yoki ekspert xulosasi emas. AI sizning nomingizdan e’lon joylamaydi, buyurtma yaratmaydi, pul o‘tkazmaydi yoki profilni o‘zgartirmaydi. Ushbu qo‘llanma va tayyor mavzular AI so‘rovisiz ochiladi; erkin savollar internet, akkaunt va mavjud AI limitiga bog‘liq.',
  },
  {
    id: 'profile',
    title: '18. Profil va akkaunt',
    text: '“Profil”da shaxsiy ma’lumotlar, rol, hudud, “Mahsulotlarim”, “Cargo”, “Mening buyurtmalarim”, yuk/savdo xabarlari, maxfiylik siyosati, chiqish va hisobni o‘chirish imkoniyatlari bor. Haydovchilar uchun verifikatsiya va transport ma’lumotlari boshqariladi. Ustalar obunasi hozir sinov rejimida; uni jonli to‘lov deb qabul qilmang. Akkauntni o‘chirish parol bilan tasdiqlanadi; faol majburiyatlar bo‘lsa avval ularni yakunlash talab qilinadi. “Saqlanganlar” va to‘liq “Sozlamalar” bo‘limlarini tayyor funksiya deb ko‘rsatmaymiz. Kategoriya ko‘rish va yangi e’lon berish uchun bosh menyudagi alohida bo‘limlardan foydalaning.',
  },
  {
    id: 'security',
    title: '19. Ishonch va xavfsizlik',
    text: 'Haydovchi hujjatlari va transporti tekshiriladi; hujjat muddati tugashi yoki tasdiq bekor qilinishi yangi yuk takliflarini cheklashi mumkin. Buyurtma va safar ma’lumotlari ishtirokchi huquqlariga bog‘liq. SMS orqali telefon tasdiqlash, foydalanuvchini bloklash, to‘liq shikoyat/moderatsiya va firibgarlikni aniqlash tizimini hozir tayyor deb bo‘lmaydi. Begonalarga PIN, CVV va SMS kod bermang; faqat reyting yoki ilovadagi holatga tayanib pul yubormang.',
  },
  {
    id: 'future',
    title: '20. Rejalashtirilgan rivojlanish',
    text: 'Keyingi bosqichlar: ikki tomonlama baholash, AI tarjima, saqlangan e’lonlar, kengaytirilgan qidiruv, haydovchi yo‘nalishlari/bekor qilish statistikasi va xavfsizlik vositalari. Kelishilgan kelajak tariflari: yuklab olish bepul, dastlabki oy bepul; xizmat ko‘rsatuvchi ustalar uchun keyin oyiga 30 000 so‘m; sotuvchi komissiyasi oylik savdo summasiga qarab 2–20%. Komissiya chegaralari hali to‘liq tasdiqlanmagan va jonli undirish yoqilmagan. Brauzer versiyasi mavjud, Expo Go — sinov ko‘rinishi. Android APK/AAB va iPhone tarqatilishi alohida build hamda tekshiruvni talab qiladi; Google Play yoki App Store’da allaqachon chiqarilgan deb va’da qilinmaydi.',
  },
] as const;

export const APP_GUIDE = [
  'Cosmis — ilova imkoniyatlari va foydalanish qo‘llanmasi',
  'Quyida mavjud imkoniyatlar va hali tayyor bo‘lmagan funksiyalar alohida tushuntirilgan.',
  ...APP_GUIDE_SECTIONS.map(section => `${section.title}\n${section.text}`),
].join('\n\n');

const GUIDE_TOPICS = [
  { question: 'Yuk va haydovchilar haqida', ids: ['cargo', 'driver', 'gps'] },
  { question: 'Reyting qanday ishlaydi?', ids: ['rating'] },
  { question: 'Davlatlar va AI tarjima', ids: ['countries', 'translation'] },
  { question: 'Qidiruv va profil', ids: ['search', 'profile'] },
  { question: 'To‘lov va xavfsizlik', ids: ['payment', 'security', 'future'] },
] as const;

export const APP_GUIDE_QUICK_QUESTIONS = [
  APP_GUIDE_QUESTION,
  ...GUIDE_TOPICS.map(topic => topic.question),
];

function normalizeQuestion(text: string): string {
  return text.trim().toLocaleLowerCase('uz')
    .replace(/[‘’ʻʼ`]/g, "'")
    .replace(/[?!.,:;]/g, '')
    .replace(/\s+/g, ' ');
}

const fullGuideAliases = new Set([
  APP_GUIDE_QUESTION, 'Ilova haqida', 'Barcha funksiyalar',
  'Ilova abzorini bering', 'Ilova imkoniyatlari',
].map(normalizeQuestion));

export function getAppGuideReply(question: string): string | null {
  const normalized = normalizeQuestion(question);
  if (fullGuideAliases.has(normalized)) return APP_GUIDE;
  const topic = GUIDE_TOPICS.find(item => normalizeQuestion(item.question) === normalized);
  if (!topic) return null;
  return APP_GUIDE_SECTIONS
    .filter(section => (topic.ids as readonly string[]).includes(section.id))
    .map(section => `${section.title}\n${section.text}`)
    .join('\n\n');
}
