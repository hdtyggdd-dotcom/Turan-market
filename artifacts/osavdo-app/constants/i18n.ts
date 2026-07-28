// O'Savdo — Multi-language translations
// 9 countries: uz, kz, kg, tj, tm, af, ru, cn, ir

export type LangCode = 'uz' | 'kz' | 'kg' | 'tj' | 'tm' | 'af' | 'ru' | 'cn' | 'ir';

export interface PhoneFormat {
  dialCode: string;
  maxDigits: number;
  placeholder: string;
  mask: string; // X = digit
}

export const PHONE_FORMATS: Record<LangCode, PhoneFormat> = {
  uz: { dialCode: '+998', maxDigits: 9,  placeholder: '90 123 45 67',  mask: 'XX XXX XX XX'  },
  kz: { dialCode: '+7',   maxDigits: 10, placeholder: '700 123 45 67', mask: 'XXX XXX XX XX' },
  kg: { dialCode: '+996', maxDigits: 9,  placeholder: '700 123 456',   mask: 'XXX XXX XXX'   },
  tj: { dialCode: '+992', maxDigits: 9,  placeholder: '90 123 4567',   mask: 'XX XXX XXXX'   },
  tm: { dialCode: '+993', maxDigits: 8,  placeholder: '65 123456',     mask: 'XX XXXXXX'     },
  af: { dialCode: '+93',  maxDigits: 9,  placeholder: '70 123 4567',   mask: 'XX XXX XXXX'   },
  ru: { dialCode: '+7',   maxDigits: 10, placeholder: '912 345 67 89', mask: 'XXX XXX XX XX' },
  cn: { dialCode: '+86',  maxDigits: 11, placeholder: '138 0013 8000', mask: 'XXX XXXX XXXX' },
  ir: { dialCode: '+98',  maxDigits: 10, placeholder: '912 345 6789',  mask: 'XXX XXX XXXX'  },
};

/** Apply mask formatting to raw digits */
export function formatPhoneDigits(digits: string, mask: string): string {
  let result = '';
  let di = 0;
  for (let i = 0; i < mask.length && di < digits.length; i++) {
    if (mask[i] === 'X') { result += digits[di++]; }
    else { result += mask[i]; }
  }
  return result;
}

/** Build full phone number for API (dialCode + digits) */
export function buildFullPhone(dialCode: string, digits: string): string {
  return dialCode + digits;
}

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────
export type TranslationKey =
  | 'appTagline'
  | 'login' | 'register' | 'logout'
  | 'phone' | 'password' | 'name'
  | 'selectCountry' | 'country' | 'region' | 'district'
  | 'enterPhone' | 'enterPassword' | 'enterName'
  | 'loginBtn' | 'registerBtn' | 'nextBtn' | 'saveBtn' | 'cancelBtn' | 'confirmBtn'
  | 'dontHaveAccount' | 'haveAccount'
  | 'buyer' | 'seller' | 'driver'
  | 'buyerDesc' | 'sellerDesc' | 'driverDesc'
  | 'locationStep' | 'infoStep'
  | 'home' | 'search' | 'addListing' | 'orders' | 'profile'
  | 'category' | 'subcategory' | 'price' | 'description' | 'title' | 'images'
  | 'publish' | 'publishing'
  | 'wrongCredentials' | 'fillAllFields' | 'passwordTooShort' | 'selectRegion'
  | 'role' | 'detectLocation' | 'detecting' | 'locationPermissionDenied'
  | 'countryDetected' | 'correctLocation' | 'reDetect' | 'skipUz'
  | 'demoHint'
  | 'welcomeBack'
  | 'createAccount';

export type Translations = Record<TranslationKey, string>;

const uz: Translations = {
  appTagline: "Mahalliy bozor — tumandagi eng yaxshi narxlar",
  login: "Kirish", register: "Ro'yxatdan o'tish", logout: "Chiqish",
  phone: "Telefon raqam", password: "Parol", name: "Ism",
  selectCountry: "Davlatni tanlang", country: "Davlat", region: "Viloyat/Shahar", district: "Tuman",
  enterPhone: "Raqamni kiriting", enterPassword: "Parolni kiriting", enterName: "Ismingizni kiriting",
  loginBtn: "Kirish", registerBtn: "Ro'yxatdan o'tish", nextBtn: "Keyingi", saveBtn: "Saqlash", cancelBtn: "Bekor", confirmBtn: "Tasdiqlash",
  dontHaveAccount: "Hisobingiz yo'qmi?", haveAccount: "Hisobingiz bormi?",
  buyer: "Xaridor", seller: "Sotuvchi", driver: "Haydovchi",
  buyerDesc: "Mahsulot sotib olaman", sellerDesc: "E'lon joylayman va sotaman", driverDesc: "Yetkazib beraman",
  locationStep: "Joylashuv", infoStep: "Ma'lumotlar",
  home: "Bosh sahifa", search: "Qidirish", addListing: "E'lon", orders: "Buyurtmalar", profile: "Profil",
  category: "Kategoriya", subcategory: "Subkategoriya", price: "Narx", description: "Tavsif", title: "Sarlavha", images: "Rasmlar",
  publish: "E'lonni joylash", publishing: "Joylashtirilmoqda...",
  wrongCredentials: "Telefon raqam yoki parol noto'g'ri", fillAllFields: "Barcha maydonlarni to'ldiring",
  passwordTooShort: "Parol kamida 6 ta belgi bo'lishi kerak", selectRegion: "Viloyat va tumanni tanlang",
  role: "Rol", detectLocation: "Joylashuvimni aniqlat", detecting: "AI joylashuvni aniqlamoqda...",
  locationPermissionDenied: "Joylashuv ruxsati berilmadi",
  countryDetected: "Joylashuvingiz aniqlandi", correctLocation: "Ha, to'g'ri", reDetect: "Qaytadan aniqlash", skipUz: "O'zbekiston — standart davom et",
  demoHint: "Demo: +998901234567 / test123",
  welcomeBack: "Xush kelibsiz!", createAccount: "Yangi hisob yarating",
};

const kz: Translations = {
  appTagline: "Жергілікті базар — ең жақсы бағалар",
  login: "Кіру", register: "Тіркелу", logout: "Шығу",
  phone: "Телефон нөмірі", password: "Құпиясөз", name: "Аты",
  selectCountry: "Елді таңдаңыз", country: "Ел", region: "Облыс/Қала", district: "Аудан",
  enterPhone: "Нөмірді енгізіңіз", enterPassword: "Құпиясөзді енгізіңіз", enterName: "Атыңызды енгізіңіз",
  loginBtn: "Кіру", registerBtn: "Тіркелу", nextBtn: "Келесі", saveBtn: "Сақтау", cancelBtn: "Болдырмау", confirmBtn: "Растау",
  dontHaveAccount: "Тіркелгіңіз жоқ па?", haveAccount: "Тіркелгіңіз бар ма?",
  buyer: "Сатып алушы", seller: "Сатушы", driver: "Жүргізуші",
  buyerDesc: "Тауар сатып аламын", sellerDesc: "Хабарландыру береімін", driverDesc: "Жеткіземін",
  locationStep: "Орналасу", infoStep: "Мәлімет",
  home: "Басты бет", search: "Іздеу", addListing: "Хабар", orders: "Тапсырыстар", profile: "Профиль",
  category: "Санат", subcategory: "Кіші санат", price: "Баға", description: "Сипаттама", title: "Тақырып", images: "Суреттер",
  publish: "Жариялау", publishing: "Жарияланып жатыр...",
  wrongCredentials: "Телефон немесе құпиясөз қате", fillAllFields: "Барлық өрістерді толтырыңыз",
  passwordTooShort: "Құпиясөз кемінде 6 таңба болуы керек", selectRegion: "Облыс пен ауданды таңдаңыз",
  role: "Рөл", detectLocation: "Орналасуымды анықта", detecting: "AI орналасуды анықтауда...",
  locationPermissionDenied: "Орналасуға рұқсат берілмеді",
  countryDetected: "Орналасуыңыз анықталды", correctLocation: "Иә, дұрыс", reDetect: "Қайта анықтау", skipUz: "Өзбекстан — әдепкі жалғастыру",
  demoHint: "Demo: +998901234567 / test123",
  welcomeBack: "Қош келдіңіз!", createAccount: "Жаңа тіркелгі жасаңыз",
};

const kg: Translations = {
  appTagline: "Жергиликтүү базар — эң жакшы баалар",
  login: "Кирүү", register: "Катталуу", logout: "Чыгуу",
  phone: "Телефон номери", password: "Сырсөз", name: "Аты",
  selectCountry: "Өлкөнү тандаңыз", country: "Өлкө", region: "Облус/Шаар", district: "Район",
  enterPhone: "Номерди киргизиңиз", enterPassword: "Сырсөздү киргизиңиз", enterName: "Атыңызды киргизиңиз",
  loginBtn: "Кирүү", registerBtn: "Катталуу", nextBtn: "Кийинки", saveBtn: "Сактоо", cancelBtn: "Жокко чыгаруу", confirmBtn: "Ырастоо",
  dontHaveAccount: "Эсебиңиз жокпу?", haveAccount: "Эсебиңиз барбы?",
  buyer: "Сатып алуучу", seller: "Сатуучу", driver: "Айдоочу",
  buyerDesc: "Товар сатып алам", sellerDesc: "Жарнама жайлайм", driverDesc: "Жеткирем",
  locationStep: "Жайгашуу", infoStep: "Маалымат",
  home: "Башкы бет", search: "Издөө", addListing: "Жарнама", orders: "Буйрутмалар", profile: "Профиль",
  category: "Категория", subcategory: "Субкатегория", price: "Баа", description: "Сүрөттөмө", title: "Аталыш", images: "Сүрөттөр",
  publish: "Жарнамалоо", publishing: "Жарыяланууда...",
  wrongCredentials: "Телефон же сырсөз туура эмес", fillAllFields: "Бардык талааларды толтуруңуз",
  passwordTooShort: "Сырсөз кеминде 6 белги болушу керек", selectRegion: "Облус жана районду тандаңыз",
  role: "Роль", detectLocation: "Жайгашуумду аныкта", detecting: "AI жайгашуусун аныктоодо...",
  locationPermissionDenied: "Жайгашуу уруксаты берилген жок",
  countryDetected: "Жайгашуүңүз аныкталды", correctLocation: "Ооба, туура", reDetect: "Кайра аныктоо", skipUz: "Өзбекстан — демейки улантуу",
  demoHint: "Demo: +998901234567 / test123",
  welcomeBack: "Кош келиңиз!", createAccount: "Жаңы эсеп жасаңыз",
};

const tj: Translations = {
  appTagline: "Бозори маҳаллӣ — нархҳои беҳтарин",
  login: "Вуруд", register: "Сабт", logout: "Хуруҷ",
  phone: "Рақами телефон", password: "Рамз", name: "Ном",
  selectCountry: "Кишварро интихоб кунед", country: "Кишвар", region: "Вилоят/Шаҳр", district: "Ноҳия",
  enterPhone: "Рақамро ворид кунед", enterPassword: "Рамзро ворид кунед", enterName: "Номатонро ворид кунед",
  loginBtn: "Вуруд", registerBtn: "Сабт", nextBtn: "Баъдӣ", saveBtn: "Захира", cancelBtn: "Бекор", confirmBtn: "Тасдиқ",
  dontHaveAccount: "Ҳисоб надоред?", haveAccount: "Ҳисоб доред?",
  buyer: "Харидор", seller: "Фурӯшанда", driver: "Ронанда",
  buyerDesc: "Маҳсулот мехарам", sellerDesc: "Эълон мегузорам", driverDesc: "Расонам",
  locationStep: "Ҷойгиршавӣ", infoStep: "Маълумот",
  home: "Саҳифаи асосӣ", search: "Ҷустуҷӯ", addListing: "Эълон", orders: "Фармоишҳо", profile: "Профил",
  category: "Категория", subcategory: "Зеркатегория", price: "Нарх", description: "Тавсиф", title: "Сарлавҳа", images: "Аксҳо",
  publish: "Нашр кардан", publishing: "Нашр мешавад...",
  wrongCredentials: "Телефон ё рамз нодуруст", fillAllFields: "Ҳамаи майдонҳоро пур кунед",
  passwordTooShort: "Рамз ҳадди аққал 6 аломат бошад", selectRegion: "Вилоят ва ноҳияро интихоб кунед",
  role: "Нақш", detectLocation: "Ҷойгиршавиамро муайян кун", detecting: "AI ҷойгиршавиро муайян мекунад...",
  locationPermissionDenied: "Иҷозати ҷойгиршавӣ дода нашуд",
  countryDetected: "Ҷойгиршавии шумо муайян шуд", correctLocation: "Бале, дуруст", reDetect: "Аз нав муайян кардан", skipUz: "Ӯзбекистон — пешфарз идома",
  demoHint: "Demo: +998901234567 / test123",
  welcomeBack: "Хуш омадед!", createAccount: "Ҳисоби нав созед",
};

const tm: Translations = {
  appTagline: "Ýerli bazar — iň gowy bahalar",
  login: "Giriş", register: "Hasap açmak", logout: "Çykmak",
  phone: "Telefon belgisi", password: "Açarsöz", name: "At",
  selectCountry: "Ýurdy saýlaň", country: "Ýurt", region: "Welaýat/Şäher", district: "Etrap",
  enterPhone: "Belgini giriziň", enterPassword: "Açarsözi giriziň", enterName: "Adyňyzy giriziň",
  loginBtn: "Giriş", registerBtn: "Hasap açmak", nextBtn: "Indiki", saveBtn: "Sakla", cancelBtn: "Ýatyr", confirmBtn: "Tassykla",
  dontHaveAccount: "Hasabyňyz ýokmy?", haveAccount: "Hasabyňyz barmy?",
  buyer: "Alyjy", seller: "Satyjy", driver: "Sürüji",
  buyerDesc: "Haryt satyn alýaryn", sellerDesc: "Yglan ýerleşdirýärin", driverDesc: "Eltip berýärin",
  locationStep: "Ýer", infoStep: "Maglumat",
  home: "Baş sahypa", search: "Gözlemek", addListing: "Yglan", orders: "Buýurmalar", profile: "Profil",
  category: "Kategoriýa", subcategory: "Kiçi kategoriýa", price: "Baha", description: "Beýan", title: "Başlyk", images: "Suratlar",
  publish: "Çap etmek", publishing: "Çap edilýär...",
  wrongCredentials: "Telefon ýa-da açarsöz ýalňyş", fillAllFields: "Ähli meýdanlary dolduryň",
  passwordTooShort: "Açarsöz azyndan 6 nyşan bolmaly", selectRegion: "Welaýat we etraby saýlaň",
  role: "Rol", detectLocation: "Ýerimi anykla", detecting: "AI ýeri anyklaýar...",
  locationPermissionDenied: "Ýer rugsady berilmedi",
  countryDetected: "Ýeriňiz anyklandy", correctLocation: "Hawa, dogry", reDetect: "Täzeden anyklamak", skipUz: "Özbegistan — adaty dowam",
  demoHint: "Demo: +998901234567 / test123",
  welcomeBack: "Hoş geldiňiz!", createAccount: "Täze hasap dörediň",
};

const af: Translations = {
  appTagline: "بازار محلی — بهترین قیمت‌ها",
  login: "ورود", register: "ثبت نام", logout: "خروج",
  phone: "شماره تلفن", password: "رمز عبور", name: "نام",
  selectCountry: "کشور را انتخاب کنید", country: "کشور", region: "ولایت/شهر", district: "ولسوالی",
  enterPhone: "شماره را وارد کنید", enterPassword: "رمز عبور را وارد کنید", enterName: "نام خود را وارد کنید",
  loginBtn: "ورود", registerBtn: "ثبت نام", nextBtn: "بعدی", saveBtn: "ذخیره", cancelBtn: "لغو", confirmBtn: "تأیید",
  dontHaveAccount: "حساب ندارید؟", haveAccount: "حساب دارید؟",
  buyer: "خریدار", seller: "فروشنده", driver: "راننده",
  buyerDesc: "محصول می‌خرم", sellerDesc: "آگهی می‌گذارم", driverDesc: "تحویل می‌دهم",
  locationStep: "موقعیت", infoStep: "اطلاعات",
  home: "صفحه اصلی", search: "جستجو", addListing: "آگهی", orders: "سفارشات", profile: "پروفایل",
  category: "دسته", subcategory: "زیردسته", price: "قیمت", description: "توضیحات", title: "عنوان", images: "تصاویر",
  publish: "انتشار", publishing: "در حال انتشار...",
  wrongCredentials: "شماره یا رمز اشتباه است", fillAllFields: "همه فیلدها را پر کنید",
  passwordTooShort: "رمز باید حداقل ۶ کاراکتر باشد", selectRegion: "ولایت و ولسوالی را انتخاب کنید",
  role: "نقش", detectLocation: "موقعیتم را تشخیص بده", detecting: "AI موقعیت را تشخیص می‌دهد...",
  locationPermissionDenied: "اجازه موقعیت داده نشد",
  countryDetected: "موقعیت شما تشخیص داده شد", correctLocation: "بله، درست است", reDetect: "تشخیص مجدد", skipUz: "ازبکستان — پیش‌فرض ادامه",
  demoHint: "Demo: +998901234567 / test123",
  welcomeBack: "خوش آمدید!", createAccount: "حساب جدید بسازید",
};

const ru: Translations = {
  appTagline: "Местный рынок — лучшие цены в районе",
  login: "Войти", register: "Регистрация", logout: "Выйти",
  phone: "Номер телефона", password: "Пароль", name: "Имя",
  selectCountry: "Выберите страну", country: "Страна", region: "Область/Город", district: "Район",
  enterPhone: "Введите номер", enterPassword: "Введите пароль", enterName: "Введите имя",
  loginBtn: "Войти", registerBtn: "Зарегистрироваться", nextBtn: "Далее", saveBtn: "Сохранить", cancelBtn: "Отмена", confirmBtn: "Подтвердить",
  dontHaveAccount: "Нет аккаунта?", haveAccount: "Есть аккаунт?",
  buyer: "Покупатель", seller: "Продавец", driver: "Водитель",
  buyerDesc: "Покупаю товары", sellerDesc: "Размещаю объявления", driverDesc: "Доставляю",
  locationStep: "Местоположение", infoStep: "Данные",
  home: "Главная", search: "Поиск", addListing: "Объявление", orders: "Заказы", profile: "Профиль",
  category: "Категория", subcategory: "Подкатегория", price: "Цена", description: "Описание", title: "Заголовок", images: "Фото",
  publish: "Разместить", publishing: "Размещается...",
  wrongCredentials: "Неверный телефон или пароль", fillAllFields: "Заполните все поля",
  passwordTooShort: "Пароль минимум 6 символов", selectRegion: "Выберите область и район",
  role: "Роль", detectLocation: "Определить моё местоположение", detecting: "AI определяет местоположение...",
  locationPermissionDenied: "Доступ к геолокации запрещён",
  countryDetected: "Ваше местоположение определено", correctLocation: "Да, верно", reDetect: "Определить снова", skipUz: "Узбекистан — по умолчанию",
  demoHint: "Demo: +998901234567 / test123",
  welcomeBack: "Добро пожаловать!", createAccount: "Создайте новый аккаунт",
};

const cn: Translations = {
  appTagline: "本地市场 — 最优惠的价格",
  login: "登录", register: "注册", logout: "退出",
  phone: "手机号码", password: "密码", name: "姓名",
  selectCountry: "请选择国家", country: "国家", region: "省/市", district: "区县",
  enterPhone: "请输入号码", enterPassword: "请输入密码", enterName: "请输入姓名",
  loginBtn: "登录", registerBtn: "注册", nextBtn: "下一步", saveBtn: "保存", cancelBtn: "取消", confirmBtn: "确认",
  dontHaveAccount: "没有账户？", haveAccount: "已有账户？",
  buyer: "买家", seller: "卖家", driver: "司机",
  buyerDesc: "购买商品", sellerDesc: "发布广告", driverDesc: "配送",
  locationStep: "位置", infoStep: "信息",
  home: "首页", search: "搜索", addListing: "发布", orders: "订单", profile: "个人",
  category: "分类", subcategory: "子分类", price: "价格", description: "描述", title: "标题", images: "图片",
  publish: "发布广告", publishing: "发布中...",
  wrongCredentials: "手机号或密码错误", fillAllFields: "请填写所有字段",
  passwordTooShort: "密码至少6个字符", selectRegion: "请选择省份和地区",
  role: "角色", detectLocation: "检测我的位置", detecting: "AI正在检测位置...",
  locationPermissionDenied: "位置权限被拒绝",
  countryDetected: "已检测到您的位置", correctLocation: "是的，正确", reDetect: "重新检测", skipUz: "乌兹别克斯坦 — 默认继续",
  demoHint: "Demo: +998901234567 / test123",
  welcomeBack: "欢迎回来！", createAccount: "创建新账户",
};

const ir: Translations = {
  appTagline: "بازار محلی — بهترین قیمت‌ها در منطقه",
  login: "ورود", register: "ثبت‌نام", logout: "خروج",
  phone: "شماره موبایل", password: "رمز عبور", name: "نام",
  selectCountry: "کشور را انتخاب کنید", country: "کشور", region: "استان/شهر", district: "منطقه",
  enterPhone: "شماره را وارد کنید", enterPassword: "رمز عبور را وارد کنید", enterName: "نام خود را وارد کنید",
  loginBtn: "ورود", registerBtn: "ثبت‌نام", nextBtn: "بعدی", saveBtn: "ذخیره", cancelBtn: "لغو", confirmBtn: "تأیید",
  dontHaveAccount: "حساب ندارید؟", haveAccount: "حساب دارید؟",
  buyer: "خریدار", seller: "فروشنده", driver: "راننده",
  buyerDesc: "محصول می‌خرم", sellerDesc: "آگهی می‌گذارم", driverDesc: "تحویل می‌دهم",
  locationStep: "موقعیت مکانی", infoStep: "اطلاعات",
  home: "خانه", search: "جستجو", addListing: "آگهی", orders: "سفارش‌ها", profile: "پروفایل",
  category: "دسته‌بندی", subcategory: "زیردسته", price: "قیمت", description: "توضیحات", title: "عنوان", images: "تصاویر",
  publish: "انتشار آگهی", publishing: "در حال انتشار...",
  wrongCredentials: "شماره یا رمز اشتباه است", fillAllFields: "لطفاً همه فیلدها را پر کنید",
  passwordTooShort: "رمز باید حداقل ۶ کاراکتر باشد", selectRegion: "استان و منطقه را انتخاب کنید",
  role: "نقش", detectLocation: "موقعیتم را تشخیص بده", detecting: "در حال تشخیص موقعیت...",
  locationPermissionDenied: "دسترسی به موقعیت مکانی رد شد",
  countryDetected: "موقعیت شما تشخیص داده شد", correctLocation: "بله، درسته", reDetect: "دوباره تشخیص بده", skipUz: "ازبکستان — پیش‌فرض ادامه",
  demoHint: "Demo: +998901234567 / test123",
  welcomeBack: "خوش برگشتید!", createAccount: "حساب جدید بسازید",
};

export const TRANSLATIONS: Record<LangCode, Translations> = { uz, kz, kg, tj, tm, af, ru, cn, ir };

/** Map countryId → default language */
export const COUNTRY_LANG: Record<string, LangCode> = {
  uz: 'uz', kz: 'kz', kg: 'kg', tj: 'tj',
  tm: 'tm', af: 'af', ru: 'ru', cn: 'cn', ir: 'ir',
};
