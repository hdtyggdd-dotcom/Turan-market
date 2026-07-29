// O'Savdo in-memory store with full Uzbekistan seed data

export interface StoredCountry {
  id: string;        // ISO 2-letter: uz, kz, kg, ...
  name: string;      // Uzbek name
  nameRu: string;    // Russian name
  flag: string;      // emoji
  dialCode: string;  // e.g. +998
  currency: string;  // e.g. UZS
}

export interface StoredRegion {
  id: string;
  name: string;
  nameRu: string;
  countryId: string;
  lat: number;
  lng: number;
}

export interface StoredDistrict {
  id: string;
  name: string;
  nameRu: string;
  regionId: string;
  lat: number;
  lng: number;
}

export interface StoredNeighborhood {
  id: string;
  name: string;
  nameRu: string;
  districtId: string;
}

export interface StoredSubcategory {
  id: string;
  name: string;
  nameRu: string;
  categoryId: string;
  bookingMode?: 'full' | 'showcase' | null;
}

export interface StoredCategory {
  id: string;
  name: string;
  nameRu: string;
  icon: string;
  subcategories: StoredSubcategory[];
}

export interface StoredUser {
  id: string;
  phone: string;
  name: string;
  password: string;
  role: 'buyer' | 'seller' | 'driver' | 'admin';
  sellerBadge: 'manufacturer' | 'reseller' | null;
  verificationStatus: 'none' | 'pending' | 'approved' | 'rejected';
  regionId: string | null;
  districtId: string | null;
  neighborhoodId: string | null;
  rating: number | null;
  totalSales: number;
  createdAt: string;
}

export interface StoredListing {
  id: string;
  title: string;
  titleRu: string | null;
  description: string | null;
  price: number;
  priceUnit: string | null;
  images: string[];
  categoryId: string;
  subcategoryId: string | null;
  userId: string;
  regionId: string;
  districtId: string;
  neighborhoodId: string | null;
  lat: number | null;
  lng: number | null;
  status: 'active' | 'sold' | 'paused';
  sellerType: 'sotuvchi' | 'ishlab_chiqaruvchi' | null;
  listingType: 'savdo' | 'xizmat';
  elanTur: 'oddiy' | 'vip';
  adminStatus: 'pending' | 'approved' | null;
  viewCount: number;
  createdAt: string;
}

export interface StoredOrder {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  quantity: number;
  totalPrice: number;
  deliveryOption: string | null;
  deliveryPrice: number | null;
  status: 'pending' | 'confirmed' | 'delivering' | 'delivered' | 'cancelled';
  notes: string | null;
  createdAt: string;
}

// ─── COUNTRIES ────────────────────────────────────────────────────────────────
export const countries: StoredCountry[] = [
  { id: 'uz', name: "O'zbekiston",   nameRu: "Узбекистан",    flag: '🇺🇿', dialCode: '+998', currency: 'UZS' },
  { id: 'kz', name: "Qozog'iston",   nameRu: "Казахстан",     flag: '🇰🇿', dialCode: '+7',   currency: 'KZT' },
  { id: 'kg', name: "Qirg'iziston",  nameRu: "Кыргызстан",    flag: '🇰🇬', dialCode: '+996', currency: 'KGS' },
  { id: 'tj', name: "Tojikiston",    nameRu: "Таджикистан",   flag: '🇹🇯', dialCode: '+992', currency: 'TJS' },
  { id: 'tm', name: "Turkmaniston",  nameRu: "Туркменистан",  flag: '🇹🇲', dialCode: '+993', currency: 'TMT' },
  { id: 'af', name: "Afg'oniston",   nameRu: "Афганистан",    flag: '🇦🇫', dialCode: '+93',  currency: 'AFN' },
  { id: 'ru', name: "Rossiya",       nameRu: "Россия",        flag: '🇷🇺', dialCode: '+7',   currency: 'RUB' },
  { id: 'cn', name: "Xitoy",         nameRu: "Китай",         flag: '🇨🇳', dialCode: '+86',  currency: 'CNY' },
  { id: 'ir', name: "Eron",          nameRu: "Иран",          flag: '🇮🇷', dialCode: '+98',  currency: 'IRR' },
];

// ─── REGIONS ──────────────────────────────────────────────────────────────────
export const regions: StoredRegion[] = [
  // ── O'zbekiston ─────────────────────────────────────────────────────────────
  { id: 'r1',  countryId: 'uz', name: "Toshkent shahri",    nameRu: "Ташкент (город)",        lat: 41.2995, lng: 69.2401 },
  { id: 'r2',  countryId: 'uz', name: "Toshkent viloyati",  nameRu: "Ташкентская область",    lat: 41.1145, lng: 69.2900 },
  { id: 'r3',  countryId: 'uz', name: "Andijon",            nameRu: "Андижанская",            lat: 40.7821, lng: 72.3442 },
  { id: 'r4',  countryId: 'uz', name: "Farg'ona",           nameRu: "Ферганская",             lat: 40.3834, lng: 71.7855 },
  { id: 'r5',  countryId: 'uz', name: "Namangan",           nameRu: "Наманганская",           lat: 41.0011, lng: 71.6683 },
  { id: 'r6',  countryId: 'uz', name: "Samarqand",          nameRu: "Самаркандская",          lat: 39.6542, lng: 66.9597 },
  { id: 'r7',  countryId: 'uz', name: "Buxoro",             nameRu: "Бухарская",              lat: 39.7681, lng: 64.4556 },
  { id: 'r8',  countryId: 'uz', name: "Navoiy",             nameRu: "Навоийская",             lat: 40.1000, lng: 65.3790 },
  { id: 'r9',  countryId: 'uz', name: "Qashqadaryo",        nameRu: "Кашкадарьинская",        lat: 38.8671, lng: 65.7917 },
  { id: 'r10', countryId: 'uz', name: "Surxondaryo",        nameRu: "Сурхандарьинская",       lat: 37.9402, lng: 67.5601 },
  { id: 'r11', countryId: 'uz', name: "Jizzax",             nameRu: "Джизакская",             lat: 40.1158, lng: 67.8422 },
  { id: 'r12', countryId: 'uz', name: "Sirdaryo",           nameRu: "Сырдарьинская",          lat: 40.8376, lng: 68.6632 },
  { id: 'r13', countryId: 'uz', name: "Xorazm",             nameRu: "Хорезмская",             lat: 41.5500, lng: 60.6167 },
  { id: 'r14', countryId: 'uz', name: "Qoraqalpog'iston",   nameRu: "Каракалпакстан",         lat: 43.7681, lng: 59.0400 },
  // ── Qozog'iston ─────────────────────────────────────────────────────────────
  { id: 'kz1', countryId: 'kz', name: "Almati",             nameRu: "Алматы",                 lat: 43.2220, lng: 76.8512 },
  { id: 'kz2', countryId: 'kz', name: "Astana",             nameRu: "Астана",                 lat: 51.1801, lng: 71.4460 },
  { id: 'kz3', countryId: 'kz', name: "Shymkent",           nameRu: "Шымкент",                lat: 42.3000, lng: 69.5900 },
  { id: 'kz4', countryId: 'kz', name: "Qaragandy",          nameRu: "Караганда",              lat: 49.8028, lng: 73.1094 },
  { id: 'kz5', countryId: 'kz', name: "Aktobe",             nameRu: "Актобе",                 lat: 50.2797, lng: 57.2073 },
  { id: 'kz6', countryId: 'kz', name: "Taraz",              nameRu: "Тараз",                  lat: 42.9000, lng: 71.3667 },
  { id: 'kz7', countryId: 'kz', name: "Pavlodar",           nameRu: "Павлодар",               lat: 52.2873, lng: 76.9674 },
  { id: 'kz8', countryId: 'kz', name: "O'skemen",           nameRu: "Усть-Каменогорск",       lat: 49.9500, lng: 82.6167 },
  { id: 'kz9', countryId: 'kz', name: "Atyrau",             nameRu: "Атырау",                 lat: 47.1164, lng: 51.9026 },
  { id: 'kz10',countryId: 'kz', name: "Qostanay",           nameRu: "Костанай",               lat: 53.2144, lng: 63.6245 },
  // ── Qirg'iziston ────────────────────────────────────────────────────────────
  { id: 'kg1', countryId: 'kg', name: "Bishkek",            nameRu: "Бишкек",                 lat: 42.8700, lng: 74.5900 },
  { id: 'kg2', countryId: 'kg', name: "O'sh",               nameRu: "Ош",                     lat: 40.5133, lng: 72.7985 },
  { id: 'kg3', countryId: 'kg', name: "Jalal-Obod",         nameRu: "Джалал-Абад",            lat: 40.9333, lng: 72.9833 },
  { id: 'kg4', countryId: 'kg', name: "Karakol",            nameRu: "Каракол",                lat: 42.4892, lng: 78.3937 },
  { id: 'kg5', countryId: 'kg', name: "Tokmok",             nameRu: "Токмок",                 lat: 42.8401, lng: 75.2907 },
  { id: 'kg6', countryId: 'kg', name: "Naryn",              nameRu: "Нарын",                  lat: 41.4286, lng: 76.0061 },
  { id: 'kg7', countryId: 'kg', name: "Batken",             nameRu: "Баткен",                 lat: 40.0643, lng: 70.8188 },
  // ── Tojikiston ──────────────────────────────────────────────────────────────
  { id: 'tj1', countryId: 'tj', name: "Dushanbe",           nameRu: "Душанбе",                lat: 38.5598, lng: 68.7739 },
  { id: 'tj2', countryId: 'tj', name: "Xo'jand",            nameRu: "Худжанд",                lat: 40.2825, lng: 69.6215 },
  { id: 'tj3', countryId: 'tj', name: "Kulob",              nameRu: "Куляб",                  lat: 37.9125, lng: 69.7798 },
  { id: 'tj4', countryId: 'tj', name: "Bokhtar",            nameRu: "Бохтар",                 lat: 37.8333, lng: 68.7833 },
  { id: 'tj5', countryId: 'tj', name: "Istaravshan",        nameRu: "Истаравшан",             lat: 39.9139, lng: 69.0025 },
  { id: 'tj6', countryId: 'tj', name: "Konibodom",          nameRu: "Канибадам",              lat: 40.2847, lng: 70.4281 },
  { id: 'tj7', countryId: 'tj', name: "Panjakent",          nameRu: "Пенджикент",             lat: 39.4942, lng: 67.6097 },
  // ── Turkmaniston ────────────────────────────────────────────────────────────
  { id: 'tm1', countryId: 'tm', name: "Ashxabad",           nameRu: "Ашхабад",                lat: 37.9601, lng: 58.3261 },
  { id: 'tm2', countryId: 'tm', name: "Turkmenabat",        nameRu: "Туркменабат",            lat: 39.0833, lng: 63.5667 },
  { id: 'tm3', countryId: 'tm', name: "Mary",               nameRu: "Мары",                   lat: 37.5933, lng: 61.8300 },
  { id: 'tm4', countryId: 'tm', name: "Balkanabat",         nameRu: "Балканабад",             lat: 39.5100, lng: 54.3700 },
  { id: 'tm5', countryId: 'tm', name: "Dashhoguz",          nameRu: "Дашогуз",                lat: 41.8369, lng: 59.9669 },
  { id: 'tm6', countryId: 'tm', name: "Türkmenbaşy",        nameRu: "Туркменбаши",            lat: 40.0181, lng: 52.9795 },
  // ── Afg'oniston ─────────────────────────────────────────────────────────────
  { id: 'af1', countryId: 'af', name: "Kobul",              nameRu: "Кабул",                  lat: 34.5280, lng: 69.1724 },
  { id: 'af2', countryId: 'af', name: "Hirot",              nameRu: "Герат",                  lat: 34.3482, lng: 62.2040 },
  { id: 'af3', countryId: 'af', name: "Mozori Sharif",      nameRu: "Мазари-Шариф",           lat: 36.7069, lng: 67.1115 },
  { id: 'af4', countryId: 'af', name: "Qandahor",           nameRu: "Кандагар",               lat: 31.6131, lng: 65.7100 },
  { id: 'af5', countryId: 'af', name: "Jalalabad",          nameRu: "Джалалабад",             lat: 34.4211, lng: 70.4514 },
  { id: 'af6', countryId: 'af', name: "Kunduz",             nameRu: "Кундуз",                 lat: 36.7281, lng: 68.8670 },
  { id: 'af7', countryId: 'af', name: "G'azna",             nameRu: "Газни",                  lat: 33.5500, lng: 68.4167 },
  // ── Rossiya ─────────────────────────────────────────────────────────────────
  { id: 'ru1', countryId: 'ru', name: "Moskva",             nameRu: "Москва",                 lat: 55.7558, lng: 37.6173 },
  { id: 'ru2', countryId: 'ru', name: "Sankt-Peterburg",    nameRu: "Санкт-Петербург",        lat: 59.9343, lng: 30.3351 },
  { id: 'ru3', countryId: 'ru', name: "Novosibirsk",        nameRu: "Новосибирск",            lat: 54.9833, lng: 82.8964 },
  { id: 'ru4', countryId: 'ru', name: "Yekaterinburg",      nameRu: "Екатеринбург",           lat: 56.8356, lng: 60.6128 },
  { id: 'ru5', countryId: 'ru', name: "Kazan",              nameRu: "Казань",                 lat: 55.7887, lng: 49.1221 },
  { id: 'ru6', countryId: 'ru', name: "Omsk",               nameRu: "Омск",                   lat: 54.9924, lng: 73.3686 },
  { id: 'ru7', countryId: 'ru', name: "Chelyabinsk",        nameRu: "Челябинск",              lat: 55.1644, lng: 61.4368 },
  { id: 'ru8', countryId: 'ru', name: "Ufa",                nameRu: "Уфа",                    lat: 54.7388, lng: 55.9721 },
  { id: 'ru9', countryId: 'ru', name: "Krasnodar",          nameRu: "Краснодар",              lat: 45.0328, lng: 38.9769 },
  { id: 'ru10',countryId: 'ru', name: "Saratov",            nameRu: "Саратов",                lat: 51.5924, lng: 46.0267 },
  // ── Xitoy ───────────────────────────────────────────────────────────────────
  { id: 'cn1', countryId: 'cn', name: "Pekin",              nameRu: "Пекин",                  lat: 39.9042, lng: 116.4074 },
  { id: 'cn2', countryId: 'cn', name: "Shanxay",            nameRu: "Шанхай",                 lat: 31.2304, lng: 121.4737 },
  { id: 'cn3', countryId: 'cn', name: "Urumqi (Sinszyan)",  nameRu: "Урумчи (Синьцзян)",      lat: 43.8225, lng: 87.6125 },
  { id: 'cn4', countryId: 'cn', name: "Guangzhou",          nameRu: "Гуанчжоу",              lat: 23.1291, lng: 113.2644 },
  { id: 'cn5', countryId: 'cn', name: "Chengdu",            nameRu: "Чэнду",                  lat: 30.5728, lng: 104.0668 },
  { id: 'cn6', countryId: 'cn', name: "Si'an",              nameRu: "Сиань",                  lat: 34.2658, lng: 108.9541 },
  { id: 'cn7', countryId: 'cn', name: "Wuhan",              nameRu: "Ухань",                  lat: 30.5928, lng: 114.3055 },
  // ── Eron ────────────────────────────────────────────────────────────────────
  { id: 'ir1',  countryId: 'ir', name: "Tehron",           nameRu: "Тегеран",                lat: 35.6892, lng: 51.3890 },
  { id: 'ir2',  countryId: 'ir', name: "Mashhad",          nameRu: "Мешхед",                 lat: 36.2605, lng: 59.6168 },
  { id: 'ir3',  countryId: 'ir', name: "Isfahon",          nameRu: "Исфахан",                lat: 32.6546, lng: 51.6680 },
  { id: 'ir4',  countryId: 'ir', name: "Tabriz",           nameRu: "Тебриз",                 lat: 38.0962, lng: 46.2738 },
  { id: 'ir5',  countryId: 'ir', name: "Karaj",            nameRu: "Карадж",                 lat: 35.8400, lng: 50.9391 },
  { id: 'ir6',  countryId: 'ir', name: "Sheroz",           nameRu: "Шираз",                  lat: 29.5918, lng: 52.5837 },
  { id: 'ir7',  countryId: 'ir', name: "Ahvoz",            nameRu: "Ахваз",                  lat: 31.3183, lng: 48.6706 },
  { id: 'ir8',  countryId: 'ir', name: "Qum",              nameRu: "Кум",                    lat: 34.6401, lng: 50.8764 },
  { id: 'ir9',  countryId: 'ir', name: "Kirmonshoh",       nameRu: "Керманшах",              lat: 34.3277, lng: 47.0780 },
  { id: 'ir10', countryId: 'ir', name: "Urmiya",           nameRu: "Урмия",                  lat: 37.5527, lng: 45.0760 },
];

// ─── DISTRICTS ────────────────────────────────────────────────────────────────
export const districts: StoredDistrict[] = [
  // ── Toshkent shahri (11 tuman) ──────────────────────────────────────────────
  { id: 'd1',   name: "Yunusobod",       nameRu: "Юнусабад",        regionId: 'r1', lat: 41.3337, lng: 69.2795 },
  { id: 'd2',   name: "Chilonzor",       nameRu: "Чиланзар",        regionId: 'r1', lat: 41.2794, lng: 69.2014 },
  { id: 'd3',   name: "Yakkasaroy",      nameRu: "Яккасарай",       regionId: 'r1', lat: 41.2930, lng: 69.2581 },
  { id: 'd4',   name: "Mirzo Ulug'bek",  nameRu: "Мирзо-Улугбек",  regionId: 'r1', lat: 41.3200, lng: 69.3100 },
  { id: 'd5',   name: "Uchtepa",         nameRu: "Учтепа",          regionId: 'r1', lat: 41.3050, lng: 69.2100 },
  { id: 'd101', name: "Bektemir",        nameRu: "Бектемир",        regionId: 'r1', lat: 41.2400, lng: 69.3400 },
  { id: 'd102', name: "Mirobod",         nameRu: "Мирабад",         regionId: 'r1', lat: 41.2950, lng: 69.2700 },
  { id: 'd103', name: "Olmazar",         nameRu: "Алмазар",         regionId: 'r1', lat: 41.3500, lng: 69.2300 },
  { id: 'd104', name: "Sergeli",         nameRu: "Сергели",         regionId: 'r1', lat: 41.2200, lng: 69.2600 },
  { id: 'd105', name: "Shayxontohur",    nameRu: "Шайхантахур",     regionId: 'r1', lat: 41.3100, lng: 69.2500 },
  { id: 'd106', name: "Yashnobod",       nameRu: "Яшнабад",         regionId: 'r1', lat: 41.2600, lng: 69.2900 },

  // ── Toshkent viloyati (15 tuman) ────────────────────────────────────────────
  { id: 'd6',   name: "Chirchiq",        nameRu: "Чирчик",          regionId: 'r2', lat: 41.4700, lng: 69.5800 },
  { id: 'd7',   name: "Angren",          nameRu: "Ангрен",          regionId: 'r2', lat: 41.0130, lng: 70.1440 },
  { id: 'd8',   name: "Almaliq",         nameRu: "Алмалык",         regionId: 'r2', lat: 40.8523, lng: 69.6057 },
  { id: 'd9',   name: "Bekabad",         nameRu: "Бекабад",         regionId: 'r2', lat: 40.2200, lng: 69.2300 },
  { id: 'd10',  name: "Yangiyo'l",       nameRu: "Янгиюль",         regionId: 'r2', lat: 41.1100, lng: 69.0400 },
  { id: 'd107', name: "Bo'stonliq",      nameRu: "Бостанлыкский",   regionId: 'r2', lat: 41.7800, lng: 70.0100 },
  { id: 'd108', name: "Bo'ka",           nameRu: "Букинский",       regionId: 'r2', lat: 41.0500, lng: 69.1800 },
  { id: 'd109', name: "Chinoz",          nameRu: "Чиназский",       regionId: 'r2', lat: 40.9400, lng: 68.7700 },
  { id: 'd110', name: "Qibray",          nameRu: "Кибрайский",      regionId: 'r2', lat: 41.4000, lng: 69.4000 },
  { id: 'd111', name: "O'rtachirchiq",   nameRu: "Уртачирчикский",  regionId: 'r2', lat: 41.2800, lng: 69.6500 },
  { id: 'd112', name: "Ohangaron",       nameRu: "Ахангаранский",   regionId: 'r2', lat: 40.9100, lng: 69.6300 },
  { id: 'd113', name: "Parkent",         nameRu: "Паркентский",     regionId: 'r2', lat: 41.2900, lng: 69.6800 },
  { id: 'd114', name: "Piskent",         nameRu: "Пскентский",      regionId: 'r2', lat: 41.0000, lng: 69.3700 },
  { id: 'd115', name: "Quyi Chirchiq",   nameRu: "Нижнечирчикский", regionId: 'r2', lat: 41.1700, lng: 69.3500 },
  { id: 'd116', name: "Zangiota",        nameRu: "Зангиатинский",   regionId: 'r2', lat: 41.2300, lng: 69.1600 },

  // ── Andijon viloyati (14 tuman) ─────────────────────────────────────────────
  { id: 'd11',  name: "Andijon shahar",  nameRu: "Андижан (город)", regionId: 'r3', lat: 40.7821, lng: 72.3442 },
  { id: 'd12',  name: "Asaka",           nameRu: "Асака",           regionId: 'r3', lat: 40.6430, lng: 72.2360 },
  { id: 'd13',  name: "Xo'jaobod",       nameRu: "Ходжаабад",       regionId: 'r3', lat: 40.9300, lng: 72.5500 },
  { id: 'd14',  name: "Baliqchi",        nameRu: "Балыкчи",         regionId: 'r3', lat: 40.5800, lng: 72.0100 },
  { id: 'd117', name: "Bo'z",            nameRu: "Буз",             regionId: 'r3', lat: 40.6600, lng: 72.4800 },
  { id: 'd118', name: "Buloqboshi",      nameRu: "Булакбаши",       regionId: 'r3', lat: 40.5100, lng: 72.3600 },
  { id: 'd119', name: "Izboskan",        nameRu: "Избасканский",    regionId: 'r3', lat: 40.7400, lng: 72.2200 },
  { id: 'd120', name: "Jalaquduq",       nameRu: "Джалакудук",      regionId: 'r3', lat: 40.9700, lng: 72.4300 },
  { id: 'd121', name: "Marhamat",        nameRu: "Мархамат",        regionId: 'r3', lat: 40.5100, lng: 72.2900 },
  { id: 'd122', name: "Oltinkol",        nameRu: "Алтынкуль",       regionId: 'r3', lat: 40.6800, lng: 72.5300 },
  { id: 'd123', name: "Paxtaobod",       nameRu: "Пахтаабад",       regionId: 'r3', lat: 40.5500, lng: 72.5800 },
  { id: 'd124', name: "Shahrixon",       nameRu: "Шахриханский",    regionId: 'r3', lat: 40.7100, lng: 72.0500 },
  { id: 'd125', name: "Ulug'nor",        nameRu: "Улугнор",         regionId: 'r3', lat: 41.0300, lng: 72.3400 },

  // ── Farg'ona viloyati (15 tuman) ────────────────────────────────────────────
  { id: 'd15',  name: "Farg'ona shahar", nameRu: "Фергана (город)", regionId: 'r4', lat: 40.3834, lng: 71.7855 },
  { id: 'd16',  name: "Marg'ilon",       nameRu: "Маргилан",        regionId: 'r4', lat: 40.4700, lng: 71.7300 },
  { id: 'd17',  name: "Qo'qon",          nameRu: "Коканд",          regionId: 'r4', lat: 40.5280, lng: 70.9430 },
  { id: 'd18',  name: "Quva",            nameRu: "Кува",            regionId: 'r4', lat: 40.5200, lng: 72.0700 },
  { id: 'd126', name: "Beshariq",        nameRu: "Бешарык",         regionId: 'r4', lat: 40.4300, lng: 70.6100 },
  { id: 'd127', name: "Bog'dod",         nameRu: "Богдад",          regionId: 'r4', lat: 40.1800, lng: 71.4700 },
  { id: 'd128', name: "Buvayda",         nameRu: "Бувайда",         regionId: 'r4', lat: 40.3200, lng: 71.3500 },
  { id: 'd129', name: "Dang'ara",        nameRu: "Дангара",         regionId: 'r4', lat: 40.1300, lng: 71.3200 },
  { id: 'd130', name: "Furqat",          nameRu: "Фуркат",          regionId: 'r4', lat: 40.4600, lng: 71.4200 },
  { id: 'd131', name: "Qo'shtepa",       nameRu: "Куштепа",         regionId: 'r4', lat: 40.4900, lng: 71.5500 },
  { id: 'd132', name: "Oltiariq",        nameRu: "Алтыарык",        regionId: 'r4', lat: 40.3800, lng: 71.5100 },
  { id: 'd133', name: "Rishton",         nameRu: "Риштан",          regionId: 'r4', lat: 40.3600, lng: 71.2800 },
  { id: 'd134', name: "So'x",            nameRu: "Сох",             regionId: 'r4', lat: 39.9700, lng: 71.1300 },
  { id: 'd135', name: "Toshloq",         nameRu: "Ташлак",          regionId: 'r4', lat: 40.2500, lng: 71.7100 },
  { id: 'd136', name: "Uchko'prik",      nameRu: "Учкупрык",        regionId: 'r4', lat: 40.4100, lng: 71.7800 },
  { id: 'd137', name: "Yozyovon",        nameRu: "Язъяван",         regionId: 'r4', lat: 40.2000, lng: 71.9900 },

  // ── Namangan viloyati (11 tuman) ────────────────────────────────────────────
  { id: 'd19',  name: "Namangan shahar", nameRu: "Наманган (город)", regionId: 'r5', lat: 41.0011, lng: 71.6683 },
  { id: 'd20',  name: "Kosonsoy",        nameRu: "Касансай",         regionId: 'r5', lat: 41.2200, lng: 71.5300 },
  { id: 'd21',  name: "Uchqo'rg'on",     nameRu: "Учкурган",         regionId: 'r5', lat: 41.1100, lng: 72.0800 },
  { id: 'd138', name: "Chortoq",         nameRu: "Чартак",           regionId: 'r5', lat: 41.0800, lng: 71.8400 },
  { id: 'd139', name: "Chust",           nameRu: "Чует",             regionId: 'r5', lat: 40.9900, lng: 71.7300 },
  { id: 'd140', name: "Mingbuloq",       nameRu: "Мингбулак",        regionId: 'r5', lat: 40.8600, lng: 71.7000 },
  { id: 'd141', name: "Norin",           nameRu: "Нарын",            regionId: 'r5', lat: 41.2800, lng: 71.3900 },
  { id: 'd142', name: "Pop",             nameRu: "Поп",              regionId: 'r5', lat: 41.1900, lng: 71.1100 },
  { id: 'd143', name: "To'raqo'rg'on",   nameRu: "Туракурган",       regionId: 'r5', lat: 41.0100, lng: 71.5200 },
  { id: 'd144', name: "Uychi",           nameRu: "Уйчи",             regionId: 'r5', lat: 41.0900, lng: 71.4100 },
  { id: 'd145', name: "Yangiqo'rg'on",   nameRu: "Янгикурган",       regionId: 'r5', lat: 40.9700, lng: 71.7800 },

  // ── Samarqand viloyati (14 tuman) ───────────────────────────────────────────
  { id: 'd22',  name: "Samarqand shahar",nameRu: "Самарканд (город)",regionId: 'r6', lat: 39.6542, lng: 66.9597 },
  { id: 'd23',  name: "Kattaqo'rg'on",   nameRu: "Каттакурган",      regionId: 'r6', lat: 39.9000, lng: 66.2600 },
  { id: 'd24',  name: "Ishtixon",        nameRu: "Иштихан",          regionId: 'r6', lat: 39.9800, lng: 66.4800 },
  { id: 'd146', name: "Bulung'ur",       nameRu: "Булунгур",         regionId: 'r6', lat: 39.7700, lng: 67.2700 },
  { id: 'd147', name: "Jomboy",          nameRu: "Джамбай",          regionId: 'r6', lat: 39.7100, lng: 67.0500 },
  { id: 'd148', name: "Narpay",          nameRu: "Нарпай",           regionId: 'r6', lat: 39.9900, lng: 66.7200 },
  { id: 'd149', name: "Nurobod",         nameRu: "Нурабад",          regionId: 'r6', lat: 39.4800, lng: 67.5500 },
  { id: 'd150', name: "Oqdaryo",         nameRu: "Акдарья",          regionId: 'r6', lat: 40.0500, lng: 66.6000 },
  { id: 'd151', name: "Payariq",         nameRu: "Пайарык",          regionId: 'r6', lat: 39.8300, lng: 67.2200 },
  { id: 'd152', name: "Pastdarg'om",     nameRu: "Пастдаргомский",   regionId: 'r6', lat: 39.5700, lng: 66.7900 },
  { id: 'd153', name: "Paxtachi",        nameRu: "Пахтачи",          regionId: 'r6', lat: 39.8600, lng: 66.9800 },
  { id: 'd154', name: "Toyloq",          nameRu: "Тайлак",           regionId: 'r6', lat: 39.4400, lng: 66.7200 },
  { id: 'd155', name: "Urgut",           nameRu: "Ургут",            regionId: 'r6', lat: 39.4100, lng: 67.2600 },
  { id: 'd156', name: "Qo'shrabot",      nameRu: "Кушрабат",         regionId: 'r6', lat: 40.1200, lng: 66.9700 },

  // ── Buxoro viloyati (11 tuman) ──────────────────────────────────────────────
  { id: 'd25',  name: "Buxoro shahar",   nameRu: "Бухара (город)",   regionId: 'r7', lat: 39.7681, lng: 64.4556 },
  { id: 'd26',  name: "G'ijduvon",       nameRu: "Гиждуван",         regionId: 'r7', lat: 40.1000, lng: 64.6800 },
  { id: 'd27',  name: "Kogon",           nameRu: "Каган",            regionId: 'r7', lat: 39.7300, lng: 64.5500 },
  { id: 'd157', name: "Jondor",          nameRu: "Жондор",           regionId: 'r7', lat: 39.9500, lng: 64.3900 },
  { id: 'd158', name: "Qorovulbozor",    nameRu: "Каравулбазар",     regionId: 'r7', lat: 39.4800, lng: 64.8700 },
  { id: 'd159', name: "Olot",            nameRu: "Алат",             regionId: 'r7', lat: 38.9900, lng: 63.6700 },
  { id: 'd160', name: "Peshku",          nameRu: "Пешку",            regionId: 'r7', lat: 40.0300, lng: 64.6200 },
  { id: 'd161', name: "Romitan",         nameRu: "Ромитан",          regionId: 'r7', lat: 39.9200, lng: 64.3700 },
  { id: 'd162', name: "Shofirkon",       nameRu: "Шафиркан",         regionId: 'r7', lat: 40.1200, lng: 64.5000 },
  { id: 'd163', name: "Vobkent",         nameRu: "Вабкент",          regionId: 'r7', lat: 40.0300, lng: 64.5200 },
  { id: 'd164', name: "Qorako'l",        nameRu: "Каракуль",         regionId: 'r7', lat: 39.5300, lng: 63.8500 },

  // ── Navoiy viloyati (8 tuman) ───────────────────────────────────────────────
  { id: 'd28',  name: "Navoiy shahar",   nameRu: "Навои (город)",    regionId: 'r8', lat: 40.1000, lng: 65.3790 },
  { id: 'd29',  name: "Zarafshon",       nameRu: "Зарафшан",         regionId: 'r8', lat: 41.5700, lng: 64.2000 },
  { id: 'd165', name: "Karmana",         nameRu: "Карманинский",     regionId: 'r8', lat: 40.1400, lng: 65.3600 },
  { id: 'd166', name: "Konimex",         nameRu: "Кон-и-Мех",       regionId: 'r8', lat: 40.4800, lng: 63.4800 },
  { id: 'd167', name: "Navbahor",        nameRu: "Навбахор",         regionId: 'r8', lat: 40.0600, lng: 65.1200 },
  { id: 'd168', name: "Nurota",          nameRu: "Нуратинский",      regionId: 'r8', lat: 40.5700, lng: 65.6900 },
  { id: 'd169', name: "Qiziltepa",       nameRu: "Кызылтепинский",   regionId: 'r8', lat: 40.2800, lng: 65.8500 },
  { id: 'd170', name: "Xatirchi",        nameRu: "Хатырчинский",     regionId: 'r8', lat: 40.0200, lng: 66.0400 },

  // ── Qashqadaryo viloyati (13 tuman) ─────────────────────────────────────────
  { id: 'd30',  name: "Qarshi shahar",   nameRu: "Карши (город)",    regionId: 'r9', lat: 38.8671, lng: 65.7917 },
  { id: 'd31',  name: "Shahrisabz",      nameRu: "Шахрисабз",        regionId: 'r9', lat: 39.0590, lng: 66.8350 },
  { id: 'd171', name: "Chiroqchi",       nameRu: "Чиракчи",          regionId: 'r9', lat: 39.0400, lng: 66.5700 },
  { id: 'd172', name: "Dehqonobod",      nameRu: "Дехканабад",       regionId: 'r9', lat: 38.4800, lng: 66.5100 },
  { id: 'd173', name: "G'uzor",          nameRu: "Гузар",            regionId: 'r9', lat: 38.6200, lng: 66.2500 },
  { id: 'd174', name: "Kasbi",           nameRu: "Касби",            regionId: 'r9', lat: 38.7000, lng: 66.0700 },
  { id: 'd175', name: "Kitob",           nameRu: "Китаб",            regionId: 'r9', lat: 39.1400, lng: 66.8900 },
  { id: 'd176', name: "Koson",           nameRu: "Косон",            regionId: 'r9', lat: 38.5600, lng: 65.5700 },
  { id: 'd177', name: "Mirishkor",       nameRu: "Миришкор",         regionId: 'r9', lat: 38.8600, lng: 65.4500 },
  { id: 'd178', name: "Muborak",         nameRu: "Мубарек",          regionId: 'r9', lat: 39.2600, lng: 65.2200 },
  { id: 'd179', name: "Nishon",          nameRu: "Нишан",            regionId: 'r9', lat: 38.8900, lng: 65.3500 },
  { id: 'd180', name: "Yakkabog'",       nameRu: "Яккабаг",          regionId: 'r9', lat: 38.9400, lng: 66.7600 },
  { id: 'd181', name: "Qamashi",         nameRu: "Камаши",           regionId: 'r9', lat: 38.8900, lng: 66.7000 },

  // ── Surxondaryo viloyati (14 tuman) ─────────────────────────────────────────
  { id: 'd32',  name: "Termiz shahar",   nameRu: "Термез (город)",   regionId: 'r10', lat: 37.2244, lng: 67.2783 },
  { id: 'd33',  name: "Denov",           nameRu: "Денау",            regionId: 'r10', lat: 38.2700, lng: 67.8900 },
  { id: 'd182', name: "Angor",           nameRu: "Ангор",            regionId: 'r10', lat: 37.5700, lng: 67.1200 },
  { id: 'd183', name: "Bandixon",        nameRu: "Бандихан",         regionId: 'r10', lat: 37.9800, lng: 68.0200 },
  { id: 'd184', name: "Boysun",          nameRu: "Байсун",           regionId: 'r10', lat: 38.2100, lng: 67.1900 },
  { id: 'd185', name: "Jarqo'rg'on",     nameRu: "Джаркурган",       regionId: 'r10', lat: 37.5200, lng: 67.4400 },
  { id: 'd186', name: "Muzrabot",        nameRu: "Музрабат",         regionId: 'r10', lat: 37.4400, lng: 67.5500 },
  { id: 'd187', name: "Oltinsoy",        nameRu: "Алтынсайский",     regionId: 'r10', lat: 38.4200, lng: 67.5100 },
  { id: 'd188', name: "Qiziriq",         nameRu: "Кизирик",          regionId: 'r10', lat: 37.4700, lng: 67.7100 },
  { id: 'd189', name: "Qumqo'rg'on",     nameRu: "Кумкурган",        regionId: 'r10', lat: 37.8500, lng: 67.5800 },
  { id: 'd190', name: "Sariosiyo",       nameRu: "Сариасия",         regionId: 'r10', lat: 38.4400, lng: 68.0300 },
  { id: 'd191', name: "Sherobod",        nameRu: "Шерабад",          regionId: 'r10', lat: 37.6500, lng: 67.0000 },
  { id: 'd192', name: "Sherg'oz",        nameRu: "Шергаз",           regionId: 'r10', lat: 37.7400, lng: 67.8400 },
  { id: 'd193', name: "Uzun",            nameRu: "Узун",             regionId: 'r10', lat: 37.8700, lng: 67.7000 },

  // ── Jizzax viloyati (12 tuman) ──────────────────────────────────────────────
  { id: 'd34',  name: "Jizzax shahar",   nameRu: "Джизак (город)",   regionId: 'r11', lat: 40.1158, lng: 67.8422 },
  { id: 'd35',  name: "G'allaorol",      nameRu: "Галляарал",        regionId: 'r11', lat: 40.0300, lng: 68.8300 },
  { id: 'd194', name: "Arnasoy",         nameRu: "Арнасай",          regionId: 'r11', lat: 40.5300, lng: 67.8500 },
  { id: 'd195', name: "Baxmal",          nameRu: "Бахмал",           regionId: 'r11', lat: 40.2000, lng: 68.0500 },
  { id: 'd196', name: "Do'stlik",        nameRu: "Дустлик",          regionId: 'r11', lat: 40.5400, lng: 68.0100 },
  { id: 'd197', name: "Forish",          nameRu: "Фариш",            regionId: 'r11', lat: 39.8600, lng: 67.9500 },
  { id: 'd198', name: "Mirzacho'l",      nameRu: "Мирзачуль",        regionId: 'r11', lat: 40.5200, lng: 68.4600 },
  { id: 'd199', name: "Paxtakor",        nameRu: "Пахтакор",         regionId: 'r11', lat: 40.3100, lng: 67.9700 },
  { id: 'd200', name: "Yangiobod",       nameRu: "Янгиабад",         regionId: 'r11', lat: 40.7700, lng: 68.8700 },
  { id: 'd201', name: "Zafarobod",       nameRu: "Зафарабад",        regionId: 'r11', lat: 40.7400, lng: 67.6000 },
  { id: 'd202', name: "Zomin",           nameRu: "Зомин",            regionId: 'r11', lat: 39.9600, lng: 68.4000 },
  { id: 'd203', name: "Sh.Rashidov",     nameRu: "Ш.Рашидов тумани", regionId: 'r11', lat: 40.4500, lng: 68.1900 },

  // ── Sirdaryo viloyati (9 tuman) ─────────────────────────────────────────────
  { id: 'd36',  name: "Guliston shahar", nameRu: "Гулистан (город)", regionId: 'r12', lat: 40.4900, lng: 68.7800 },
  { id: 'd37',  name: "Yangiyer",        nameRu: "Янгиер",           regionId: 'r12', lat: 40.2900, lng: 68.8300 },
  { id: 'd204', name: "Akaltyn",         nameRu: "Акалтын",          regionId: 'r12', lat: 40.6800, lng: 68.4000 },
  { id: 'd205', name: "Boyovut",         nameRu: "Баяут",            regionId: 'r12', lat: 40.3100, lng: 67.9700 },
  { id: 'd206', name: "Mirzaobod",       nameRu: "Мирзаабад",        regionId: 'r12', lat: 40.4300, lng: 68.7000 },
  { id: 'd207', name: "Oqoltin",         nameRu: "Акалтын",          regionId: 'r12', lat: 40.5900, lng: 68.5800 },
  { id: 'd208', name: "Sardoba",         nameRu: "Сардоба",          regionId: 'r12', lat: 40.6500, lng: 67.9500 },
  { id: 'd209', name: "Sayxunobod",      nameRu: "Сайхунабад",       regionId: 'r12', lat: 40.3900, lng: 68.3700 },
  { id: 'd210', name: "Xovos",           nameRu: "Хавас",            regionId: 'r12', lat: 40.7800, lng: 68.6100 },

  // ── Xorazm viloyati (11 tuman) ──────────────────────────────────────────────
  { id: 'd38',  name: "Urganch shahar",  nameRu: "Ургенч (город)",   regionId: 'r13', lat: 41.5500, lng: 60.6167 },
  { id: 'd39',  name: "Xiva",            nameRu: "Хива",             regionId: 'r13', lat: 41.3780, lng: 60.3630 },
  { id: 'd211', name: "Bog'ot",          nameRu: "Багат",            regionId: 'r13', lat: 41.4400, lng: 61.0200 },
  { id: 'd212', name: "Gurlan",          nameRu: "Гурлен",           regionId: 'r13', lat: 41.8600, lng: 60.3700 },
  { id: 'd213', name: "Xonqa",           nameRu: "Ханка",            regionId: 'r13', lat: 41.1600, lng: 60.6300 },
  { id: 'd214', name: "Qo'shko'pir",     nameRu: "Кушкупыр",         regionId: 'r13', lat: 41.5900, lng: 60.2400 },
  { id: 'd215', name: "Shovot",          nameRu: "Шават",            regionId: 'r13', lat: 41.6400, lng: 60.5700 },
  { id: 'd216', name: "Tuproqqal'a",     nameRu: "Топраккала",       regionId: 'r13', lat: 42.0100, lng: 60.3200 },
  { id: 'd217', name: "Yangiariq",       nameRu: "Янгиарык",         regionId: 'r13', lat: 41.4600, lng: 60.5700 },
  { id: 'd218', name: "Yangibozor",      nameRu: "Янгибазар",        regionId: 'r13', lat: 41.3800, lng: 60.7200 },
  { id: 'd219', name: "Hazorasp",        nameRu: "Хазарасп",         regionId: 'r13', lat: 41.2800, lng: 61.0700 },

  // ── Qoraqalpog'iston (15 tuman) ─────────────────────────────────────────────
  { id: 'd40',  name: "No'kis shahar",   nameRu: "Нукус (город)",    regionId: 'r14', lat: 42.4603, lng: 59.6166 },
  { id: 'd41',  name: "Taxtako'pir",     nameRu: "Тахтакупыр",       regionId: 'r14', lat: 42.8000, lng: 60.1900 },
  { id: 'd220', name: "Amudaryo",        nameRu: "Амударья",         regionId: 'r14', lat: 41.1500, lng: 60.3800 },
  { id: 'd221', name: "Beruniy",         nameRu: "Беруний",          regionId: 'r14', lat: 41.6900, lng: 60.7500 },
  { id: 'd222', name: "Chimboy",         nameRu: "Чимбай",           regionId: 'r14', lat: 42.9500, lng: 59.7800 },
  { id: 'd223', name: "Ellikqal'a",      nameRu: "Элликкала",        regionId: 'r14', lat: 41.8100, lng: 60.6800 },
  { id: 'd224', name: "Kegeyli",         nameRu: "Кегейли",          regionId: 'r14', lat: 42.7700, lng: 59.5800 },
  { id: 'd225', name: "Mo'ynoq",         nameRu: "Муйнак",           regionId: 'r14', lat: 43.7700, lng: 59.0300 },
  { id: 'd226', name: "Qanliko'l",       nameRu: "Канлыкуль",        regionId: 'r14', lat: 43.0000, lng: 59.0100 },
  { id: 'd227', name: "Qo'ng'irot",      nameRu: "Кунград",          regionId: 'r14', lat: 43.0800, lng: 58.9000 },
  { id: 'd228', name: "Qorao'zak",       nameRu: "Караузяк",         regionId: 'r14', lat: 43.5600, lng: 59.9800 },
  { id: 'd229', name: "Shumanay",        nameRu: "Шуманай",          regionId: 'r14', lat: 43.0700, lng: 59.4200 },
  { id: 'd230', name: "To'rtko'l",       nameRu: "Турткуль",         regionId: 'r14', lat: 41.5600, lng: 61.0100 },
  { id: 'd231', name: "Xo'jayli",        nameRu: "Ходжейли",         regionId: 'r14', lat: 42.3500, lng: 59.4600 },
  { id: 'd232', name: "Bo'zatov",        nameRu: "Бозатау",          regionId: 'r14', lat: 43.2500, lng: 59.7000 },

  // ════════════════════════════════════════════════════════════════════════════
  //  CHET EL TUMANLARI
  // ════════════════════════════════════════════════════════════════════════════

  // ── Qozog'iston ─────────────────────────────────────────────────────────────
  // Almati
  { id: 'kz1_1',  name: "Alatau tumani",          nameRu: "Алатауский район",          regionId: 'kz1',  lat: 43.1700, lng: 76.7800 },
  { id: 'kz1_2',  name: "Almaly tumani",           nameRu: "Алмалинский район",         regionId: 'kz1',  lat: 43.2600, lng: 76.9200 },
  { id: 'kz1_3',  name: "Auezov tumani",           nameRu: "Ауэзовский район",          regionId: 'kz1',  lat: 43.2100, lng: 76.8300 },
  { id: 'kz1_4',  name: "Bostandyq tumani",        nameRu: "Бостандыкский район",       regionId: 'kz1',  lat: 43.2400, lng: 76.8700 },
  { id: 'kz1_5',  name: "Jambyl tumani",           nameRu: "Жамбылский район",          regionId: 'kz1',  lat: 43.2800, lng: 76.8100 },
  { id: 'kz1_6',  name: "Medeu tumani",            nameRu: "Медеуский район",           regionId: 'kz1',  lat: 43.2100, lng: 76.9300 },
  { id: 'kz1_7',  name: "Nauryzbay tumani",        nameRu: "Наурызбайский район",       regionId: 'kz1',  lat: 43.2000, lng: 76.7500 },
  { id: 'kz1_8',  name: "Turksib tumani",          nameRu: "Түрксіб районы",            regionId: 'kz1',  lat: 43.3100, lng: 77.0000 },
  // Astana
  { id: 'kz2_1',  name: "Almaty tumani",           nameRu: "Алматинский район",         regionId: 'kz2',  lat: 51.1600, lng: 71.3800 },
  { id: 'kz2_2',  name: "Baikonur tumani",         nameRu: "Байконур районы",           regionId: 'kz2',  lat: 51.1500, lng: 71.4000 },
  { id: 'kz2_3',  name: "Esil tumani",             nameRu: "Есильский район",           regionId: 'kz2',  lat: 51.1900, lng: 71.4600 },
  { id: 'kz2_4',  name: "Nura tumani",             nameRu: "Нура районы",               regionId: 'kz2',  lat: 51.1700, lng: 71.3600 },
  { id: 'kz2_5',  name: "Saryarka tumani",         nameRu: "Сарыарка районы",           regionId: 'kz2',  lat: 51.2200, lng: 71.5100 },
  // Shymkent
  { id: 'kz3_1',  name: "Abay tumani",             nameRu: "Абайский район",            regionId: 'kz3',  lat: 42.3100, lng: 69.5500 },
  { id: 'kz3_2',  name: "Al-Farobiy tumani",       nameRu: "Аль-Фарабийский район",     regionId: 'kz3',  lat: 42.2900, lng: 69.6100 },
  { id: 'kz3_3',  name: "Qaratau tumani",          nameRu: "Каратауский район",         regionId: 'kz3',  lat: 42.3200, lng: 69.5800 },
  { id: 'kz3_4',  name: "Yenbekshy tumani",        nameRu: "Енбекшинский район",        regionId: 'kz3',  lat: 42.2800, lng: 69.5700 },
  // Qolgan KZ shaharlar
  { id: 'kz4_1',  name: "Qaragandy markazi",       nameRu: "Центр Карагандинский",      regionId: 'kz4',  lat: 49.8000, lng: 73.1100 },
  { id: 'kz4_2',  name: "Qaragandy Kazıbek biy",  nameRu: "Казыбек би район",          regionId: 'kz4',  lat: 49.8200, lng: 73.0900 },
  { id: 'kz4_3',  name: "Qaragandy Oktobr",        nameRu: "Октябрьский район",         regionId: 'kz4',  lat: 49.7800, lng: 73.1300 },
  { id: 'kz5_1',  name: "Aktobe markazi",          nameRu: "Центр Актобе",              regionId: 'kz5',  lat: 50.2800, lng: 57.2100 },
  { id: 'kz5_2',  name: "Aktobe Nurjol tumani",    nameRu: "Нурлы жол район",           regionId: 'kz5',  lat: 50.2700, lng: 57.2300 },
  { id: 'kz6_1',  name: "Taraz markazi",           nameRu: "Центр Тараза",              regionId: 'kz6',  lat: 42.9000, lng: 71.3700 },
  { id: 'kz6_2',  name: "Taraz Baydibek tumani",   nameRu: "Байдибек район",            regionId: 'kz6',  lat: 42.9100, lng: 71.3500 },
  { id: 'kz7_1',  name: "Pavlodar markazi",        nameRu: "Центр Павлодара",           regionId: 'kz7',  lat: 52.2900, lng: 76.9700 },
  { id: 'kz7_2',  name: "Pavlodar Irtysh tumani",  nameRu: "Иртышский район",           regionId: 'kz7',  lat: 52.3100, lng: 76.9500 },
  { id: 'kz8_1',  name: "O'skemen markazi",        nameRu: "Центр Усть-Каменогорска",   regionId: 'kz8',  lat: 49.9500, lng: 82.6200 },
  { id: 'kz8_2',  name: "O'skemen Ulba tumani",    nameRu: "Ульбинский район",          regionId: 'kz8',  lat: 49.9700, lng: 82.6400 },
  { id: 'kz9_1',  name: "Atyrau markazi",          nameRu: "Центр Атырау",              regionId: 'kz9',  lat: 47.1200, lng: 51.9000 },
  { id: 'kz9_2',  name: "Atyrau Azgir tumani",     nameRu: "Азгирский район",           regionId: 'kz9',  lat: 47.1400, lng: 51.9200 },
  { id: 'kz10_1', name: "Qostanay markazi",        nameRu: "Центр Костаная",            regionId: 'kz10', lat: 53.2100, lng: 63.6200 },
  { id: 'kz10_2', name: "Qostanay Taranov tumani", nameRu: "Тарановский район",         regionId: 'kz10', lat: 53.2300, lng: 63.6000 },

  // ── Qirg'iziston ────────────────────────────────────────────────────────────
  // Bishkek
  { id: 'kg1_1',  name: "Birinchi May tumani",     nameRu: "Первомайский район",        regionId: 'kg1',  lat: 42.8600, lng: 74.5600 },
  { id: 'kg1_2',  name: "Leninski tumani",         nameRu: "Ленинский район",           regionId: 'kg1',  lat: 42.8800, lng: 74.5900 },
  { id: 'kg1_3',  name: "Oktyabr tumani",          nameRu: "Октябрьский район",         regionId: 'kg1',  lat: 42.8600, lng: 74.5800 },
  { id: 'kg1_4',  name: "Sverdlov tumani",         nameRu: "Свердловский район",        regionId: 'kg1',  lat: 42.8900, lng: 74.6100 },
  // O'sh
  { id: 'kg2_1',  name: "O'sh markazi",            nameRu: "Центр Оша",                 regionId: 'kg2',  lat: 40.5133, lng: 72.7985 },
  { id: 'kg2_2',  name: "Sharq tumani",            nameRu: "Восточный район",           regionId: 'kg2',  lat: 40.5300, lng: 72.8200 },
  { id: 'kg2_3',  name: "Kara-Suu tumani",         nameRu: "Кара-Су район",             regionId: 'kg2',  lat: 40.4900, lng: 72.7900 },
  // Qolgan KG shaharlar
  { id: 'kg3_1',  name: "Jalal-Obod markazi",      nameRu: "Центр Джалал-Абада",        regionId: 'kg3',  lat: 40.9333, lng: 72.9833 },
  { id: 'kg3_2',  name: "Jalal-Obod Suzak tumani", nameRu: "Сузакский район",           regionId: 'kg3',  lat: 40.9100, lng: 73.0100 },
  { id: 'kg4_1',  name: "Karakol markazi",         nameRu: "Центр Каракола",            regionId: 'kg4',  lat: 42.4892, lng: 78.3937 },
  { id: 'kg4_2',  name: "Karakol Ak-Suu tumani",   nameRu: "Ак-Суйский район",          regionId: 'kg4',  lat: 42.5000, lng: 78.4100 },
  { id: 'kg5_1',  name: "Tokmok markazi",          nameRu: "Центр Токмока",             regionId: 'kg5',  lat: 42.8401, lng: 75.2907 },
  { id: 'kg6_1',  name: "Kant markazi",            nameRu: "Центр Канта",               regionId: 'kg6',  lat: 42.8900, lng: 74.8500 },
  { id: 'kg7_1',  name: "Batken markazi",          nameRu: "Центр Баткена",             regionId: 'kg7',  lat: 40.0643, lng: 70.8188 },

  // ── Tojikiston ──────────────────────────────────────────────────────────────
  // Dushanbe
  { id: 'tj1_1',  name: "Firdavsiy tumani",        nameRu: "Фирдавсийский район",       regionId: 'tj1',  lat: 38.5600, lng: 68.7700 },
  { id: 'tj1_2',  name: "Ismoil Somoniy tumani",   nameRu: "Исмоили Сомони район",      regionId: 'tj1',  lat: 38.5700, lng: 68.7600 },
  { id: 'tj1_3',  name: "Shohmansur tumani",       nameRu: "Шохмансурский район",       regionId: 'tj1',  lat: 38.5500, lng: 68.7900 },
  { id: 'tj1_4',  name: "Sino tumani",             nameRu: "Синский район",             regionId: 'tj1',  lat: 38.5800, lng: 68.7800 },
  // Qolgan TJ shaharlar
  { id: 'tj2_1',  name: "Xo'jand markazi",         nameRu: "Центр Худжанда",            regionId: 'tj2',  lat: 40.2825, lng: 69.6215 },
  { id: 'tj2_2',  name: "Xo'jand Spitamen tumani", nameRu: "Спитаменский район",        regionId: 'tj2',  lat: 40.3000, lng: 69.6400 },
  { id: 'tj3_1',  name: "Kulob markazi",           nameRu: "Центр Куляба",              regionId: 'tj3',  lat: 37.9125, lng: 69.7798 },
  { id: 'tj3_2',  name: "Kulob Vose tumani",       nameRu: "Восейский район",           regionId: 'tj3',  lat: 37.8900, lng: 69.8000 },
  { id: 'tj4_1',  name: "Bokhtar markazi",         nameRu: "Центр Бохтара",             regionId: 'tj4',  lat: 37.8333, lng: 68.7833 },
  { id: 'tj5_1',  name: "Istaravshan markazi",     nameRu: "Центр Истаравшана",         regionId: 'tj5',  lat: 39.9139, lng: 69.0025 },
  { id: 'tj6_1',  name: "Konibodom markazi",       nameRu: "Центр Канибадама",          regionId: 'tj6',  lat: 40.2847, lng: 70.4281 },
  { id: 'tj7_1',  name: "Panjakent markazi",       nameRu: "Центр Пенджикента",         regionId: 'tj7',  lat: 39.4942, lng: 67.6097 },

  // ── Turkmaniston ────────────────────────────────────────────────────────────
  // Ashxabad
  { id: 'tm1_1',  name: "Abadan tumani",           nameRu: "Абаданский район",          regionId: 'tm1',  lat: 37.9700, lng: 58.3500 },
  { id: 'tm1_2',  name: "Arkadag tumani",          nameRu: "Аркадагский район",         regionId: 'tm1',  lat: 37.9500, lng: 58.3000 },
  { id: 'tm1_3',  name: "Bagtyarlyk tumani",       nameRu: "Бахтиярлыкский район",      regionId: 'tm1',  lat: 37.9400, lng: 58.3200 },
  { id: 'tm1_4',  name: "Berkararlyk tumani",      nameRu: "Беркарарлыкский район",     regionId: 'tm1',  lat: 37.9600, lng: 58.3400 },
  { id: 'tm1_5',  name: "Kopetdag tumani",         nameRu: "Копетдагский район",        regionId: 'tm1',  lat: 37.9500, lng: 58.3100 },
  // Qolgan TM shaharlar
  { id: 'tm2_1',  name: "Turkmenabat markazi",     nameRu: "Центр Туркменабада",        regionId: 'tm2',  lat: 39.0833, lng: 63.5667 },
  { id: 'tm2_2',  name: "Turkmenabat Farap tumani",nameRu: "Фарапский район",           regionId: 'tm2',  lat: 39.1200, lng: 63.5900 },
  { id: 'tm3_1',  name: "Mary markazi",            nameRu: "Центр Мары",                regionId: 'tm3',  lat: 37.5933, lng: 61.8300 },
  { id: 'tm3_2',  name: "Mary Bayramaly tumani",   nameRu: "Байрамалийский район",      regionId: 'tm3',  lat: 37.6200, lng: 62.1800 },
  { id: 'tm4_1',  name: "Balkanabat markazi",      nameRu: "Центр Балканабада",         regionId: 'tm4',  lat: 39.5100, lng: 54.3700 },
  { id: 'tm5_1',  name: "Dashhoguz markazi",       nameRu: "Центр Дашогуза",            regionId: 'tm5',  lat: 41.8369, lng: 59.9669 },
  { id: 'tm5_2',  name: "Dashhoguz Ko'hna tumani", nameRu: "Кухна-Ургенчский район",    regionId: 'tm5',  lat: 41.7100, lng: 59.7700 },
  { id: 'tm6_1',  name: "Türkmenbaşy markazi",     nameRu: "Центр Туркменбаши",         regionId: 'tm6',  lat: 40.0181, lng: 52.9795 },

  // ── Afg'oniston ─────────────────────────────────────────────────────────────
  // Kobul
  { id: 'af1_1',  name: "Shahr-e Naw",             nameRu: "Шахр-э-Нав",                regionId: 'af1',  lat: 34.5280, lng: 69.1724 },
  { id: 'af1_2',  name: "Wazir Akbar Khan",        nameRu: "Вазир Акбар Хан",           regionId: 'af1',  lat: 34.5400, lng: 69.1900 },
  { id: 'af1_3',  name: "Makrorayon",              nameRu: "Макрорайон",                regionId: 'af1',  lat: 34.5100, lng: 69.1800 },
  { id: 'af1_4',  name: "Karte Seh",               nameRu: "Карта Сех",                 regionId: 'af1',  lat: 34.5000, lng: 69.1600 },
  { id: 'af1_5',  name: "Khayr Xona",              nameRu: "Хайр Хана",                 regionId: 'af1',  lat: 34.5700, lng: 69.1500 },
  { id: 'af1_6',  name: "Taimani",                 nameRu: "Таймани",                   regionId: 'af1',  lat: 34.5200, lng: 69.1600 },
  { id: 'af1_7',  name: "Deh Mazang",              nameRu: "Дех Мазанг",                regionId: 'af1',  lat: 34.5150, lng: 69.1400 },
  // Qolgan AF shaharlar
  { id: 'af2_1',  name: "Hirot markazi",           nameRu: "Центр Герата",              regionId: 'af2',  lat: 34.3482, lng: 62.2040 },
  { id: 'af2_2',  name: "Hirot Injil tumani",      nameRu: "Инджильский район",         regionId: 'af2',  lat: 34.4300, lng: 62.2200 },
  { id: 'af3_1',  name: "Mozori Sharif markazi",   nameRu: "Центр Мазари-Шарифа",       regionId: 'af3',  lat: 36.7069, lng: 67.1115 },
  { id: 'af3_2',  name: "Mozori Sharif Dehdadi",   nameRu: "Дехдадийский район",        regionId: 'af3',  lat: 36.7500, lng: 67.2000 },
  { id: 'af4_1',  name: "Qandahor markazi",        nameRu: "Центр Кандагара",           regionId: 'af4',  lat: 31.6131, lng: 65.7100 },
  { id: 'af5_1',  name: "Jalalabad markazi",       nameRu: "Центр Джалалабада",         regionId: 'af5',  lat: 34.4211, lng: 70.4514 },
  { id: 'af6_1',  name: "Kunduz markazi",          nameRu: "Центр Кундуза",             regionId: 'af6',  lat: 36.7281, lng: 68.8670 },
  { id: 'af7_1',  name: "G'azna markazi",          nameRu: "Центр Газни",               regionId: 'af7',  lat: 33.5500, lng: 68.4167 },

  // ── Rossiya ─────────────────────────────────────────────────────────────────
  // Moskva
  { id: 'ru1_1',  name: "Markaziy okrug",          nameRu: "Центральный округ",         regionId: 'ru1',  lat: 55.7558, lng: 37.6173 },
  { id: 'ru1_2',  name: "Shimoliy-Sharq okrugi",   nameRu: "Северо-Восточный округ",    regionId: 'ru1',  lat: 55.8300, lng: 37.6600 },
  { id: 'ru1_3',  name: "Sharqiy okrug",           nameRu: "Восточный округ",           regionId: 'ru1',  lat: 55.7800, lng: 37.8100 },
  { id: 'ru1_4',  name: "Janubi-Sharq okrugi",     nameRu: "Юго-Восточный округ",       regionId: 'ru1',  lat: 55.7000, lng: 37.7500 },
  { id: 'ru1_5',  name: "Janubiy okrug",           nameRu: "Южный округ",               regionId: 'ru1',  lat: 55.6500, lng: 37.6200 },
  { id: 'ru1_6',  name: "Janubi-G'arb okrugi",     nameRu: "Юго-Западный округ",        regionId: 'ru1',  lat: 55.6700, lng: 37.4900 },
  { id: 'ru1_7',  name: "G'arbiy okrug",           nameRu: "Западный округ",            regionId: 'ru1',  lat: 55.7300, lng: 37.3800 },
  { id: 'ru1_8',  name: "Shimoliy-G'arb okrugi",   nameRu: "Северо-Западный округ",     regionId: 'ru1',  lat: 55.8000, lng: 37.3900 },
  { id: 'ru1_9',  name: "Shimoliy okrug",          nameRu: "Северный округ",            regionId: 'ru1',  lat: 55.8500, lng: 37.5700 },
  { id: 'ru1_10', name: "Zelenograd okrugi",       nameRu: "Зеленоградский округ",      regionId: 'ru1',  lat: 55.9800, lng: 37.1800 },
  // Sankt-Peterburg
  { id: 'ru2_1',  name: "Admiralteysky okrug",     nameRu: "Адмиралтейский округ",      regionId: 'ru2',  lat: 59.9200, lng: 30.3000 },
  { id: 'ru2_2',  name: "Vasilyeostrovsky okrug",  nameRu: "Василеостровский округ",    regionId: 'ru2',  lat: 59.9400, lng: 30.2600 },
  { id: 'ru2_3',  name: "Vyborgsky okrug",         nameRu: "Выборгский округ",          regionId: 'ru2',  lat: 60.0500, lng: 30.3500 },
  { id: 'ru2_4',  name: "Kalininsky okrug",        nameRu: "Калининский округ",         regionId: 'ru2',  lat: 60.0000, lng: 30.4200 },
  { id: 'ru2_5',  name: "Nevsky okrug",            nameRu: "Невский округ",             regionId: 'ru2',  lat: 59.9100, lng: 30.4600 },
  { id: 'ru2_6',  name: "Primorsky okrug",         nameRu: "Приморский округ",          regionId: 'ru2',  lat: 60.0100, lng: 30.2200 },
  { id: 'ru2_7',  name: "Frunzensky okrug",        nameRu: "Фрунзенский округ",         regionId: 'ru2',  lat: 59.8700, lng: 30.3900 },
  { id: 'ru2_8',  name: "Tsentralny okrug",        nameRu: "Центральный округ",         regionId: 'ru2',  lat: 59.9500, lng: 30.3600 },
  // Qolgan RU shaharlar
  { id: 'ru3_1',  name: "Novosibirsk markazi",     nameRu: "Центр Новосибирска",        regionId: 'ru3',  lat: 54.9833, lng: 82.8964 },
  { id: 'ru3_2',  name: "Novosibirsk Kirovskiy",   nameRu: "Кировский район",           regionId: 'ru3',  lat: 54.9700, lng: 82.8500 },
  { id: 'ru4_1',  name: "Yekaterinburg markazi",   nameRu: "Центр Екатеринбурга",       regionId: 'ru4',  lat: 56.8356, lng: 60.6128 },
  { id: 'ru4_2',  name: "Yekaterinburg Verx-Iset", nameRu: "Верх-Исетский район",       regionId: 'ru4',  lat: 56.8600, lng: 60.5900 },
  { id: 'ru5_1',  name: "Kazan markazi",           nameRu: "Центр Казани",              regionId: 'ru5',  lat: 55.7887, lng: 49.1221 },
  { id: 'ru5_2',  name: "Kazan Sovetsky tumani",   nameRu: "Советский район",           regionId: 'ru5',  lat: 55.8100, lng: 49.1400 },
  { id: 'ru6_1',  name: "Omsk markazi",            nameRu: "Центр Омска",               regionId: 'ru6',  lat: 54.9924, lng: 73.3686 },
  { id: 'ru7_1',  name: "Chelyabinsk markazi",     nameRu: "Центр Челябинска",          regionId: 'ru7',  lat: 55.1644, lng: 61.4368 },
  { id: 'ru7_2',  name: "Chelyabinsk Leninsky",    nameRu: "Ленинский район",           regionId: 'ru7',  lat: 55.1400, lng: 61.4100 },
  { id: 'ru8_1',  name: "Ufa markazi",             nameRu: "Центр Уфы",                 regionId: 'ru8',  lat: 54.7388, lng: 55.9721 },
  { id: 'ru8_2',  name: "Ufa Oktyabr tumani",      nameRu: "Октябрьский район",         regionId: 'ru8',  lat: 54.7200, lng: 55.9500 },
  { id: 'ru9_1',  name: "Krasnodar markazi",       nameRu: "Центр Краснодара",          regionId: 'ru9',  lat: 45.0328, lng: 38.9769 },
  { id: 'ru9_2',  name: "Krasnodar Prikubansky",   nameRu: "Прикубанский район",        regionId: 'ru9',  lat: 45.0600, lng: 38.9900 },
  { id: 'ru10_1', name: "Saratov markazi",         nameRu: "Центр Саратова",            regionId: 'ru10', lat: 51.5924, lng: 46.0267 },
  { id: 'ru10_2', name: "Saratov Zavodskoy",       nameRu: "Заводской район",           regionId: 'ru10', lat: 51.5700, lng: 46.0500 },

  // ── Xitoy ────────────────────────────────────────────────────────────────────
  // Pekin
  { id: 'cn1_1',  name: "Dongcheng tumani",        nameRu: "Дунчэн район",              regionId: 'cn1',  lat: 39.9300, lng: 116.4200 },
  { id: 'cn1_2',  name: "Xicheng tumani",          nameRu: "Сичэн район",               regionId: 'cn1',  lat: 39.9100, lng: 116.3700 },
  { id: 'cn1_3',  name: "Chaoyang tumani",         nameRu: "Чаоян район",               regionId: 'cn1',  lat: 39.9200, lng: 116.4900 },
  { id: 'cn1_4',  name: "Haidian tumani",          nameRu: "Хайдянь район",             regionId: 'cn1',  lat: 40.0000, lng: 116.3200 },
  { id: 'cn1_5',  name: "Fengtai tumani",          nameRu: "Фэнтай район",              regionId: 'cn1',  lat: 39.8600, lng: 116.2900 },
  { id: 'cn1_6',  name: "Tongzhou tumani",         nameRu: "Тунчжоу район",             regionId: 'cn1',  lat: 39.9100, lng: 116.6600 },
  { id: 'cn1_7',  name: "Shijingshan tumani",      nameRu: "Шицзиншань район",          regionId: 'cn1',  lat: 39.9000, lng: 116.2200 },
  // Shanxay
  { id: 'cn2_1',  name: "Huangpu tumani",          nameRu: "Хуанпу район",              regionId: 'cn2',  lat: 31.2300, lng: 121.4800 },
  { id: 'cn2_2',  name: "Jing'an tumani",          nameRu: "Цзин'ань район",            regionId: 'cn2',  lat: 31.2500, lng: 121.4500 },
  { id: 'cn2_3',  name: "Putuo tumani",            nameRu: "Путо район",                regionId: 'cn2',  lat: 31.2600, lng: 121.4100 },
  { id: 'cn2_4',  name: "Xuhui tumani",            nameRu: "Сюйхуэй район",             regionId: 'cn2',  lat: 31.1900, lng: 121.4400 },
  { id: 'cn2_5',  name: "Pudong tumani",           nameRu: "Пудун район",               regionId: 'cn2',  lat: 31.2200, lng: 121.5500 },
  { id: 'cn2_6',  name: "Yangpu tumani",           nameRu: "Янпу район",                regionId: 'cn2',  lat: 31.2700, lng: 121.5200 },
  // Urumqi
  { id: 'cn3_1',  name: "Tianshan tumani",         nameRu: "Тяньшань район",            regionId: 'cn3',  lat: 43.7900, lng: 87.5900 },
  { id: 'cn3_2',  name: "Saybak tumani",           nameRu: "Шайбак район",              regionId: 'cn3',  lat: 43.8100, lng: 87.5500 },
  { id: 'cn3_3',  name: "Xinshi tumani",           nameRu: "Синьши район",              regionId: 'cn3',  lat: 43.8500, lng: 87.5800 },
  { id: 'cn3_4',  name: "Shuimogou tumani",        nameRu: "Шуймогоу район",            regionId: 'cn3',  lat: 43.8200, lng: 87.6400 },
  // Qolgan CN shaharlar
  { id: 'cn4_1',  name: "Guangzhou markazi",       nameRu: "Центр Гуанчжоу",            regionId: 'cn4',  lat: 23.1291, lng: 113.2644 },
  { id: 'cn4_2',  name: "Guangzhou Tianhe tumani", nameRu: "Тяньхэ район",              regionId: 'cn4',  lat: 23.1500, lng: 113.3200 },
  { id: 'cn5_1',  name: "Chengdu markazi",         nameRu: "Центр Чэнду",               regionId: 'cn5',  lat: 30.5728, lng: 104.0668 },
  { id: 'cn5_2',  name: "Chengdu Jinjiang tumani", nameRu: "Цзиньцзян район",           regionId: 'cn5',  lat: 30.5900, lng: 104.0800 },
  { id: 'cn6_1',  name: "Si'an markazi",           nameRu: "Центр Сианя",               regionId: 'cn6',  lat: 34.2658, lng: 108.9541 },
  { id: 'cn6_2',  name: "Si'an Beilin tumani",     nameRu: "Бэйлинь район",             regionId: 'cn6',  lat: 34.2700, lng: 108.9400 },
  { id: 'cn7_1',  name: "Wuhan markazi",           nameRu: "Центр Уханя",               regionId: 'cn7',  lat: 30.5928, lng: 114.3055 },
  { id: 'cn7_2',  name: "Wuhan Jiang'an tumani",   nameRu: "Цзян'ань район",            regionId: 'cn7',  lat: 30.6100, lng: 114.2900 },

  // ── Eron ─────────────────────────────────────────────────────────────────────
  // Tehran (ir1)
  { id: 'ir1_1',  name: "Shimoliy (Tajrish)",      nameRu: "Северный (Таджриш)",        regionId: 'ir1',  lat: 35.8013, lng: 51.4316 },
  { id: 'ir1_2',  name: "Vanak",                   nameRu: "Ванак",                     regionId: 'ir1',  lat: 35.7548, lng: 51.4090 },
  { id: 'ir1_3',  name: "Ekbatan",                 nameRu: "Экбатан",                   regionId: 'ir1',  lat: 35.7220, lng: 51.3120 },
  { id: 'ir1_4',  name: "Enghelab",                nameRu: "Энгелаб",                   regionId: 'ir1',  lat: 35.7009, lng: 51.3925 },
  { id: 'ir1_5',  name: "Tehran-Pars",             nameRu: "Тегеран-Парс",              regionId: 'ir1',  lat: 35.7350, lng: 51.5380 },
  { id: 'ir1_6',  name: "Narmak",                  nameRu: "Нармак",                    regionId: 'ir1',  lat: 35.7300, lng: 51.4900 },
  { id: 'ir1_7',  name: "Tehransar",               nameRu: "Тегерансар",                regionId: 'ir1',  lat: 35.6900, lng: 51.2800 },
  { id: 'ir1_8',  name: "Shahrak-e G'arb",         nameRu: "Шахрак-э-Гарб",             regionId: 'ir1',  lat: 35.7600, lng: 51.3600 },
  // Mashhad (ir2)
  { id: 'ir2_1',  name: "Mashhad markazi",         nameRu: "Центр Мешхеда",             regionId: 'ir2',  lat: 36.2605, lng: 59.6168 },
  { id: 'ir2_2',  name: "Ahmadabad",               nameRu: "Ахмадабад",                 regionId: 'ir2',  lat: 36.2800, lng: 59.5900 },
  { id: 'ir2_3',  name: "Samen",                   nameRu: "Самен",                     regionId: 'ir2',  lat: 36.2900, lng: 59.6000 },
  { id: 'ir2_4',  name: "Imam Rizo shahri",        nameRu: "Шахрак Имам Реза",          regionId: 'ir2',  lat: 36.2400, lng: 59.6500 },
  // Isfahan (ir3)
  { id: 'ir3_1',  name: "Isfahon markazi",         nameRu: "Центр Исфахана",            regionId: 'ir3',  lat: 32.6546, lng: 51.6680 },
  { id: 'ir3_2',  name: "Jolfa",                   nameRu: "Джольфа",                   regionId: 'ir3',  lat: 32.6400, lng: 51.6500 },
  { id: 'ir3_3',  name: "Shahreza",                nameRu: "Шахреза",                   regionId: 'ir3',  lat: 32.0100, lng: 51.8600 },
  { id: 'ir3_4',  name: "Xomeyni Shahr",           nameRu: "Хомейни-Шахр",              regionId: 'ir3',  lat: 32.6900, lng: 51.5200 },
  // Tabriz (ir4)
  { id: 'ir4_1',  name: "Tabriz markazi",          nameRu: "Центр Тебриза",             regionId: 'ir4',  lat: 38.0962, lng: 46.2738 },
  { id: 'ir4_2',  name: "Elgoli",                  nameRu: "Эльгёли",                   regionId: 'ir4',  lat: 38.0600, lng: 46.3200 },
  { id: 'ir4_3',  name: "Bag'misha",               nameRu: "Баг-Мише",                  regionId: 'ir4',  lat: 38.1300, lng: 46.2500 },
  // Karaj (ir5)
  { id: 'ir5_1',  name: "Karaj markazi",           nameRu: "Центр Карадж",              regionId: 'ir5',  lat: 35.8400, lng: 50.9391 },
  { id: 'ir5_2',  name: "Mehr Villa",              nameRu: "Мехр Вилла",                regionId: 'ir5',  lat: 35.8600, lng: 50.9200 },
  // Shiraz (ir6)
  { id: 'ir6_1',  name: "Sheroz markazi",          nameRu: "Центр Шираза",              regionId: 'ir6',  lat: 29.5918, lng: 52.5837 },
  { id: 'ir6_2',  name: "Zand ko'chasi",           nameRu: "Улица Занд",                regionId: 'ir6',  lat: 29.6100, lng: 52.5600 },
  // Ahvaz (ir7)
  { id: 'ir7_1',  name: "Ahvoz markazi",           nameRu: "Центр Ахваза",              regionId: 'ir7',  lat: 31.3183, lng: 48.6706 },
  { id: 'ir7_2',  name: "Kianpars",                nameRu: "Кианпарс",                  regionId: 'ir7',  lat: 31.3400, lng: 48.6800 },
  // Qolgan IR shaharlar
  { id: 'ir8_1',  name: "Qum markazi",             nameRu: "Центр Кума",                regionId: 'ir8',  lat: 34.6401, lng: 50.8764 },
  { id: 'ir8_2',  name: "Qum G'arb tumani",        nameRu: "Западный район Кума",       regionId: 'ir8',  lat: 34.6500, lng: 50.8500 },
  { id: 'ir9_1',  name: "Kirmonshoh markazi",      nameRu: "Центр Керманшаха",          regionId: 'ir9',  lat: 34.3277, lng: 47.0780 },
  { id: 'ir9_2',  name: "Kirmonshoh Sharq",        nameRu: "Восточный Керманшах",       regionId: 'ir9',  lat: 34.3400, lng: 47.1000 },
  { id: 'ir10_1', name: "Urmiya markazi",          nameRu: "Центр Урмии",               regionId: 'ir10', lat: 37.5527, lng: 45.0760 },
  { id: 'ir10_2', name: "Urmiya G'arb",            nameRu: "Западная Урмия",            regionId: 'ir10', lat: 37.5600, lng: 45.0500 },
];

// ─── NEIGHBORHOODS ────────────────────────────────────────────────────────────
export const neighborhoods: StoredNeighborhood[] = [
  { id: 'n1', name: "Yunusobod-1", nameRu: "Юнусабад-1", districtId: 'd1' },
  { id: 'n2', name: "Yunusobod-2", nameRu: "Юнусабад-2", districtId: 'd1' },
  { id: 'n3', name: "Olmazar", nameRu: "Олмазар", districtId: 'd1' },
  { id: 'n4', name: "Chilonzor-1", nameRu: "Чиланзар-1", districtId: 'd2' },
  { id: 'n5', name: "Chilonzor-7", nameRu: "Чиланзар-7", districtId: 'd2' },
  { id: 'n6', name: "Sebzor", nameRu: "Себзар", districtId: 'd3' },
  { id: 'n7', name: "Andijon markazi", nameRu: "Центр Андижана", districtId: 'd11' },
  { id: 'n8', name: "Farg'ona markazi", nameRu: "Центр Ферганы", districtId: 'd15' },
  { id: 'n9', name: "Registon", nameRu: "Регистан", districtId: 'd22' },
  { id: 'n10', name: "Qarshi markazi", nameRu: "Центр Карши", districtId: 'd30' },
];

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
export const categories: StoredCategory[] = [
  {
    id: 'cat1',
    name: "Chorva mollari",
    nameRu: "Скот и птица",
    icon: "🐄",
    subcategories: [
      { id: 'sub1',  name: "Sigir",          nameRu: "Корова",          categoryId: 'cat1' },
      { id: 'sub2',  name: "Qo'y",           nameRu: "Овца",            categoryId: 'cat1' },
      { id: 'sub3',  name: "Echki",          nameRu: "Коза",            categoryId: 'cat1' },
      { id: 'sub4',  name: "Tuya",           nameRu: "Верблюд",         categoryId: 'cat1' },
      { id: 'sub5',  name: "Kurka",          nameRu: "Индейка",         categoryId: 'cat1' },
      { id: 'sub6',  name: "Tovuq",          nameRu: "Курица",          categoryId: 'cat1' },
      { id: 'sub7',  name: "O'rdak",         nameRu: "Утка",            categoryId: 'cat1' },
      { id: 'sub8',  name: "G'oz",           nameRu: "Гусь",            categoryId: 'cat1' },
      { id: 'sub9',  name: "Zotli itlar",    nameRu: "Породистые собаки", categoryId: 'cat1' },
      { id: 'sub10', name: "Mushuk",         nameRu: "Кошка",           categoryId: 'cat1' },
      { id: 'sub11', name: "Boshqa hayvon",  nameRu: "Другие животные", categoryId: 'cat1' },
      { id: 'sub67', name: "Ho'kiz",         nameRu: "Бык/Вол",         categoryId: 'cat1' },
      { id: 'sub68', name: "Buzoq",          nameRu: "Телёнок",         categoryId: 'cat1' },
      { id: 'sub69', name: "Ot",             nameRu: "Лошадь",          categoryId: 'cat1' },
      { id: 'sub70', name: "Eshak",          nameRu: "Осёл",            categoryId: 'cat1' },
      { id: 'sub71', name: "Kabutar",        nameRu: "Голубь",          categoryId: 'cat1' },
      { id: 'sub72', name: "Baliq",          nameRu: "Рыба",            categoryId: 'cat1' },
    ],
  },
  {
    id: 'cat2',
    name: "Qurilish mollari",
    nameRu: "Строительные материалы",
    icon: "🏗️",
    subcategories: [
      // ── 1. Og'ir mahsulotlar ──────────────────────────────────────────
      { id: 'sub2_01', name: "Qum",                        nameRu: "Песок",                    categoryId: 'cat2' },
      { id: 'sub2_02', name: "Shag'al",                    nameRu: "Щебень",                   categoryId: 'cat2' },
      { id: 'sub2_03', name: "Shifer",                     nameRu: "Шифер",                    categoryId: 'cat2' },
      { id: 'sub2_04', name: "Sement",                     nameRu: "Цемент",                   categoryId: 'cat2' },
      { id: 'sub2_05', name: "Armatura",                   nameRu: "Арматура",                 categoryId: 'cat2' },
      { id: 'sub2_06', name: "Pishgan g'isht",             nameRu: "Обожжённый кирпич",        categoryId: 'cat2' },
      { id: 'sub2_07', name: "Shlaka blok",                nameRu: "Шлакоблок",                categoryId: 'cat2' },
      { id: 'sub2_08', name: "Pena blok",                  nameRu: "Пеноблок",                 categoryId: 'cat2' },
      { id: 'sub2_09', name: "Gaz blok",                   nameRu: "Газоблок",                 categoryId: 'cat2' },
      { id: 'sub2_10', name: "Reka tosh",                  nameRu: "Речной камень",            categoryId: 'cat2' },
      { id: 'sub2_11', name: "Pol taxta",                  nameRu: "Напольная доска",          categoryId: 'cat2' },
      { id: 'sub2_12', name: "Profillar (har xil razmer)", nameRu: "Профили разных размеров",  categoryId: 'cat2' },
      { id: 'sub2_13', name: "Boshqa og'ir materiallar",   nameRu: "Прочие тяжёлые материалы", categoryId: 'cat2' },
    ],
  },
  {
    id: 'cat10',
    name: "Ta'mirlash & Bezak",
    nameRu: "Ремонт и отделка",
    icon: "🪟",
    subcategories: [
      { id: 'sub10_01', name: "Kulchatlar (plitka)",        nameRu: "Плитка / Кафель",          categoryId: 'cat10' },
      { id: 'sub10_02', name: "Kraskalar",                  nameRu: "Краски",                   categoryId: 'cat10' },
      { id: 'sub10_03', name: "Shpagilovka",                nameRu: "Шпаклёвка",                categoryId: 'cat10' },
      { id: 'sub10_04', name: "Metall quvurlar (MQ)",       nameRu: "Металлические трубы",      categoryId: 'cat10' },
      { id: 'sub10_05', name: "Elektr materiallari",        nameRu: "Электроматериалы",         categoryId: 'cat10' },
      { id: 'sub10_06', name: "Santexnika materiallari",    nameRu: "Сантехматериалы",          categoryId: 'cat10' },
      { id: 'sub10_07', name: "Oyna & eshik & deraza",      nameRu: "Стекло / двери / окна",    categoryId: 'cat10' },
      { id: 'sub10_08', name: "Pardalar & devorqog'oz",     nameRu: "Шторы и обои",             categoryId: 'cat10' },
      { id: 'sub10_09', name: "Boshqa bezak materiallari",  nameRu: "Прочие отделочные",        categoryId: 'cat10' },
    ],
  },
  {
    id: 'cat11',
    name: "Ovchilik & Baliqchilik",
    nameRu: "Охота и рыбалка",
    icon: "🎯",
    subcategories: [
      { id: 'sub11_01', name: "Miltiq & Yarog'lar",         nameRu: "Ружьё и оружие",           categoryId: 'cat11' },
      { id: 'sub11_02', name: "Kamon & Qo'lbola qurollar",  nameRu: "Лук и стрелы",             categoryId: 'cat11' },
      { id: 'sub11_03', name: "Tuzoq & Tor",                nameRu: "Ловушки и сети",           categoryId: 'cat11' },
      { id: 'sub11_04', name: "Ovchilik kiyimlari",         nameRu: "Одежда для охоты",         categoryId: 'cat11' },
      { id: 'sub11_05', name: "Ovchilik jihozlari",         nameRu: "Снаряжение для охоты",     categoryId: 'cat11' },
      { id: 'sub11_06', name: "Baliq ovlash qarmoqlari",    nameRu: "Удочки и снасти",          categoryId: 'cat11' },
      { id: 'sub11_07', name: "Baliq ovlash qayiqlari",     nameRu: "Лодки для рыбалки",        categoryId: 'cat11' },
      { id: 'sub11_08', name: "Yem & Jig'a",                nameRu: "Приманки и наживки",       categoryId: 'cat11' },
      { id: 'sub11_09', name: "Boshqa ovchilik anjomlar",   nameRu: "Прочие охотничьи товары",  categoryId: 'cat11' },
    ],
  },
  {
    id: 'cat3',
    name: "Transport & Texnika",
    nameRu: "Транспорт и техника",
    icon: "🚗",
    subcategories: [
      // --- Avtomobillar ---
      { id: 'sub3_01', name: "Engil avtomobil",            nameRu: "Легковой автомобиль",      categoryId: 'cat3' },
      { id: 'sub3_02', name: "Mikroavtobus / Minivan",     nameRu: "Микроавтобус / Минивэн",   categoryId: 'cat3' },
      { id: 'sub3_03', name: "Avtobus",                    nameRu: "Автобус",                  categoryId: 'cat3' },
      // --- Yuk mashinalar ---
      { id: 'sub3_04', name: "Yuk mashinasi (gazel)",      nameRu: "Грузовик (газель)",        categoryId: 'cat3' },
      { id: 'sub3_05', name: "Yuk mashinasi (katta)",      nameRu: "Большой грузовик",         categoryId: 'cat3' },
      { id: 'sub3_06', name: "Yarim pricep (fura)",        nameRu: "Полуприцеп (фура)",        categoryId: 'cat3' },
      { id: 'sub3_07', name: "Samosval",                   nameRu: "Самосвал",                 categoryId: 'cat3' },
      { id: 'sub3_08', name: "Muravey / Uch g'ildirakli",  nameRu: "Муравей / Трёхколёсный",   categoryId: 'cat3' },
      // --- Spes texnikalar ---
      { id: 'sub3_09', name: "Traktor",                    nameRu: "Трактор",                  categoryId: 'cat3' },
      { id: 'sub3_10', name: "Kombain",                    nameRu: "Комбайн",                  categoryId: 'cat3' },
      { id: 'sub3_11', name: "Ekskavator",                 nameRu: "Экскаватор",               categoryId: 'cat3', bookingMode: 'full' },
      { id: 'sub3_12', name: "Buldozer / Greyfer",         nameRu: "Бульдозер / Грейфер",      categoryId: 'cat3', bookingMode: 'full' },
      { id: 'sub3_13', name: "Kran / Manipulyator",        nameRu: "Кран / Манипулятор",       categoryId: 'cat3', bookingMode: 'full' },
      { id: 'sub3_14', name: "Pograchik",                  nameRu: "Погрузчик",                categoryId: 'cat3', bookingMode: 'full' },
      { id: 'sub3_15', name: "Boshqa spes texnika",        nameRu: "Прочая спецтехника",       categoryId: 'cat3', bookingMode: 'full' },
      // --- Mototsikl & Skuter ---
      { id: 'sub3_16', name: "Mototsikl",                  nameRu: "Мотоцикл",                 categoryId: 'cat3' },
      { id: 'sub3_17', name: "Skuter",                     nameRu: "Скутер",                   categoryId: 'cat3' },
      { id: 'sub3_18', name: "Velosiped / E-bike",         nameRu: "Велосипед / Э-байк",       categoryId: 'cat3' },
      // --- Boshqa ---
      { id: 'sub3_19', name: "Boshqa transport",           nameRu: "Прочий транспорт",         categoryId: 'cat3' },
    ],
  },
  {
    id: 'cat4',
    name: "Ehtiyot zapchastlar",
    nameRu: "Запчасти",
    icon: "🔧",
    subcategories: [
      { id: 'sub30', name: "Traktor zapchastlari", nameRu: "Запчасти для трактора",  categoryId: 'cat4' },
      { id: 'sub31', name: "Avto zapchastlar",     nameRu: "Автозапчасти",           categoryId: 'cat4' },
      { id: 'sub32', name: "Motor va gidravlika",  nameRu: "Мотор и гидравлика",     categoryId: 'cat4' },
      { id: 'sub33', name: "Elektr qismlar",       nameRu: "Электрозапчасти",        categoryId: 'cat4' },
      { id: 'sub34', name: "Skuter/moto",          nameRu: "Скутер/мото",            categoryId: 'cat4' },
      { id: 'sub35', name: "Boshqa zapchast",      nameRu: "Другие запчасти",        categoryId: 'cat4' },
    ],
  },
  {
    id: 'cat5',
    name: "Don mahsulotlari",
    nameRu: "Зерновые культуры",
    icon: "🌾",
    subcategories: [
      { id: 'sub36', name: "Bug'doy",             nameRu: "Пшеница",          categoryId: 'cat5' },
      { id: 'sub37', name: "Arpa",                nameRu: "Ячмень",           categoryId: 'cat5' },
      { id: 'sub38', name: "Sholi (guruch)",       nameRu: "Рис",              categoryId: 'cat5' },
      { id: 'sub39', name: "Makkajo'xori",         nameRu: "Кукуруза",         categoryId: 'cat5' },
      { id: 'sub40', name: "Fasol",               nameRu: "Фасоль",           categoryId: 'cat5' },
      { id: 'sub41', name: "Loviya",              nameRu: "Горох",            categoryId: 'cat5' },
      { id: 'sub73', name: "Soya",                nameRu: "Соя",              categoryId: 'cat5' },
      { id: 'sub74', name: "Tariq",               nameRu: "Просо",            categoryId: 'cat5' },
      { id: 'sub75', name: "Javdar",              nameRu: "Рожь",             categoryId: 'cat5' },
      { id: 'sub76', name: "Paxta",               nameRu: "Хлопок",           categoryId: 'cat5' },
      { id: 'sub77', name: "Em-xashak (beda)",    nameRu: "Корм (люцерна)",   categoryId: 'cat5' },
      { id: 'sub92', name: "Urug' va ko'chat",    nameRu: "Семена и саженцы", categoryId: 'cat5' },
      { id: 'sub93', name: "Sabzavot va meva",    nameRu: "Овощи и фрукты",   categoryId: 'cat5' },
      { id: 'sub94', name: "Asalari mahsuloti",   nameRu: "Пчелопродукция",   categoryId: 'cat5' },
      { id: 'sub95', name: "Boshqa don",          nameRu: "Прочие зерновые",  categoryId: 'cat5' },
    ],
  },
  {
    id: 'cat9',
    name: "Agrokimyo va dorilar",
    nameRu: "Агрохимия и удобрения",
    icon: "🧪",
    subcategories: [
      { id: 'sub96',  name: "Amofos",             nameRu: "Аммофос",           categoryId: 'cat9' },
      { id: 'sub97',  name: "Selitra",             nameRu: "Селитра",           categoryId: 'cat9' },
      { id: 'sub98',  name: "Karbamid (mochevina)",nameRu: "Карбамид (мочевина)",categoryId: 'cat9' },
      { id: 'sub99',  name: "Kaliy o'g'it",        nameRu: "Калийное удобрение",categoryId: 'cat9' },
      { id: 'sub100', name: "Superfosfat",         nameRu: "Суперфосфат",       categoryId: 'cat9' },
      { id: 'sub101', name: "NPK aralash o'g'it",  nameRu: "Удобрение NPK",     categoryId: 'cat9' },
      { id: 'sub102', name: "Pestitsid (hasharot)", nameRu: "Пестицид",          categoryId: 'cat9' },
      { id: 'sub103', name: "Gerbitsid (begona o't)",nameRu: "Гербицид",         categoryId: 'cat9' },
      { id: 'sub104', name: "Fungitsid (zamburug')", nameRu: "Фунгицид",         categoryId: 'cat9' },
      { id: 'sub105', name: "Organik o'g'it (go'ng)",nameRu: "Органика (навоз)", categoryId: 'cat9' },
      { id: 'sub106', name: "Boshqa kimyo",         nameRu: "Прочая химия",      categoryId: 'cat9' },
    ],
  },
  {
    id: 'cat6',
    name: "Antikvar tovarlar",
    nameRu: "Антикварные товары",
    icon: "🏺",
    subcategories: [
      { id: 'sub42', name: "Mashina (antik)",      nameRu: "Антикварный автомобиль",  categoryId: 'cat6' },
      { id: 'sub43', name: "Mototsikl (antik)",    nameRu: "Антикварный мотоцикл",    categoryId: 'cat6' },
      { id: 'sub44', name: "Aksesuar buyumlar",    nameRu: "Аксессуары",              categoryId: 'cat6' },
      { id: 'sub45', name: "O'yinlar",             nameRu: "Игры",                    categoryId: 'cat6' },
      { id: 'sub46', name: "Antik mebel",          nameRu: "Антикварная мебель",      categoryId: 'cat6' },
      { id: 'sub78', name: "Antik idish-tovoq",    nameRu: "Антикварная посуда",      categoryId: 'cat6' },
      { id: 'sub79', name: "Antik zargarlik",      nameRu: "Антикварные украшения",   categoryId: 'cat6' },
      { id: 'sub47', name: "Boshqa antikvar",      nameRu: "Прочий антиквариат",      categoryId: 'cat6' },
    ],
  },
  {
    id: 'cat7',
    name: "Maishiy xizmatlar",
    nameRu: "Бытовые услуги",
    icon: "🛠️",
    subcategories: [
      { id: 'sub48', name: "Sartarosh",            nameRu: "Парикмахер",          categoryId: 'cat7', bookingMode: 'showcase' },
      { id: 'sub49', name: "Chilangar",            nameRu: "Слесарь",             categoryId: 'cat7', bookingMode: 'showcase' },
      { id: 'sub50', name: "Santexnik",            nameRu: "Сантехник",           categoryId: 'cat7', bookingMode: 'showcase' },
      { id: 'sub51', name: "Asfalt yotqizish",     nameRu: "Укладка асфальта",    categoryId: 'cat7', bookingMode: 'showcase' },
      { id: 'sub52', name: "Elektrik",             nameRu: "Электрик",            categoryId: 'cat7', bookingMode: 'showcase' },
      { id: 'sub53', name: "Duradgor",             nameRu: "Плотник",             categoryId: 'cat7', bookingMode: 'showcase' },
      { id: 'sub54', name: "Pechkachi",            nameRu: "Печник",              categoryId: 'cat7', bookingMode: 'showcase' },
      { id: 'sub84', name: "Bo'yoqchi",            nameRu: "Маляр",               categoryId: 'cat7', bookingMode: 'showcase' },
      { id: 'sub85', name: "Payvandchi",           nameRu: "Сварщик",             categoryId: 'cat7', bookingMode: 'showcase' },
      { id: 'sub86', name: "Qurilish xizmati",     nameRu: "Строительные услуги", categoryId: 'cat7', bookingMode: 'showcase' },
      { id: 'sub87', name: "Agro dron xizmati",    nameRu: "Агродрон",            categoryId: 'cat7', bookingMode: 'full' },
      { id: 'sub88', name: "Ekskavator xizmati",   nameRu: "Экскаватор",          categoryId: 'cat7', bookingMode: 'full' },
      { id: 'sub89', name: "Transport xizmati",    nameRu: "Транспортные услуги", categoryId: 'cat7', bookingMode: 'showcase' },
      { id: 'sub90', name: "Tozalash xizmati",     nameRu: "Клининг",             categoryId: 'cat7', bookingMode: 'showcase' },
      { id: 'sub91', name: "Boshqa xizmat",        nameRu: "Другие услуги",       categoryId: 'cat7', bookingMode: 'showcase' },
    ],
  },
  {
    id: 'cat8',
    name: "Ko'chmas mulk",
    nameRu: "Недвижимость",
    icon: "🏠",
    subcategories: [
      // ── Sotish ──────────────────────────────────────────────────────────────
      { id: 'sub55',  name: "Hovli-uy sotiladi",       nameRu: "Продажа дома/двора",     categoryId: 'cat8' },
      { id: 'sub56',  name: "Kvartira sotiladi",        nameRu: "Продажа квартиры",       categoryId: 'cat8' },
      { id: 'sub57',  name: "Uchastka (er) sotiladi",   nameRu: "Продажа участка",        categoryId: 'cat8' },
      { id: 'sub107', name: "Dacha sotiladi",           nameRu: "Продажа дачи",           categoryId: 'cat8' },
      { id: 'sub108', name: "Qishloq uyi sotiladi",     nameRu: "Сельский дом продажа",   categoryId: 'cat8' },
      // ── Ijara ───────────────────────────────────────────────────────────────
      { id: 'sub58',  name: "Uy ijarasi",               nameRu: "Аренда дома",            categoryId: 'cat8' },
      { id: 'sub59',  name: "Kvartira ijarasi",          nameRu: "Аренда квартиры",        categoryId: 'cat8' },
      { id: 'sub109', name: "Xona ijarasi",              nameRu: "Аренда комнаты",         categoryId: 'cat8' },
      { id: 'sub110', name: "Dacha ijarasi",             nameRu: "Аренда дачи",            categoryId: 'cat8' },
      // ── Tijorat ko'chmas mulki ───────────────────────────────────────────────
      { id: 'sub80',  name: "Magazin / Do'kon",          nameRu: "Магазин / Торговая точка",categoryId: 'cat8' },
      { id: 'sub111', name: "Bozor joyi (savdo nuqtasi)",nameRu: "Место на рынке",         categoryId: 'cat8' },
      { id: 'sub112', name: "Kafe / Restoran",           nameRu: "Кафе / Ресторан",        categoryId: 'cat8' },
      { id: 'sub83',  name: "Ofis / Biznes markaz",      nameRu: "Офис / Бизнес-центр",    categoryId: 'cat8' },
      { id: 'sub113', name: "Zavod / Fabrika",           nameRu: "Завод / Фабрика",        categoryId: 'cat8' },
      { id: 'sub114', name: "Sex (ishlab chiqarish)",    nameRu: "Цех (производство)",     categoryId: 'cat8' },
      { id: 'sub81',  name: "Ombor / Sklad",             nameRu: "Склад",                  categoryId: 'cat8' },
      { id: 'sub82',  name: "Garaj",                     nameRu: "Гараж",                  categoryId: 'cat8' },
      { id: 'sub115', name: "AZS / Yonilg'i stansiyasi", nameRu: "АЗС",                    categoryId: 'cat8' },
      { id: 'sub116', name: "Mehmonxona / Hostel",       nameRu: "Гостиница / Хостел",     categoryId: 'cat8' },
      { id: 'sub117', name: "Qo'shimcha qurilish",       nameRu: "Пристройка",             categoryId: 'cat8' },
      { id: 'sub60',  name: "Boshqa ko'chmas mulk",      nameRu: "Другая недвижимость",    categoryId: 'cat8' },
    ],
  },
  {
    id: 'cat12',
    name: "Mebel",
    nameRu: "Мебель",
    icon: "🛋️",
    subcategories: [
      { id: 'sub12_01', name: "Divan & Kreslo",           nameRu: "Диван и кресло",           categoryId: 'cat12' },
      { id: 'sub12_02', name: "Karavot & Yotoq",          nameRu: "Кровать и спальня",        categoryId: 'cat12' },
      { id: 'sub12_03', name: "Shkaf & Buyum",            nameRu: "Шкаф и комод",             categoryId: 'cat12' },
      { id: 'sub12_04', name: "Stol & Stul",              nameRu: "Стол и стул",              categoryId: 'cat12' },
      { id: 'sub12_05', name: "Oshxona garnitiri",        nameRu: "Кухонный гарнитур",        categoryId: 'cat12' },
      { id: 'sub12_06', name: "Bolalar meblari",          nameRu: "Детская мебель",           categoryId: 'cat12' },
      { id: 'sub12_07', name: "Ofis meblari",             nameRu: "Офисная мебель",           categoryId: 'cat12' },
      { id: 'sub12_08', name: "Gilamlar & To'shaklar",    nameRu: "Ковры и матрасы",          categoryId: 'cat12' },
      { id: 'sub12_09', name: "Dekorativ buyumlar",       nameRu: "Декоративные предметы",    categoryId: 'cat12' },
      { id: 'sub12_10', name: "Boshqa mebel",             nameRu: "Прочая мебель",            categoryId: 'cat12' },
    ],
  },
  {
    id: 'cat13',
    name: "Texnika & Elektronika",
    nameRu: "Техника и электроника",
    icon: "📱",
    subcategories: [
      { id: 'sub13_01', name: "Smartfon & Telefon",       nameRu: "Смартфон и телефон",       categoryId: 'cat13' },
      { id: 'sub13_02', name: "Noutbuk & Kompyuter",      nameRu: "Ноутбук и компьютер",      categoryId: 'cat13' },
      { id: 'sub13_03', name: "Planshet",                 nameRu: "Планшет",                  categoryId: 'cat13' },
      { id: 'sub13_04', name: "Televizor",                nameRu: "Телевизор",                categoryId: 'cat13' },
      { id: 'sub13_05', name: "Muzlatgich & Muzxona",     nameRu: "Холодильник и морозилка",  categoryId: 'cat13' },
      { id: 'sub13_06', name: "Kir yuvish mashinasi",     nameRu: "Стиральная машина",        categoryId: 'cat13' },
      { id: 'sub13_07', name: "Konditsioner",             nameRu: "Кондиционер",              categoryId: 'cat13' },
      { id: 'sub13_08', name: "Oshxona texnikasi",        nameRu: "Кухонная техника",         categoryId: 'cat13' },
      { id: 'sub13_09', name: "Audio & Video",            nameRu: "Аудио и видео",            categoryId: 'cat13' },
      { id: 'sub13_10', name: "Fotoaparat & Kamera",      nameRu: "Фото и видеокамера",       categoryId: 'cat13' },
      { id: 'sub13_11', name: "O'yin konsoli",            nameRu: "Игровая консоль",          categoryId: 'cat13' },
      { id: 'sub13_12', name: "Aksessuarlar",             nameRu: "Аксессуары",               categoryId: 'cat13' },
      { id: 'sub13_13', name: "Boshqa texnika",           nameRu: "Прочая техника",           categoryId: 'cat13' },
    ],
  },
  {
    id: 'cat14',
    name: "Ayrboshlash",
    nameRu: "Обмен (бартер)",
    icon: "🔄",
    subcategories: [
      { id: 'sub14_01', name: "Avtomobil ayrboshlash",    nameRu: "Обмен авто",               categoryId: 'cat14' },
      { id: 'sub14_02', name: "Ko'chmas mulk ayrbosh.",   nameRu: "Обмен недвижимости",       categoryId: 'cat14' },
      { id: 'sub14_03', name: "Texnika ayrboshlash",      nameRu: "Обмен техники",            categoryId: 'cat14' },
      { id: 'sub14_04', name: "Chorva ayrboshlash",       nameRu: "Обмен скота",              categoryId: 'cat14' },
      { id: 'sub14_05', name: "Mebel ayrboshlash",        nameRu: "Обмен мебели",             categoryId: 'cat14' },
      { id: 'sub14_06', name: "Qurilish mat. ayrbosh.",   nameRu: "Обмен стройматериалов",    categoryId: 'cat14' },
      { id: 'sub14_07', name: "Boshqa ayrboshlash",       nameRu: "Прочий обмен",             categoryId: 'cat14' },
    ],
  },
];

// ─── USERS ────────────────────────────────────────────────────────────────────
export const users: StoredUser[] = [
  {
    id: 'u1',
    phone: '+998901234567',
    name: 'Aziz Karimov',
    password: 'test123',
    role: 'seller',
    sellerBadge: 'manufacturer',
    verificationStatus: 'approved',
    regionId: 'r3',
    districtId: 'd11',
    neighborhoodId: null,
    rating: 4.8,
    totalSales: 47,
    createdAt: '2024-01-15T08:00:00.000Z',
  },
  {
    id: 'u2',
    phone: '+998901112233',
    name: 'Dilnoza Yusupova',
    password: 'test123',
    role: 'seller',
    sellerBadge: 'reseller',
    verificationStatus: 'approved',
    regionId: 'r4',
    districtId: 'd15',
    neighborhoodId: null,
    rating: 4.5,
    totalSales: 23,
    createdAt: '2024-02-20T09:00:00.000Z',
  },
  {
    id: 'u3',
    phone: '+998909876543',
    name: 'Jasur Toshmatov',
    password: 'test123',
    role: 'seller',
    sellerBadge: 'manufacturer',
    verificationStatus: 'approved',
    regionId: 'r6',
    districtId: 'd22',
    neighborhoodId: null,
    rating: 4.9,
    totalSales: 112,
    createdAt: '2023-11-10T10:00:00.000Z',
  },
  {
    id: 'u4',
    phone: '+998905551234',
    name: 'Malika Rahimova',
    password: 'test123',
    role: 'buyer',
    sellerBadge: null,
    verificationStatus: 'none',
    regionId: 'r1',
    districtId: 'd2',
    neighborhoodId: null,
    rating: null,
    totalSales: 0,
    createdAt: '2024-03-05T11:00:00.000Z',
  },
];

// ─── LISTINGS ─────────────────────────────────────────────────────────────────
export const listings: StoredListing[] = [
  {
    id: 'l1',
    title: "Sut sigir sotiladi (Jersey zoti)",
    titleRu: "Продается молочная корова породы Джерси",
    description: "Yoshi 3 yosh, kuniga 18-20 litr sut beradi. Barcha emlashlar qilingan. Sog'lom va tinch hayvon.",
    price: 9500000,
    priceUnit: "dona",
    images: [],
    categoryId: 'cat1',
    subcategoryId: 'sub1', // Sigir
    userId: 'u1',
    regionId: 'r3',
    districtId: 'd11',
    neighborhoodId: null,
    lat: 40.7821,
    lng: 72.3442,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 142,
    createdAt: '2024-06-01T08:00:00.000Z',
  },
  {
    id: 'l2',
    title: "Qurilish g'ishtlari (M150)",
    titleRu: "Строительный кирпич М150",
    description: "Sifatli M150 g'isht. Narx 1000 donadan ko'p xarid qilishda chegirma bor.",
    price: 1400,
    priceUnit: "dona",
    images: [],
    categoryId: 'cat2',
    subcategoryId: 'sub2_06', // Pishgan g'isht
    userId: 'u3',
    regionId: 'r6',
    districtId: 'd22',
    neighborhoodId: null,
    lat: 39.6542,
    lng: 66.9597,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 89,
    createdAt: '2024-06-05T09:00:00.000Z',
  },
  {
    id: 'l3',
    title: "Broiler tovuqlar (40 kunlik)",
    titleRu: "Бройлеры 40-дневные",
    description: "O'rtacha og'irligi 2.0-2.2 kg. 500 donadan boshlab sotiladi.",
    price: 38000,
    priceUnit: "dona",
    images: [],
    categoryId: 'cat1',
    subcategoryId: 'sub6', // Tovuq
    userId: 'u2',
    regionId: 'r4',
    districtId: 'd15',
    neighborhoodId: null,
    lat: 40.3834,
    lng: 71.7855,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 215,
    createdAt: '2024-06-08T07:00:00.000Z',
  },
  {
    id: 'l4',
    title: "Sement M400 (Qo'ng'irot)",
    titleRu: "Цемент М400 Кунгиратский",
    description: "Yangi partiya keldi. Qop narxi ulgurji xaridda arzonroq.",
    price: 92000,
    priceUnit: "qop (50 kg)",
    images: [],
    categoryId: 'cat2',
    subcategoryId: 'sub2_04', // Sement
    userId: 'u3',
    regionId: 'r6',
    districtId: 'd22',
    neighborhoodId: null,
    lat: 39.6500,
    lng: 66.9500,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 178,
    createdAt: '2024-06-10T10:00:00.000Z',
  },
  {
    id: 'l5',
    title: "Traktor (MTZ-80) ehtiyot qismlari",
    titleRu: "Запчасти для трактора МТЗ-80",
    description: "Original va analog ehtiyot qismlari. Barcha qismlar mavjud, narxlar kelishiladi.",
    price: 450000,
    priceUnit: "to'plam",
    images: [],
    categoryId: 'cat4',
    subcategoryId: 'sub30', // Traktor zapchastlari
    userId: 'u1',
    regionId: 'r3',
    districtId: 'd12',
    neighborhoodId: null,
    lat: 40.6430,
    lng: 72.2360,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 67,
    createdAt: '2024-06-12T11:00:00.000Z',
  },
  {
    id: 'l6',
    title: "Ekskavator ijarasi (HYUNDAI R210)",
    titleRu: "Аренда экскаватора Hyundai R210",
    description: "Tajribali operator bilan. Har qanday ish turlari uchun. Minimal ijara muddati 1 soat.",
    price: 850000,
    priceUnit: "soat",
    images: [],
    categoryId: 'cat7',
    subcategoryId: 'sub88', // Ekskavator xizmati
    userId: 'u3',
    regionId: 'r6',
    districtId: 'd22',
    neighborhoodId: null,
    lat: 39.6600,
    lng: 67.0000,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 43,
    createdAt: '2024-06-14T12:00:00.000Z',
  },
  {
    id: 'l7',
    title: "Armatura 12mm (A400 GOST)",
    titleRu: "Арматура 12мм А400 ГОСТ",
    description: "Sertifikatlangan armatura. Tonnasiga chegirma mavjud. O'z transportimiz bilan yetkazib beramiz.",
    price: 12500,
    priceUnit: "metr",
    images: [],
    categoryId: 'cat2',
    subcategoryId: 'sub2_05', // Armatura
    userId: 'u2',
    regionId: 'r4',
    districtId: 'd16',
    neighborhoodId: null,
    lat: 40.4700,
    lng: 71.7300,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 124,
    createdAt: '2024-06-15T08:00:00.000Z',
  },
  {
    id: 'l8',
    title: "Qo'y sotiladi (Qorako'l zoti)",
    titleRu: "Продаются каракульские овцы",
    description: "2 yoshli, sog'lom qo'ylar. Boshiga narx. Ko'p xaridda chegirma.",
    price: 3800000,
    priceUnit: "bosh",
    images: [],
    categoryId: 'cat1',
    subcategoryId: 'sub2', // Qo'y
    userId: 'u3',
    regionId: 'r9',
    districtId: 'd30',
    neighborhoodId: null,
    lat: 38.8671,
    lng: 65.7917,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 98,
    createdAt: '2024-06-16T09:00:00.000Z',
  },
  {
    id: 'l9',
    title: "Agro-dron ijarasi (DJI Agras T40)",
    titleRu: "Аренда агро-дрона DJI Agras T40",
    description: "Ekin dalalarini ishlov berish uchun professional agro-dron. 1 soatda 80 gektargacha.",
    price: 1500000,
    priceUnit: "soat",
    images: [],
    categoryId: 'cat7',
    subcategoryId: 'sub87', // Agro dron xizmati
    userId: 'u2',
    regionId: 'r4',
    districtId: 'd15',
    neighborhoodId: null,
    lat: 40.3900,
    lng: 71.7900,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 77,
    createdAt: '2024-06-17T10:00:00.000Z',
  },
  {
    id: 'l10',
    title: "Antik xorazm gilami (XIX asr)",
    titleRu: "Антикварный хорезмский ковёр XIX века",
    description: "Noyob qo'l to'qilgan gilam. Holati juda yaxshi. Ekspertiza hujjati mavjud.",
    price: 4500000,
    priceUnit: "dona",
    images: [],
    categoryId: 'cat6',
    subcategoryId: 'sub46', // Antikvar
    userId: 'u1',
    regionId: 'r13',
    districtId: 'd38',
    neighborhoodId: null,
    lat: 41.5500,
    lng: 60.6167,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 56,
    createdAt: '2024-06-18T11:00:00.000Z',
  },
  {
    id: 'l11',
    title: "Shifer (7 to'lqinli, 1.75m)",
    titleRu: "Шифер 7-волновой 1.75м",
    description: "Ombordan to'g'ridan-to'g'ri. Sifat belgisi bilan. Yetkazib berish mumkin.",
    price: 95000,
    priceUnit: "dona",
    images: [],
    categoryId: 'cat2',
    subcategoryId: 'sub2_03', // Shifer
    userId: 'u1',
    regionId: 'r3',
    districtId: 'd11',
    neighborhoodId: null,
    lat: 40.7900,
    lng: 72.3500,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 133,
    createdAt: '2024-06-19T08:00:00.000Z',
  },
  {
    id: 'l12',
    title: "Asalari oilalari (Karnik zoti)",
    titleRu: "Пчелосемьи породы Карника",
    description: "Ko'p asalchi oilalari. Har bir oila 7-8 ramkali. O'z joyimizda ko'rib xarid qilish mumkin.",
    price: 950000,
    priceUnit: "oila",
    images: [],
    categoryId: 'cat5',
    subcategoryId: 'sub94', // Asalari mahsuloti
    userId: 'u2',
    regionId: 'r10',
    districtId: 'd32',
    neighborhoodId: null,
    lat: 37.2244,
    lng: 67.2783,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 61,
    createdAt: '2024-06-20T09:00:00.000Z',
  },
  {
    id: 'l13',
    title: "Skuter (Honda PCX 150) qismlari",
    titleRu: "Запчасти скутер Honda PCX 150",
    description: "Original Honda ehtiyot qismlari. Dvigatel, tormoz, filtr va boshqalar.",
    price: 180000,
    priceUnit: "dona",
    images: [],
    categoryId: 'cat4',
    subcategoryId: 'sub34', // Skuter/moto zapchastlar
    userId: 'u3',
    regionId: 'r6',
    districtId: 'd23',
    neighborhoodId: null,
    lat: 39.9000,
    lng: 66.2600,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 45,
    createdAt: '2024-06-21T10:00:00.000Z',
  },
  {
    id: 'l14',
    title: "Hovuz uchun plevka (500 mkm)",
    titleRu: "Плёнка для бассейна 500 мкм",
    description: "Suv o'tkazmaydigan maxsus qoplama. Kenglik 6m, uzunlik 50m. Yaxshi narx.",
    price: 2800000,
    priceUnit: "rulon",
    images: [],
    categoryId: 'cat10',
    subcategoryId: 'sub10_09', // Boshqa bezak materiallari
    userId: 'u1',
    regionId: 'r3',
    districtId: 'd11',
    neighborhoodId: null,
    lat: 40.7800,
    lng: 72.3400,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 38,
    createdAt: '2024-06-22T11:00:00.000Z',
  },
  {
    id: 'l15',
    title: "O'rdak sotiladi (Pekin zoti)",
    titleRu: "Утки породы Пекин",
    description: "Sog'lom pekin o'rdaqlari. 3 oylik, 1.5-2 kg. Bozor narxidan arzon.",
    price: 45000,
    priceUnit: "dona",
    images: [],
    categoryId: 'cat1',
    subcategoryId: 'sub7', // O'rdak
    userId: 'u2',
    regionId: 'r5',
    districtId: 'd19',
    neighborhoodId: null,
    lat: 41.0011,
    lng: 71.6683,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 92,
    createdAt: '2024-06-23T08:00:00.000Z',
  },

  // ── CAT1: Chorva mollari (qo'shimcha) ────────────────────────────────────────
  {
    id: 'l16',
    title: "Sut echkilar sotiladi (Zanen zoti)",
    titleRu: "Молочные козы породы Зааненская",
    description: "Rang: oq. Yoshi: 2 yoshli. Kuniga 4-5 litr sut beradi. Boshi bo'yi narx. Barcha emlashlar qilingan.",
    price: 2200000,
    priceUnit: "bosh",
    images: [],
    categoryId: 'cat1',
    subcategoryId: 'sub3', // Echki
    userId: 'u1',
    regionId: 'r1',
    districtId: 'd2',
    neighborhoodId: null,
    lat: 41.2995,
    lng: 69.2401,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 78,
    createdAt: '2024-06-24T08:00:00.000Z',
  },
  {
    id: 'l17',
    title: "Kurka sotiladi (Bronze zoti)",
    titleRu: "Индейки породы Бронзовая",
    description: "Rang: bronza-qo'ng'ir. Og'irligi: 8-10 kg (urg'ochi), 15-18 kg (erkak). Parhez uchun ideal. 20 donadan boshlab sotiladi.",
    price: 320000,
    priceUnit: "dona",
    images: [],
    categoryId: 'cat1',
    subcategoryId: 'sub5', // Kurka
    userId: 'u2',
    regionId: 'r4',
    districtId: 'd15',
    neighborhoodId: null,
    lat: 40.3834,
    lng: 71.7855,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 145,
    createdAt: '2024-06-25T07:00:00.000Z',
  },
  {
    id: 'l18',
    title: "Ho'kiz sotiladi (ish ho'kizi)",
    titleRu: "Рабочий бык на продажу",
    description: "Rang: qora-oq (dala). Yoshi: 4 yosh. Og'irligi: ~550 kg. Yer haydalishiga o'rgatilgan. Tinch, mehnatsevar.",
    price: 14500000,
    priceUnit: "bosh",
    images: [],
    categoryId: 'cat1',
    subcategoryId: 'sub67', // Ho'kiz
    userId: 'u3',
    regionId: 'r6',
    districtId: 'd22',
    neighborhoodId: null,
    lat: 39.6542,
    lng: 66.9597,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 54,
    createdAt: '2024-06-26T09:00:00.000Z',
  },
  {
    id: 'l19',
    title: "Ot sotiladi (Akhalteke zoti)",
    titleRu: "Ахалтекинский конь на продажу",
    description: "Rang: kulrang (to'riq). Yoshi: 5 yosh. Bo'yi: 158 sm (qo'shimcha). Barcha veterinariya hujjatlari mavjud. Sport musobaqalariga yaroqli.",
    price: 18000000,
    priceUnit: "bosh",
    images: [],
    categoryId: 'cat1',
    subcategoryId: 'sub69', // Ot
    userId: 'u1',
    regionId: 'r3',
    districtId: 'd11',
    neighborhoodId: null,
    lat: 40.7821,
    lng: 72.3442,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 187,
    createdAt: '2024-06-27T10:00:00.000Z',
  },
  {
    id: 'l20',
    title: "Tirik baliq (Katta sazan)",
    titleRu: "Живой карп (крупный)",
    description: "Rang: kumush-oltin. Og'irligi: 1.5-3 kg/dona. Suv havzasidan to'g'ri olinadi. 10 kg dan boshlab buyurtma.",
    price: 35000,
    priceUnit: "kg",
    images: [],
    categoryId: 'cat1',
    subcategoryId: 'sub72', // Baliq
    userId: 'u2',
    regionId: 'r5',
    districtId: 'd18',
    neighborhoodId: null,
    lat: 40.8500,
    lng: 71.7000,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 112,
    createdAt: '2024-06-28T06:00:00.000Z',
  },
  {
    id: 'l21',
    title: "G'oz sotiladi (Xolmogor zoti)",
    titleRu: "Гуси породы Холмогорская",
    description: "Rang: oq. Yoshi: 4 oylik. Og'irligi: 3.5-4 kg. Parhez go'shti uchun. 10 donadan boshlab.",
    price: 120000,
    priceUnit: "dona",
    images: [],
    categoryId: 'cat1',
    subcategoryId: 'sub8', // G'oz
    userId: 'u3',
    regionId: 'r2',
    districtId: 'd7',
    neighborhoodId: null,
    lat: 41.1000,
    lng: 69.8000,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 66,
    createdAt: '2024-06-29T08:00:00.000Z',
  },
  {
    id: 'l22',
    title: "Tuya sotiladi (Baqtriya — 2 o'rkachli)",
    titleRu: "Верблюд бактриан двугорбый",
    description: "Rang: qo'ng'ir. Yoshi: 6 yosh. Og'irligi: ~700 kg. Sog'lom, ishlatish uchun yaroqli. Hujjatlar bilan.",
    price: 27000000,
    priceUnit: "bosh",
    images: [],
    categoryId: 'cat1',
    subcategoryId: 'sub4', // Tuya
    userId: 'u1',
    regionId: 'r14',
    districtId: 'd40',
    neighborhoodId: null,
    lat: 43.7667,
    lng: 59.0000,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 43,
    createdAt: '2024-06-30T09:00:00.000Z',
  },
  {
    id: 'l23',
    title: "Boshqa: Quyon sotiladi (Flander zoti)",
    titleRu: "Кролики породы Фландр",
    description: "Rang: kulrang va oq aralash. Yoshi: 3 oylik. Og'irligi: 2-2.5 kg. 5 ta juftlikda sotiladi.",
    price: 150000,
    priceUnit: "juft",
    images: [],
    categoryId: 'cat1',
    subcategoryId: 'sub11', // Boshqa hayvon
    userId: 'u2',
    regionId: 'r7',
    districtId: 'd25',
    neighborhoodId: null,
    lat: 40.1000,
    lng: 67.8000,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 89,
    createdAt: '2024-07-01T08:00:00.000Z',
  },

  // ── CAT2: Qurilish mollari ────────────────────────────────────────────────────
  {
    id: 'l24',
    title: "Daryo qumi (mayda, sifatli)",
    titleRu: "Речной песок мелкий",
    description: "Fraction: 0.5-2 mm. Rang: sariq-bej. Qurilish va plastir uchun mos. Min buyurtma 5 tonna. Yetkazib berish bor.",
    price: 180000,
    priceUnit: "tonna",
    images: [],
    categoryId: 'cat2',
    subcategoryId: 'sub2_01', // Qum
    userId: 'u3',
    regionId: 'r6',
    districtId: 'd22',
    neighborhoodId: null,
    lat: 39.6542,
    lng: 66.9597,
    status: 'active',
    sellerType: 'ishlab_chiqaruvchi',
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 203,
    createdAt: '2024-07-02T08:00:00.000Z',
  },
  {
    id: 'l25',
    title: "Shag'al (20-40 mm fraksiya)",
    titleRu: "Щебень фракция 20-40 мм",
    description: "Rang: kulrang. Kattaligi: 20-40 mm fraksiya. Betonlash va yo'l qurilishi uchun. Tonnasiga chegirma. Transport bor.",
    price: 220000,
    priceUnit: "tonna",
    images: [],
    categoryId: 'cat2',
    subcategoryId: 'sub2_02', // Shag'al
    userId: 'u1',
    regionId: 'r3',
    districtId: 'd12',
    neighborhoodId: null,
    lat: 40.6430,
    lng: 72.2360,
    status: 'active',
    sellerType: 'ishlab_chiqaruvchi',
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 156,
    createdAt: '2024-07-03T09:00:00.000Z',
  },
  {
    id: 'l26',
    title: "Gaz blok (YTONG analog)",
    titleRu: "Газоблок (аналог YTONG)",
    description: "Rang: oq. O'lcham: 600×300×200 mm. Zichligi: D400. Issiqlik saqlash 3× g'ishtdan yaxshi. Paletda 40 dona.",
    price: 28000,
    priceUnit: "dona",
    images: [],
    categoryId: 'cat2',
    subcategoryId: 'sub2_09', // Gaz blok
    userId: 'u2',
    regionId: 'r4',
    districtId: 'd16',
    neighborhoodId: null,
    lat: 40.4700,
    lng: 71.7300,
    status: 'active',
    sellerType: 'ishlab_chiqaruvchi',
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 274,
    createdAt: '2024-07-04T08:00:00.000Z',
  },
  {
    id: 'l27',
    title: "Pol plitka (60×60 granit effekt)",
    titleRu: "Напольная плитка 60×60 под гранит",
    description: "Rang: bej-kulrang marmar naqsh. O'lcham: 60×60 sm. Qalinligi: 9 mm. Namgarchilikka chidamli. Qolip raqami: GR-620.",
    price: 85000,
    priceUnit: "kv.m",
    images: [],
    categoryId: 'cat10',
    subcategoryId: 'sub10_01', // Kulchatlar (plitka)
    userId: 'u3',
    regionId: 'r1',
    districtId: 'd3',
    neighborhoodId: null,
    lat: 41.3500,
    lng: 69.2000,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 318,
    createdAt: '2024-07-05T10:00:00.000Z',
  },
  {
    id: 'l28',
    title: "Fasad bo'yog'i (suv asosida)",
    titleRu: "Фасадная краска (водоэмульсионная)",
    description: "Ranglar: oq, kulrang, sariq, ko'k (tanlash mumkin). Sig'imi: 20 kg banka. Tashqi devorlar uchun UV bardoshli. 1 kg ≈ 4 m² ikki qavat.",
    price: 125000,
    priceUnit: "banka (20 kg)",
    images: [],
    categoryId: 'cat10',
    subcategoryId: 'sub10_02', // Kraskalar
    userId: 'u1',
    regionId: 'r1',
    districtId: 'd2',
    neighborhoodId: null,
    lat: 41.2995,
    lng: 69.2401,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 192,
    createdAt: '2024-07-06T09:00:00.000Z',
  },
  {
    id: 'l29',
    title: "Pol taxta (archa, quruq)",
    titleRu: "Половая доска из ели (сухая)",
    description: "Yog'och turi: archa (el'). Rang: tabiiy ochiq sariq. O'lcham: qalinligi 40 mm, kengligi 100 mm, uzunligi 4 m. Quruq, qorovulda saqlangan.",
    price: 52000,
    priceUnit: "dona (4 m)",
    images: [],
    categoryId: 'cat2',
    subcategoryId: 'sub2_11', // Pol taxta
    userId: 'u2',
    regionId: 'r8',
    districtId: 'd27',
    neighborhoodId: null,
    lat: 41.5000,
    lng: 60.6000,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 88,
    createdAt: '2024-07-07T08:00:00.000Z',
  },
  {
    id: 'l30',
    title: "Pishgan g'isht M200 (Qiziltepa)",
    titleRu: "Кирпич обожжённый М200 (Кизилтепа)",
    description: "Rang: qizil. O'lcham: 250×120×65 mm (standart). Mustahkamligi: M200. Yetkazib berish minimal 10 000 donadan.",
    price: 1600,
    priceUnit: "dona",
    images: [],
    categoryId: 'cat2',
    subcategoryId: 'sub2_06', // Pishgan g'isht
    userId: 'u3',
    regionId: 'r6',
    districtId: 'd22',
    neighborhoodId: null,
    lat: 39.6542,
    lng: 66.9597,
    status: 'active',
    sellerType: 'ishlab_chiqaruvchi',
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 421,
    createdAt: '2024-07-08T07:00:00.000Z',
  },

  // ── CAT3: Transport & Texnika ─────────────────────────────────────────────────
  {
    id: 'l31',
    title: "Chevrolet Cobalt sotiladi",
    titleRu: "Продаётся Chevrolet Cobalt",
    description: "Rang: oq (White). Yil: 2021. Dvigatel: 1.5L benzin. Probeg: 48 000 km. Holati: a'lo. Texnik ko'rik o'tgan. Narx kelishiladi.",
    price: 145000000,
    priceUnit: "dona",
    images: [],
    categoryId: 'cat3',
    subcategoryId: 'sub3_01', // Engil avtomobil
    userId: 'u1',
    regionId: 'r1',
    districtId: 'd3',
    neighborhoodId: null,
    lat: 41.3500,
    lng: 69.2000,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 534,
    createdAt: '2024-07-09T10:00:00.000Z',
  },
  {
    id: 'l32',
    title: "Chevrolet Matiz sotiladi",
    titleRu: "Продаётся Chevrolet Matiz",
    description: "Rang: ko'k (ocean blue). Yil: 2019. Dvigatel: 0.8L. Probeg: 72 000 km. Iqtisodiy yoqilg'i sarfi. Shahar uchun ideal.",
    price: 72000000,
    priceUnit: "dona",
    images: [],
    categoryId: 'cat3',
    subcategoryId: 'sub3_01', // Engil avtomobil
    userId: 'u2',
    regionId: 'r4',
    districtId: 'd15',
    neighborhoodId: null,
    lat: 40.3834,
    lng: 71.7855,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 289,
    createdAt: '2024-07-10T09:00:00.000Z',
  },
  {
    id: 'l33',
    title: "Traktor MTZ-82 sotiladi",
    titleRu: "Трактор МТЗ-82 на продажу",
    description: "Rang: qizil. Yil: 2016. Dvigatel: 80 ot kuchi. Kabina bor. Barcha ishchi uskunalar mavjud. Ekin maydonlari uchun tayyor.",
    price: 180000000,
    priceUnit: "dona",
    images: [],
    categoryId: 'cat3',
    subcategoryId: 'sub3_09', // Traktor
    userId: 'u3',
    regionId: 'r9',
    districtId: 'd30',
    neighborhoodId: null,
    lat: 38.8671,
    lng: 65.7917,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 167,
    createdAt: '2024-07-11T08:00:00.000Z',
  },
  {
    id: 'l34',
    title: "Mototsikl (Yamaha YBR 125)",
    titleRu: "Мотоцикл Yamaha YBR 125",
    description: "Rang: qora. Kubatura: 125cc. Yil: 2022. Probeg: 15 000 km. Yoqilg'i sarfi: 2.5L/100km. Texnik holati a'lo.",
    price: 22000000,
    priceUnit: "dona",
    images: [],
    categoryId: 'cat3',
    subcategoryId: 'sub3_16', // Mototsikl
    userId: 'u1',
    regionId: 'r3',
    districtId: 'd11',
    neighborhoodId: null,
    lat: 40.7821,
    lng: 72.3442,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 198,
    createdAt: '2024-07-12T10:00:00.000Z',
  },

  // ── CAT4: Ehtiyot zapchastlar ─────────────────────────────────────────────────
  {
    id: 'l35',
    title: "Cobalt uchun tormoz disklari (original)",
    titleRu: "Тормозные диски для Cobalt (оригинал)",
    description: "Model: Cobalt 2012-2023. O'lcham: 256 mm diametr. Rang: kulrang metall. 2 ta (juft) birga. GOST sertifikat bor.",
    price: 380000,
    priceUnit: "juft",
    images: [],
    categoryId: 'cat4',
    subcategoryId: 'sub31', // Avto zapchast
    userId: 'u2',
    regionId: 'r4',
    districtId: 'd16',
    neighborhoodId: null,
    lat: 40.4700,
    lng: 71.7300,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 134,
    createdAt: '2024-07-13T09:00:00.000Z',
  },
  {
    id: 'l36',
    title: "MTZ-80/82 gidravlik nasos",
    titleRu: "Гидравлический насос МТЗ-80/82",
    description: "Original ehtiyot qism. Rang: qora metall. Bosim: 160 bar. MTZ-80 va MTZ-82 uchun mos. Kafolat 6 oy.",
    price: 1850000,
    priceUnit: "dona",
    images: [],
    categoryId: 'cat4',
    subcategoryId: 'sub32', // Motor va gidravlika
    userId: 'u3',
    regionId: 'r6',
    districtId: 'd22',
    neighborhoodId: null,
    lat: 39.6542,
    lng: 66.9597,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 76,
    createdAt: '2024-07-14T08:00:00.000Z',
  },

  // ── CAT5: Don mahsulotlari ────────────────────────────────────────────────────
  {
    id: 'l37',
    title: "Bug'doy (3-sinf, yangi hosil)",
    titleRu: "Пшеница 3 класс, новый урожай",
    description: "Nav: Krasnodarskaya. Rang: oltin-sariq. Namlik: 14%. Kletchatkasi: 12.5%. Tonnaga chegirma. Min buyurtma 5 tonna.",
    price: 3200000,
    priceUnit: "tonna",
    images: [],
    categoryId: 'cat5',
    subcategoryId: 'sub36', // Bug'doy
    userId: 'u1',
    regionId: 'r3',
    districtId: 'd12',
    neighborhoodId: null,
    lat: 40.6430,
    lng: 72.2360,
    status: 'active',
    sellerType: 'ishlab_chiqaruvchi',
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 267,
    createdAt: '2024-07-15T07:00:00.000Z',
  },
  {
    id: 'l38',
    title: "Devzira guruch (yangi hosil)",
    titleRu: "Рис Девзира, новый урожай",
    description: "Nav: Devzira. Rang: pushti-jigarrang. Og'irligi: qoplarda 50 kg. Plov uchun eng yaxshi. Fermer bevosita sotadi.",
    price: 18000,
    priceUnit: "kg",
    images: [],
    categoryId: 'cat5',
    subcategoryId: 'sub38', // Sholi (guruch)
    userId: 'u2',
    regionId: 'r13',
    districtId: 'd38',
    neighborhoodId: null,
    lat: 41.5500,
    lng: 60.6167,
    status: 'active',
    sellerType: 'ishlab_chiqaruvchi',
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 445,
    createdAt: '2024-07-16T08:00:00.000Z',
  },
  {
    id: 'l39',
    title: "Pomidor sotiladi (tonna-tonna)",
    titleRu: "Томаты оптом",
    description: "Nav: Ishlab Chiqaruvchi (Bogdan F1). Rang: qizil. Kattaligi: 100-150 gr/dona. Min buyurtma 500 kg. Yig'im yangi.",
    price: 2800,
    priceUnit: "kg",
    images: [],
    categoryId: 'cat5',
    subcategoryId: 'sub93', // Sabzavot va meva
    userId: 'u3',
    regionId: 'r6',
    districtId: 'd23',
    neighborhoodId: null,
    lat: 39.9000,
    lng: 66.2600,
    status: 'active',
    sellerType: 'ishlab_chiqaruvchi',
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 389,
    createdAt: '2024-07-17T06:00:00.000Z',
  },
  {
    id: 'l40',
    title: "Quritilgan beda (yashil, sifatli)",
    titleRu: "Сено люцерны (зелёное, качественное)",
    description: "Nav: Sarepta. Rang: yashil (quritilgan). 1 qopda 20-22 kg. Yetkazib berish bor (Toshkent, Samarqand). 100 qopdan arzonroq.",
    price: 55000,
    priceUnit: "qop (20 kg)",
    images: [],
    categoryId: 'cat5',
    subcategoryId: 'sub77', // Em-xashak (beda)
    userId: 'u1',
    regionId: 'r1',
    districtId: 'd4',
    neighborhoodId: null,
    lat: 41.1000,
    lng: 69.0000,
    status: 'active',
    sellerType: 'ishlab_chiqaruvchi',
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 211,
    createdAt: '2024-07-18T07:00:00.000Z',
  },
  {
    id: 'l41',
    title: "Makkajo'xori urug'i (gibrid F1)",
    titleRu: "Семена кукурузы гибрид F1",
    description: "Nav: Pioneer P9903. Rang: sariq. Kattaligi: yirik donli. Hosildorligi: 12-14 t/ga. 1 qop = 80 000 dona urug'.",
    price: 450000,
    priceUnit: "qop",
    images: [],
    categoryId: 'cat5',
    subcategoryId: 'sub92', // Urug' va ko'chat
    userId: 'u2',
    regionId: 'r4',
    districtId: 'd15',
    neighborhoodId: null,
    lat: 40.3834,
    lng: 71.7855,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 158,
    createdAt: '2024-07-19T09:00:00.000Z',
  },

  // ── CAT6: Antikvar tovarlar ───────────────────────────────────────────────────
  {
    id: 'l42',
    title: "Antik mis obdasta (XIX asr Buxoro)",
    titleRu: "Антикварный медный кувшин XIX в., Бухара",
    description: "Rang: bronza-jigarrang (patina). Balandligi: 35 sm. Sig'imi: taxminan 3 litr. Qo'l ishlangan naqsh. Ekspertiza hujjati bor.",
    price: 2800000,
    priceUnit: "dona",
    images: [],
    categoryId: 'cat6',
    subcategoryId: 'sub78', // Antik idish-tovoq
    userId: 'u3',
    regionId: 'r6',
    districtId: 'd22',
    neighborhoodId: null,
    lat: 39.7747,
    lng: 64.4286,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 73,
    createdAt: '2024-07-20T11:00:00.000Z',
  },
  {
    id: 'l43',
    title: "Antik Sovg'at Qilichlar (juft, Qo'qon usta)",
    titleRu: "Антикварные сабли (пара, мастер Коканд)",
    description: "Rang: polatlangan kumush tutqich, qora qin. Uzunligi: 85 sm. XIX asr ikkinchi yarmi. Muzeyga loyiq holat.",
    price: 12000000,
    priceUnit: "juft",
    images: [],
    categoryId: 'cat6',
    subcategoryId: 'sub44', // Aksesuar buyumlar
    userId: 'u1',
    regionId: 'r5',
    districtId: 'd18',
    neighborhoodId: null,
    lat: 40.8500,
    lng: 71.7000,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'vip',
    adminStatus: null,
    viewCount: 124,
    createdAt: '2024-07-21T10:00:00.000Z',
  },

  // ── CAT7: Maishiy xizmatlar ───────────────────────────────────────────────────
  {
    id: 'l44',
    title: "Santexnik xizmati (Toshkent shahri)",
    titleRu: "Услуги сантехника (г. Ташкент)",
    description: "Quvur almashtirish, kran ta'mirlash, suv o'tkazish. Tajriba: 8 yil. Kerakli materiallar olib boriladi. Kecha-kunduz ishlaydi.",
    price: 80000,
    priceUnit: "soat",
    images: [],
    categoryId: 'cat7',
    subcategoryId: 'sub50', // Santexnik
    userId: 'u2',
    regionId: 'r1',
    districtId: 'd2',
    neighborhoodId: null,
    lat: 41.2995,
    lng: 69.2401,
    status: 'active',
    sellerType: null,
    listingType: 'xizmat',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 312,
    createdAt: '2024-07-22T08:00:00.000Z',
  },
  {
    id: 'l45',
    title: "Elektrik (uy va ofis montaji)",
    titleRu: "Электрик (монтаж дома и офиса)",
    description: "Sifatli elektr o'rnatish, schetchik ulash, kabel yotqizish, rozetka-kalid. Kabellar kafolat bilan. Toshkent va viloyat.",
    price: 100000,
    priceUnit: "soat",
    images: [],
    categoryId: 'cat7',
    subcategoryId: 'sub52', // Elektrik
    userId: 'u3',
    regionId: 'r1',
    districtId: 'd3',
    neighborhoodId: null,
    lat: 41.3500,
    lng: 69.2000,
    status: 'active',
    sellerType: null,
    listingType: 'xizmat',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 258,
    createdAt: '2024-07-23T09:00:00.000Z',
  },
  {
    id: 'l46',
    title: "Bo'yoqchi (ichki va tashqi devor)",
    titleRu: "Маляр (внутренняя и внешняя покраска)",
    description: "Remont bo'yoq ishlari: devorlar, shift, fasad. Rang: har qanday. 1 kv.m narxi. 10 yil tajriba. Toshkent va Samarqand.",
    price: 18000,
    priceUnit: "kv.m",
    images: [],
    categoryId: 'cat7',
    subcategoryId: 'sub84', // Bo'yoqchi
    userId: 'u1',
    regionId: 'r1',
    districtId: 'd1',
    neighborhoodId: null,
    lat: 41.2800,
    lng: 69.2000,
    status: 'active',
    sellerType: null,
    listingType: 'xizmat',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 189,
    createdAt: '2024-07-24T10:00:00.000Z',
  },

  // ── CAT8: Ko'chmas mulk ───────────────────────────────────────────────────────
  {
    id: 'l47',
    title: "Hovli-uy sotiladi (6 xona, Samarqand)",
    titleRu: "Продаётся дом (6 комнат, Самарканд)",
    description: "Rang/holat: yangi ta'mirlangan, devorlar oq, parket. Maydoni: 200 kv.m. Xonalar: 6 ta. Garaj, bog' bor. Gaz, suv, elektr ulanган.",
    price: 380000000,
    priceUnit: "dona",
    images: [],
    categoryId: 'cat8',
    subcategoryId: 'sub55', // Hovli-uy sotiladi
    userId: 'u2',
    regionId: 'r6',
    districtId: 'd22',
    neighborhoodId: null,
    lat: 39.6542,
    lng: 66.9597,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 476,
    createdAt: '2024-07-25T09:00:00.000Z',
  },
  {
    id: 'l48',
    title: "2 xonali kvartira ijarasi (Yunusobod)",
    titleRu: "Аренда 2-комнатной квартиры (Юнусабад)",
    description: "Qavat: 5/9. Maydoni: 56 kv.m. Ta'mirlangan: evro-remont, zig'ir rang va oq. Mebel bor. Kommunal to'lovlar alohida.",
    price: 3500000,
    priceUnit: "oyiga",
    images: [],
    categoryId: 'cat8',
    subcategoryId: 'sub59', // Kvartira ijarasi
    userId: 'u3',
    regionId: 'r1',
    districtId: 'd3',
    neighborhoodId: null,
    lat: 41.3700,
    lng: 69.2800,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 621,
    createdAt: '2024-07-26T08:00:00.000Z',
  },
  {
    id: 'l49',
    title: "Er uchastkasi sotiladi (6 sotik, Chirchiq)",
    titleRu: "Продаётся земельный участок 6 соток (Чирчик)",
    description: "Maydoni: 6 sotik (600 kv.m). Qo'shni er holati: tekis, qurilishga tayyor. Suv, gaz, elektr yaqin. Hujjatlar tayyor.",
    price: 120000000,
    priceUnit: "dona",
    images: [],
    categoryId: 'cat8',
    subcategoryId: 'sub57', // Uchastka sotiladi
    userId: 'u1',
    regionId: 'r2',
    districtId: 'd7',
    neighborhoodId: null,
    lat: 41.1000,
    lng: 69.8000,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 344,
    createdAt: '2024-07-27T09:00:00.000Z',
  },

  // ── CAT9: Agrokimyo va dorilar ────────────────────────────────────────────────
  {
    id: 'l50',
    title: "Selitra (ammoniy nitrat) — ulgurji",
    titleRu: "Аммиачная селитра — оптом",
    description: "Rang: oq granula. Azot miqdori: 34.4%. O'lcham: 50 kg qop. Gubarang va ko'klamda ekin oldidan ishlatiladi. Ombordan narx.",
    price: 480000,
    priceUnit: "qop (50 kg)",
    images: [],
    categoryId: 'cat9',
    subcategoryId: 'sub97', // Selitra
    userId: 'u2',
    regionId: 'r4',
    districtId: 'd16',
    neighborhoodId: null,
    lat: 40.4700,
    lng: 71.7300,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 193,
    createdAt: '2024-07-28T08:00:00.000Z',
  },
  {
    id: 'l51',
    title: "Karbamid (mochevina) 46% azot",
    titleRu: "Карбамид (мочевина) 46% азота",
    description: "Rang: oq donador. Azot: 46.2%. O'lcham: 50 kg qop. Barcha ekinlar uchun universal. Sertifikat mavjud. 10+ qopda chegirma.",
    price: 520000,
    priceUnit: "qop (50 kg)",
    images: [],
    categoryId: 'cat9',
    subcategoryId: 'sub98', // Karbamid
    userId: 'u3',
    regionId: 'r6',
    districtId: 'd22',
    neighborhoodId: null,
    lat: 39.6542,
    lng: 66.9597,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 147,
    createdAt: '2024-07-28T09:00:00.000Z',
  },
  {
    id: 'l52',
    title: "Pestitsid — Karate Zeon (hasharot o'ldir)",
    titleRu: "Пестицид Karate Zeon",
    description: "Preparat: Karate Zeon 5% CS. Rang: sariq suyuqlik. Hajmi: 5 litr. Paxta, bug'doy, sabzavot uchun. Sertifikat va yo'riqnoma bor.",
    price: 280000,
    priceUnit: "5 litr",
    images: [],
    categoryId: 'cat9',
    subcategoryId: 'sub102', // Pestitsid
    userId: 'u1',
    regionId: 'r3',
    districtId: 'd11',
    neighborhoodId: null,
    lat: 40.7821,
    lng: 72.3442,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 211,
    createdAt: '2024-07-28T10:00:00.000Z',
  },
  // ── cat10: Ta'mirlash & Bezak ────────────────────────────────────────────────
  {
    id: 'l53',
    title: "Santexnika — Grohe dush kabinasi",
    titleRu: "Душевая кабина Grohe",
    description: "Rang: shaffof oyna + xrom ramka. O'lcham: 90×90×200 sm. Termostatli aralashtirgich. Sertifikat bor. Yig'ish xizmati mavjud.",
    price: 4800000,
    priceUnit: "dona",
    images: [],
    categoryId: 'cat10',
    subcategoryId: 'sub10_06', // Santexnika materiallari
    userId: 'u2',
    regionId: 'r1',
    districtId: 'd3',
    neighborhoodId: null,
    lat: 41.3000, lng: 69.2700,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 143,
    createdAt: '2024-07-10T09:00:00.000Z',
  },
  {
    id: 'l54',
    title: "Metall-plastik deraza (5 kamerali)",
    titleRu: "Металлопластиковое окно (5-камерное)",
    description: "Rang: oq. O'lcham: 1200×1400 mm. 5 kamerali profilь (VEKA). Ikki qavatli steklopaket. Mosquito to'r bepul. O'rnatish xizmati bor.",
    price: 1200000,
    priceUnit: "dona",
    images: [],
    categoryId: 'cat10',
    subcategoryId: 'sub10_07', // Oyna/eshik/deraza
    userId: 'u3',
    regionId: 'r2',
    districtId: 'd7',
    neighborhoodId: null,
    lat: 39.6500, lng: 66.9700,
    status: 'active',
    sellerType: 'ishlab_chiqaruvchi',
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 287,
    createdAt: '2024-07-12T11:00:00.000Z',
  },
  // ── cat11: Ovchilik & Baliqchilik ─────────────────────────────────────────────
  {
    id: 'l55',
    title: "Ov miltiq — MR-153 (12 kalibrli)",
    titleRu: "Охотничье ружьё МР-153 (12 калибр)",
    description: "Marka: Baikal MR-153. Patron: 12/76. Lula uzunligi: 710 mm. Magazin: 4+1. Yog'och qo'ndog'i. Ruxsat hujjatlari bilan birga. Yaxshi holat.",
    price: 3500000,
    priceUnit: "dona",
    images: [],
    categoryId: 'cat11',
    subcategoryId: 'sub11_01', // Miltiq
    userId: 'u1',
    regionId: 'r5',
    districtId: 'd19',
    neighborhoodId: null,
    lat: 41.1000, lng: 71.2700,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 96,
    createdAt: '2024-07-15T08:00:00.000Z',
  },
  {
    id: 'l56',
    title: "Baliq ovlash to'plami (Shimano)",
    titleRu: "Рыболовный набор Shimano",
    description: "Komplekt: Shimano FX 2.7 m qarmog', Shimano Sienna 2500 katushka, 0.28 mm aster (100 m), 20 ta qo'rg'oshin, quti bilan. Yangi, qutisida.",
    price: 850000,
    priceUnit: "to'plam",
    images: [],
    categoryId: 'cat11',
    subcategoryId: 'sub11_06', // Baliq ovlash qarmoqlari
    userId: 'u2',
    regionId: 'r1',
    districtId: 'd4',
    neighborhoodId: null,
    lat: 41.3200, lng: 69.2100,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 174,
    createdAt: '2024-07-18T10:00:00.000Z',
  },
  {
    id: 'l57',
    title: "Ovchilik kostyumi — Gorka-4 (fleece astari)",
    titleRu: "Охотничий костюм Горка-4 (флисовая подкладка)",
    description: "Rang: yashil kamuflaj (tundra). Kattalik: M, L, XL, XXL (tanlash mumkin). Fleece astari, suv o'tkazmaydigan yuqori qatlam. 4 ta katta cho'ntak.",
    price: 480000,
    priceUnit: "dona",
    images: [],
    categoryId: 'cat11',
    subcategoryId: 'sub11_04', // Ovchilik kiyimlari
    userId: 'u3',
    regionId: 'r3',
    districtId: 'd11',
    neighborhoodId: null,
    lat: 40.7900, lng: 72.3500,
    status: 'active',
    sellerType: null,
    listingType: 'savdo',
    elanTur: 'oddiy',
    adminStatus: null,
    viewCount: 62,
    createdAt: '2024-07-20T09:00:00.000Z',
  },
  // ── cat12: Mebel ─────────────────────────────────────────────────────────────
  {
    id: 'l58',
    title: "Divan (uch o'rindiqli, klondayk)",
    titleRu: "Диван трёхместный (Клондайк)",
    description: "Rang: to'q jigarrang (shokoladli). O'lcham: 220×85×90 sm. Materiyal: mikrofibra, yog'och oyoqlar. Yotadigan qilinadi. Yangi, qutisida.",
    price: 3_200_000, priceUnit: "dona", images: [],
    categoryId: 'cat12', subcategoryId: 'sub12_01',
    userId: 'u2', regionId: 'r1', districtId: 'd3', neighborhoodId: null,
    lat: 41.3100, lng: 69.2400, status: 'active', sellerType: 'ishlab_chiqaruvchi',
    listingType: 'savdo', elanTur: 'oddiy', adminStatus: null, viewCount: 214,
    createdAt: '2024-07-22T09:00:00.000Z',
  },
  {
    id: 'l59',
    title: "Oshxona garnitiri (MDF, 3.2 m)",
    titleRu: "Кухонный гарнитур МДФ 3.2 м",
    description: "Rang: oq + kulrang (mat). Uzunligi: 3.2 m. Materiyal: MDF bo'yalgan, BLUM mexanizmlari. Lavabo va moslik bilan. O'rnatish xizmati bor.",
    price: 8_500_000, priceUnit: "dona", images: [],
    categoryId: 'cat12', subcategoryId: 'sub12_05',
    userId: 'u3', regionId: 'r2', districtId: 'd7', neighborhoodId: null,
    lat: 39.6600, lng: 66.9600, status: 'active', sellerType: 'ishlab_chiqaruvchi',
    listingType: 'savdo', elanTur: 'oddiy', adminStatus: null, viewCount: 389,
    createdAt: '2024-07-23T10:00:00.000Z',
  },
  {
    id: 'l60',
    title: "Xonadon gilofi (Toshkent to'qimasi, 2×3 m)",
    titleRu: "Ковёр ручной работы 2×3 м",
    description: "Rang: qizil-ko'k milliy naqsh. O'lcham: 2×3 m. Toshkent to'qimasi, jundan. Qalinligi: 8 mm. Yuvishga chidamli.",
    price: 1_800_000, priceUnit: "dona", images: [],
    categoryId: 'cat12', subcategoryId: 'sub12_08',
    userId: 'u1', regionId: 'r1', districtId: 'd2', neighborhoodId: null,
    lat: 41.2900, lng: 69.2500, status: 'active', sellerType: null,
    listingType: 'savdo', elanTur: 'oddiy', adminStatus: null, viewCount: 127,
    createdAt: '2024-07-24T08:00:00.000Z',
  },
  // ── cat13: Texnika & Elektronika ─────────────────────────────────────────────
  {
    id: 'l61',
    title: "Samsung Galaxy S24 (256 GB)",
    titleRu: "Samsung Galaxy S24 256 GB",
    description: "Rang: Phantom Black. Xotira: 256 GB / 8 GB RAM. Holat: yangi, muhr buzilmagan. Kafolat: 1 yil. Zaryadlovchi va quloqchin bilan.",
    price: 9_200_000, priceUnit: "dona", images: [],
    categoryId: 'cat13', subcategoryId: 'sub13_01',
    userId: 'u3', regionId: 'r1', districtId: 'd4', neighborhoodId: null,
    lat: 41.3300, lng: 69.2300, status: 'active', sellerType: null,
    listingType: 'savdo', elanTur: 'oddiy', adminStatus: null, viewCount: 512,
    createdAt: '2024-07-24T11:00:00.000Z',
  },
  {
    id: 'l62',
    title: "LG konditsioner (24 000 BTU, Inverter)",
    titleRu: "Кондиционер LG Inverter 24000 BTU",
    description: "Model: LG S24ET. Quvvat: 24 000 BTU (70 kv.m). Inverter texnologiya. Energiya sinfi: A++. Issitish va sovutish. O'rnatish xizmati bor.",
    price: 7_800_000, priceUnit: "dona", images: [],
    categoryId: 'cat13', subcategoryId: 'sub13_07',
    userId: 'u2', regionId: 'r4', districtId: 'd15', neighborhoodId: null,
    lat: 40.4500, lng: 71.7200, status: 'active', sellerType: 'ishlab_chiqaruvchi',
    listingType: 'savdo', elanTur: 'oddiy', adminStatus: null, viewCount: 298,
    createdAt: '2024-07-25T09:00:00.000Z',
  },
  {
    id: 'l63',
    title: "Noutbuk Lenovo IdeaPad 5 (Ryzen 5)",
    titleRu: "Ноутбук Lenovo IdeaPad 5 Ryzen 5",
    description: "Protsessor: AMD Ryzen 5 5500U. RAM: 16 GB. SSD: 512 GB. Ekran: 15.6\" FHD IPS. Batareya: 10 soat. Rang: kulrang. Kafolat: 1 yil.",
    price: 6_500_000, priceUnit: "dona", images: [],
    categoryId: 'cat13', subcategoryId: 'sub13_02',
    userId: 'u1', regionId: 'r5', districtId: 'd19', neighborhoodId: null,
    lat: 41.1100, lng: 71.2600, status: 'active', sellerType: null,
    listingType: 'savdo', elanTur: 'oddiy', adminStatus: null, viewCount: 341,
    createdAt: '2024-07-25T12:00:00.000Z',
  },
  // ── cat14: Ayrboshlash ────────────────────────────────────────────────────────
  {
    id: 'l64',
    title: "Chevrolet Cobalt 2021 — Nexia 3 ga ayrboshlash",
    titleRu: "Обмен Cobalt 2021 на Nexia 3",
    description: "Mening: Cobalt 2021, oq, 45 000 km, to'liq komplektatsiya. Xohlayman: Nexia 3 2020+ yoki Matiz 2019+. Narx farqi ko'rib gaplashamiz.",
    price: 0, priceUnit: "kelishiladi", images: [],
    categoryId: 'cat14', subcategoryId: 'sub14_01',
    userId: 'u2', regionId: 'r1', districtId: 'd2', neighborhoodId: null,
    lat: 41.3000, lng: 69.2600, status: 'active', sellerType: null,
    listingType: 'savdo', elanTur: 'oddiy', adminStatus: null, viewCount: 183,
    createdAt: '2024-07-26T08:00:00.000Z',
  },
  {
    id: 'l65',
    title: "2 xonali kvartira — uy-hovliga ayrboshlash",
    titleRu: "Обмен 2-комн. квартиры на дом",
    description: "Mening: Toshkent shahri, Yunusobod, 2 xonali, 60 kv.m, 5/9 qavat. Xohlayman: Toshkent viloyati yoki Samarqand viloyatida hovli-uy. Narq farqiga tayyorman.",
    price: 0, priceUnit: "kelishiladi", images: [],
    categoryId: 'cat14', subcategoryId: 'sub14_02',
    userId: 'u3', regionId: 'r1', districtId: 'd5', neighborhoodId: null,
    lat: 41.3600, lng: 69.2900, status: 'active', sellerType: null,
    listingType: 'savdo', elanTur: 'oddiy', adminStatus: null, viewCount: 267,
    createdAt: '2024-07-26T10:00:00.000Z',
  },
  {
    id: 'l66',
    title: "iPhone 13 Pro — Samsung S22 ga ayrboshlash",
    titleRu: "Обмен iPhone 13 Pro на Samsung S22",
    description: "Mening: iPhone 13 Pro, 256 GB, tog'-yashil, batareya 89%, holati A. Xohlayman: Samsung S22 yoki S23, xolat yaxshi bo'lsin. Narq farqiga kelishamiz.",
    price: 0, priceUnit: "kelishiladi", images: [],
    categoryId: 'cat14', subcategoryId: 'sub14_03',
    userId: 'u1', regionId: 'r2', districtId: 'd7', neighborhoodId: null,
    lat: 39.6700, lng: 66.9800, status: 'active', sellerType: null,
    listingType: 'savdo', elanTur: 'oddiy', adminStatus: null, viewCount: 95,
    createdAt: '2024-07-27T09:00:00.000Z',
  },
];

// ─── ORDERS ───────────────────────────────────────────────────────────────────
export const orders: StoredOrder[] = [
  {
    id: 'o1',
    listingId: 'l1',
    buyerId: 'u4',
    sellerId: 'u1',
    quantity: 1,
    totalPrice: 9500000,
    deliveryOption: 'livestock',
    deliveryPrice: 350000,
    status: 'confirmed',
    notes: "Toshkentga yetkazib bering",
    createdAt: '2024-06-25T14:00:00.000Z',
  },
  {
    id: 'o2',
    listingId: 'l2',
    buyerId: 'u4',
    sellerId: 'u3',
    quantity: 2000,
    totalPrice: 2800000,
    deliveryOption: 'large',
    deliveryPrice: 550000,
    status: 'delivering',
    notes: null,
    createdAt: '2024-06-26T10:00:00.000Z',
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2, 9);
}

export function generateToken(userId: string): string {
  const payload = { id: userId, exp: Date.now() + 86400000 * 30 };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function verifyToken(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    if (payload.exp < Date.now()) return null;
    return payload.id;
  } catch {
    return null;
  }
}

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return Math.round(2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function getDistanceColor(km: number): 'green' | 'yellow' | 'red' {
  if (km < 20) return 'green';
  if (km < 80) return 'yellow';
  return 'red';
}

// ─── NARX CHEGARALARI (subcategoryId bo'yicha, so'm) ──────────────────────────
const PRICE_THRESHOLDS: Record<string, { arzon: number; qimmat: number }> = {
  // Chorva mollari
  sub1:  { arzon: 5_000_000,   qimmat: 25_000_000  }, // Sigir
  sub2:  { arzon: 1_000_000,   qimmat: 5_000_000   }, // Qo'y
  sub3:  { arzon: 800_000,     qimmat: 4_000_000   }, // Echki
  sub4:  { arzon: 8_000_000,   qimmat: 30_000_000  }, // Tuya
  sub5:  { arzon: 200_000,     qimmat: 1_000_000   }, // Kurka
  sub6:  { arzon: 25_000,      qimmat: 120_000     }, // Tovuq
  sub7:  { arzon: 50_000,      qimmat: 200_000     }, // O'rdak
  sub8:  { arzon: 80_000,      qimmat: 350_000     }, // G'oz
  sub67: { arzon: 4_000_000,   qimmat: 20_000_000  }, // Ho'kiz
  sub68: { arzon: 1_500_000,   qimmat: 6_000_000   }, // Buzoq
  sub69: { arzon: 3_000_000,   qimmat: 20_000_000  }, // Ot
  sub70: { arzon: 500_000,     qimmat: 3_000_000   }, // Eshak
  sub71: { arzon: 50_000,      qimmat: 300_000     }, // Kabutar
  sub72: { arzon: 20_000,      qimmat: 100_000     }, // Baliq (kg)
  // Qurilish mollari (og'ir)
  'sub2_01': { arzon: 100_000,     qimmat: 400_000     }, // Qum (tonna)
  'sub2_02': { arzon: 150_000,     qimmat: 600_000     }, // Shag'al (tonna)
  'sub2_03': { arzon: 60_000,      qimmat: 300_000     }, // Shifer (dona)
  'sub2_04': { arzon: 70_000,      qimmat: 250_000     }, // Sement (qop)
  'sub2_05': { arzon: 8_000,       qimmat: 25_000      }, // Armatura (metr)
  'sub2_06': { arzon: 800,         qimmat: 2_500       }, // Pishgan g'isht (dona)
  'sub2_07': { arzon: 6_000,       qimmat: 20_000      }, // Shlaka blok (dona)
  'sub2_08': { arzon: 12_000,      qimmat: 35_000      }, // Pena blok (dona)
  'sub2_09': { arzon: 15_000,      qimmat: 45_000      }, // Gaz blok (dona)
  'sub2_10': { arzon: 80_000,      qimmat: 300_000     }, // Reka tosh (tonna)
  'sub2_11': { arzon: 30_000,      qimmat: 120_000     }, // Pol taxta (dona)
  'sub2_12': { arzon: 15_000,      qimmat: 80_000      }, // Profillar (metr)
  'sub2_13': { arzon: 100_000,     qimmat: 1_000_000   }, // Boshqa og'ir
  // Ta'mirlash & Bezak (cat10)
  'sub10_01': { arzon: 40_000,     qimmat: 150_000     }, // Kulchatlar/plitka (kv.m)
  'sub10_02': { arzon: 60_000,     qimmat: 250_000     }, // Kraskalar (banka)
  'sub10_03': { arzon: 30_000,     qimmat: 150_000     }, // Shpagilovka (qop)
  'sub10_04': { arzon: 20_000,     qimmat: 100_000     }, // Metall quvurlar (metr)
  'sub10_05': { arzon: 10_000,     qimmat: 500_000     }, // Elektr materiallari
  'sub10_06': { arzon: 30_000,     qimmat: 500_000     }, // Santexnika
  'sub10_07': { arzon: 200_000,    qimmat: 2_000_000   }, // Oyna/eshik/deraza
  'sub10_08': { arzon: 50_000,     qimmat: 500_000     }, // Pardalar/devorqog'oz
  'sub10_09': { arzon: 50_000,     qimmat: 500_000     }, // Boshqa bezak
  // Mebel (cat12)
  'sub12_01': { arzon: 500_000,    qimmat: 5_000_000   }, // Divan/kreslo
  'sub12_02': { arzon: 800_000,    qimmat: 8_000_000   }, // Karavot/yotoq
  'sub12_03': { arzon: 400_000,    qimmat: 4_000_000   }, // Shkaf/buyum
  'sub12_04': { arzon: 200_000,    qimmat: 2_000_000   }, // Stol/stul
  'sub12_05': { arzon: 1_500_000,  qimmat: 12_000_000  }, // Oshxona garnitiri
  'sub12_06': { arzon: 300_000,    qimmat: 3_000_000   }, // Bolalar meblari
  'sub12_07': { arzon: 500_000,    qimmat: 5_000_000   }, // Ofis meblari
  'sub12_08': { arzon: 200_000,    qimmat: 3_000_000   }, // Gilamlar/to'shaklar
  'sub12_09': { arzon: 50_000,     qimmat: 1_000_000   }, // Dekorativ buyumlar
  'sub12_10': { arzon: 100_000,    qimmat: 5_000_000   }, // Boshqa mebel
  // Texnika & Elektronika (cat13)
  'sub13_01': { arzon: 1_500_000,  qimmat: 15_000_000  }, // Smartfon
  'sub13_02': { arzon: 3_000_000,  qimmat: 25_000_000  }, // Noutbuk/kompyuter
  'sub13_03': { arzon: 1_000_000,  qimmat: 8_000_000   }, // Planshet
  'sub13_04': { arzon: 1_500_000,  qimmat: 12_000_000  }, // Televizor
  'sub13_05': { arzon: 2_000_000,  qimmat: 10_000_000  }, // Muzlatgich
  'sub13_06': { arzon: 1_500_000,  qimmat: 8_000_000   }, // Kir yuvish
  'sub13_07': { arzon: 2_000_000,  qimmat: 12_000_000  }, // Konditsioner
  'sub13_08': { arzon: 300_000,    qimmat: 5_000_000   }, // Oshxona texnikasi
  'sub13_09': { arzon: 200_000,    qimmat: 5_000_000   }, // Audio/video
  'sub13_10': { arzon: 1_000_000,  qimmat: 15_000_000  }, // Fotoaparat
  'sub13_11': { arzon: 2_000_000,  qimmat: 15_000_000  }, // O'yin konsoli
  'sub13_12': { arzon: 50_000,     qimmat: 1_000_000   }, // Aksessuarlar
  'sub13_13': { arzon: 100_000,    qimmat: 5_000_000   }, // Boshqa texnika
  // Ayrboshlash (cat14)
  'sub14_01': { arzon: 20_000_000, qimmat: 300_000_000 }, // Avtomobil ayrbosh
  'sub14_02': { arzon: 50_000_000, qimmat: 500_000_000 }, // Ko'chmas mulk
  'sub14_03': { arzon: 500_000,    qimmat: 20_000_000  }, // Texnika ayrbosh
  'sub14_04': { arzon: 1_000_000,  qimmat: 30_000_000  }, // Chorva ayrbosh
  'sub14_05': { arzon: 200_000,    qimmat: 10_000_000  }, // Mebel ayrbosh
  'sub14_06': { arzon: 500_000,    qimmat: 20_000_000  }, // Qurilish mat.
  'sub14_07': { arzon: 100_000,    qimmat: 50_000_000  }, // Boshqa ayrbosh
  // Ovchilik & Baliqchilik (cat11)
  'sub11_01': { arzon: 500_000,    qimmat: 5_000_000   }, // Miltiq/yarog'
  'sub11_02': { arzon: 100_000,    qimmat: 800_000     }, // Kamon
  'sub11_03': { arzon: 20_000,     qimmat: 200_000     }, // Tuzoq/tor
  'sub11_04': { arzon: 80_000,     qimmat: 500_000     }, // Ovchilik kiyimlari
  'sub11_05': { arzon: 50_000,     qimmat: 1_000_000   }, // Ovchilik jihozlari
  'sub11_06': { arzon: 30_000,     qimmat: 500_000     }, // Baliq qarmoqlari
  'sub11_07': { arzon: 500_000,    qimmat: 5_000_000   }, // Baliq qayiqlari
  'sub11_08': { arzon: 5_000,      qimmat: 50_000      }, // Yem/jig'a
  'sub11_09': { arzon: 30_000,     qimmat: 500_000     }, // Boshqa ovchilik
  // Transport & Texnika
  'sub3_01': { arzon: 60_000_000,  qimmat: 200_000_000 }, // Engil avtomobil
  'sub3_02': { arzon: 80_000_000,  qimmat: 250_000_000 }, // Mikroavtobus
  'sub3_03': { arzon: 100_000_000, qimmat: 400_000_000 }, // Avtobus
  'sub3_04': { arzon: 60_000_000,  qimmat: 200_000_000 }, // Gazel
  'sub3_05': { arzon: 150_000_000, qimmat: 600_000_000 }, // Katta yuk
  'sub3_06': { arzon: 200_000_000, qimmat: 800_000_000 }, // Fura
  'sub3_07': { arzon: 100_000_000, qimmat: 400_000_000 }, // Samosval
  'sub3_08': { arzon: 20_000_000,  qimmat: 80_000_000  }, // Muravey
  'sub3_09': { arzon: 80_000_000,  qimmat: 300_000_000 }, // Traktor
  'sub3_10': { arzon: 150_000_000, qimmat: 600_000_000 }, // Kombain
  'sub3_11': { arzon: 200_000_000, qimmat: 900_000_000 }, // Ekskavator
  'sub3_12': { arzon: 200_000_000, qimmat: 900_000_000 }, // Buldozer
  'sub3_13': { arzon: 300_000_000, qimmat: 1_200_000_000 }, // Kran
  'sub3_14': { arzon: 150_000_000, qimmat: 600_000_000 }, // Pograchik
  'sub3_15': { arzon: 100_000_000, qimmat: 500_000_000 }, // Boshqa spes
  'sub3_16': { arzon: 10_000_000,  qimmat: 50_000_000  }, // Mototsikl
  'sub3_17': { arzon: 5_000_000,   qimmat: 25_000_000  }, // Skuter
  'sub3_18': { arzon: 1_000_000,   qimmat: 8_000_000   }, // Velosiped/E-bike
  'sub3_19': { arzon: 10_000_000,  qimmat: 100_000_000 }, // Boshqa transport
  // Eski (backward compat)
  sub23: { arzon: 30_000_000,  qimmat: 150_000_000 }, // (eski) Avtomobil
  sub24: { arzon: 40_000_000,  qimmat: 200_000_000 }, // (eski) Traktor
  sub25: { arzon: 60_000_000,  qimmat: 300_000_000 }, // (eski) Kombain
  sub26: { arzon: 3_000_000,   qimmat: 15_000_000  }, // (eski) Skuter
  sub27: { arzon: 8_000_000,   qimmat: 40_000_000  }, // (eski) Muravey
  sub28: { arzon: 500_000,     qimmat: 4_000_000   }, // (eski) Velosiped
  sub29: { arzon: 100_000,     qimmat: 500_000     }, // (eski) Maxsus texnika
  // Ehtiyot zapchastlar
  sub30: { arzon: 200_000,     qimmat: 3_000_000   }, // Traktor zapchast
  sub31: { arzon: 100_000,     qimmat: 2_000_000   }, // Avto zapchast
  sub34: { arzon: 50_000,      qimmat: 800_000     }, // Skuter/moto
  // Qishloq xo'jaligi
  sub36: { arzon: 50_000,      qimmat: 500_000     }, // Urug'
  sub37: { arzon: 100_000,     qimmat: 1_000_000   }, // O'g'it
  sub38: { arzon: 20_000,      qimmat: 200_000     }, // Sabzavot/meva (kg)
  sub39: { arzon: 50_000,      qimmat: 500_000     }, // Don/em-xashak
  sub40: { arzon: 100_000,     qimmat: 800_000     }, // Asalari mahsulotlari
  sub73: { arzon: 3_000,       qimmat: 15_000      }, // Paxta (kg)
  sub74: { arzon: 2_000,       qimmat: 10_000      }, // Kartoshka (kg)
  sub75: { arzon: 1_500,       qimmat: 8_000       }, // Piyoz (kg)
  sub76: { arzon: 1_000,       qimmat: 5_000       }, // Makkajo'xori (kg)
  // Uy-joy (sotish)
  sub55: { arzon: 100_000_000, qimmat: 500_000_000 }, // Hovli
  sub56: { arzon: 80_000_000,  qimmat: 300_000_000 }, // Kvartira sotiladi
  sub57: { arzon: 20_000_000,  qimmat: 150_000_000 }, // Uchastka
  sub58: { arzon: 1_000_000,   qimmat: 5_000_000   }, // Uy ijarasi (oylik)
  sub59: { arzon: 800_000,     qimmat: 4_000_000   }, // Kvartira ijarasi (oylik)
  sub80: { arzon: 5_000_000,   qimmat: 30_000_000  }, // Magazin/do'kon
  sub81: { arzon: 3_000_000,   qimmat: 20_000_000  }, // Ombor
  sub82: { arzon: 2_000_000,   qimmat: 15_000_000  }, // Garaj
  // Maxsus xizmatlar (soat/kun narxi)
  sub48: { arzon: 300_000,     qimmat: 1_500_000   }, // Agro dron xizmati
  sub49: { arzon: 500_000,     qimmat: 2_000_000   }, // Ekskavator xizmati
  sub50: { arzon: 200_000,     qimmat: 1_000_000   }, // Traktor xizmati
};

const DEFAULT_THRESHOLD = { arzon: 500_000, qimmat: 5_000_000 };

export function getPriceColor(subcategoryId: string | null, price: number): 'green' | 'yellow' | 'red' {
  if (price <= 0) return 'green';
  const th = subcategoryId ? (PRICE_THRESHOLDS[subcategoryId] ?? DEFAULT_THRESHOLD) : DEFAULT_THRESHOLD;
  if (price <= th.arzon) return 'green';
  if (price <= th.qimmat) return 'yellow';
  return 'red';
}

export function sanitizeUser(user: StoredUser) {
  const { password: _pw, ...rest } = user;
  const region = regions.find(r => r.id === user.regionId) || null;
  const district = districts.find(d => d.id === user.districtId) || null;
  const neighborhood = neighborhoods.find(n => n.id === user.neighborhoodId) || null;
  return { ...rest, region, district, neighborhood };
}
