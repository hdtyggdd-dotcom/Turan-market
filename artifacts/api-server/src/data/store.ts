// O'Savdo in-memory store with full Uzbekistan seed data

export interface StoredRegion {
  id: string;
  name: string;
  nameRu: string;
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

// ─── REGIONS ──────────────────────────────────────────────────────────────────
export const regions: StoredRegion[] = [
  { id: 'r1', name: "Toshkent shahri", nameRu: "Ташкент (город)", lat: 41.2995, lng: 69.2401 },
  { id: 'r2', name: "Toshkent viloyati", nameRu: "Ташкентская область", lat: 41.1145, lng: 69.2900 },
  { id: 'r3', name: "Andijon", nameRu: "Андижанская", lat: 40.7821, lng: 72.3442 },
  { id: 'r4', name: "Farg'ona", nameRu: "Ферганская", lat: 40.3834, lng: 71.7855 },
  { id: 'r5', name: "Namangan", nameRu: "Наманганская", lat: 41.0011, lng: 71.6683 },
  { id: 'r6', name: "Samarqand", nameRu: "Самаркандская", lat: 39.6542, lng: 66.9597 },
  { id: 'r7', name: "Buxoro", nameRu: "Бухарская", lat: 39.7681, lng: 64.4556 },
  { id: 'r8', name: "Navoiy", nameRu: "Навоийская", lat: 40.1000, lng: 65.3790 },
  { id: 'r9', name: "Qashqadaryo", nameRu: "Кашкадарьинская", lat: 38.8671, lng: 65.7917 },
  { id: 'r10', name: "Surxondaryo", nameRu: "Сурхандарьинская", lat: 37.9402, lng: 67.5601 },
  { id: 'r11', name: "Jizzax", nameRu: "Джизакская", lat: 40.1158, lng: 67.8422 },
  { id: 'r12', name: "Sirdaryo", nameRu: "Сырдарьинская", lat: 40.8376, lng: 68.6632 },
  { id: 'r13', name: "Xorazm", nameRu: "Хорезмская", lat: 41.5500, lng: 60.6167 },
  { id: 'r14', name: "Qoraqalpog'iston", nameRu: "Каракалпакстан", lat: 43.7681, lng: 59.0400 },
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
      // --- Og'ir qurilish materiallari ---
      { id: 'sub2_01', name: "Qum",                       nameRu: "Песок",                    categoryId: 'cat2' },
      { id: 'sub2_02', name: "Shag'al (shlak)",           nameRu: "Щебень / Шлак",            categoryId: 'cat2' },
      { id: 'sub2_03', name: "Shifer",                    nameRu: "Шифер",                    categoryId: 'cat2' },
      { id: 'sub2_04', name: "Shpagilovka",               nameRu: "Шпаклёвка",                categoryId: 'cat2' },
      { id: 'sub2_05', name: "Sement",                    nameRu: "Цемент",                   categoryId: 'cat2' },
      { id: 'sub2_06', name: "Armatura",                  nameRu: "Арматура",                 categoryId: 'cat2' },
      { id: 'sub2_07', name: "Pishgan g'isht",            nameRu: "Обожжённый кирпич",        categoryId: 'cat2' },
      { id: 'sub2_08', name: "Shlaka blok",               nameRu: "Шлакоблок",                categoryId: 'cat2' },
      { id: 'sub2_09', name: "Pena blok",                 nameRu: "Пеноблок",                 categoryId: 'cat2' },
      { id: 'sub2_10', name: "Gaz blok",                  nameRu: "Газоблок",                 categoryId: 'cat2' },
      { id: 'sub2_11', name: "Reka tosh",                 nameRu: "Речной камень",            categoryId: 'cat2' },
      { id: 'sub2_12', name: "Pol taxta",                 nameRu: "Напольная доска",          categoryId: 'cat2' },
      { id: 'sub2_13', name: "Profillar (har xil razmer)", nameRu: "Профили (разные размеры)", categoryId: 'cat2' },
      { id: 'sub2_14', name: "Boshqa og'ir materiallar",  nameRu: "Прочие тяжёлые материалы", categoryId: 'cat2' },
      // --- Yengil qurilish mahsulotlari ---
      { id: 'sub2_15', name: "Kraskalar",                 nameRu: "Краски",                   categoryId: 'cat2' },
      { id: 'sub2_16', name: "Metall quvurlar (MQ)",      nameRu: "Металлические трубы",      categoryId: 'cat2' },
      { id: 'sub2_17', name: "Boshqa yengil materiallar", nameRu: "Прочие лёгкие материалы",  categoryId: 'cat2' },
    ],
  },
  {
    id: 'cat3',
    name: "Transport & Texnika",
    nameRu: "Транспорт и техника",
    icon: "🚗",
    subcategories: [
      { id: 'sub23', name: "Avtomobil",          nameRu: "Автомобиль",          categoryId: 'cat3' },
      { id: 'sub24', name: "Traktor",            nameRu: "Трактор",             categoryId: 'cat3' },
      { id: 'sub25', name: "Kombain",            nameRu: "Комбайн",             categoryId: 'cat3' },
      { id: 'sub26', name: "Skuter",             nameRu: "Скутер",              categoryId: 'cat3' },
      { id: 'sub27', name: "Muravey",            nameRu: "Муравей",             categoryId: 'cat3' },
      { id: 'sub28', name: "Velosiped",          nameRu: "Велосипед",           categoryId: 'cat3' },
      { id: 'sub29', name: "Maxsus texnika",     nameRu: "Спецтехника",         categoryId: 'cat3', bookingMode: 'full' },
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
    subcategoryId: 'sub13', // G'isht
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
    subcategoryId: 'sub15', // Sement
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
    subcategoryId: 'sub48', // Texnika ijarasi
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
    subcategoryId: 'sub12', // Armatura
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
    subcategoryId: 'sub48', // Texnika ijarasi (agro dron)
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
    subcategoryId: 'sub16', // Shifer
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
    subcategoryId: 'sub40', // Asalari mahsulotlari
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
    categoryId: 'cat2',
    subcategoryId: 'sub22', // Boshqa qurilish
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
  // Qurilish mollari
  sub12: { arzon: 800_000,     qimmat: 8_000_000   }, // Armatura
  sub13: { arzon: 500_000,     qimmat: 3_000_000   }, // G'isht
  sub14: { arzon: 200_000,     qimmat: 1_500_000   }, // Shpagilovka
  sub15: { arzon: 250_000,     qimmat: 1_500_000   }, // Sement
  sub16: { arzon: 150_000,     qimmat: 800_000     }, // Shifer
  sub17: { arzon: 200_000,     qimmat: 1_200_000   }, // Reka tosh
  sub18: { arzon: 400_000,     qimmat: 4_000_000   }, // Pol taxta
  sub19: { arzon: 500_000,     qimmat: 5_000_000   }, // Mis
  sub20: { arzon: 200_000,     qimmat: 1_500_000   }, // Qum va shag'al
  sub21: { arzon: 100_000,     qimmat: 600_000     }, // Ohak
  // Transport & Texnika
  sub23: { arzon: 30_000_000,  qimmat: 150_000_000 }, // Avtomobil
  sub24: { arzon: 40_000_000,  qimmat: 200_000_000 }, // Traktor
  sub25: { arzon: 60_000_000,  qimmat: 300_000_000 }, // Kombain
  sub26: { arzon: 3_000_000,   qimmat: 15_000_000  }, // Skuter
  sub27: { arzon: 8_000_000,   qimmat: 40_000_000  }, // Muravey
  sub28: { arzon: 500_000,     qimmat: 4_000_000   }, // Velosiped
  sub29: { arzon: 100_000,     qimmat: 500_000     }, // Maxsus texnika (soat narxi)
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
