import type { StoredDistrict, StoredRegion } from "./store.js";

// Coverage: SIAT 307 (2026), plus Namangan city's two constituent districts.
// https://api.siat.stat.uz/media/uploads/sdmx/sdmx_data_307.csv
// Coordinates, when available, are approximate GeoNames administrative points,
// NOT borders or customer addresses. Missing points stay null, never invented.
// https://download.geonames.org/export/dump/UZ.zip (CC BY 4.0)
export const additionalUzbekistanDistricts: StoredDistrict[] = [
  { id: "uz_1726292", name: "Yangihayot tumani", nameRu: "Янгихаётский район", regionId: "r1", lat: null, lng: null },
  { id: "uz_1727401", name: "Nurafshon shahri", nameRu: "Город Нурафшон", regionId: "r2", lat: 41.0321, lng: 69.36253 },
  { id: "uz_1727206", name: "Oqqo'rg'on tumani", nameRu: "Аккурганский район", regionId: "r2", lat: 40.9, lng: 69.08333 },
  { id: "uz_1727212", name: "Ohangaron tumani", nameRu: "Ахангаранский район", regionId: "r2", lat: 41, lng: 70 },
  { id: "uz_1727220", name: "Bekobod tumani", nameRu: "Бекабадский район", regionId: "r2", lat: 40.41667, lng: 69.16667 },
  { id: "uz_1727239", name: "Yuqorichirchiq tumani", nameRu: "Юкоричирчикский район", regionId: "r2", lat: 41.25, lng: 69.524 },
  { id: "uz_1727259", name: "Yangiyo'l tumani", nameRu: "Янгиюльский район", regionId: "r2", lat: 41.16667, lng: 69 },
  { id: "uz_1727265", name: "Toshkent tumani", nameRu: "Ташкентский район", regionId: "r2", lat: 41.4, lng: 69.2 },
  { id: "uz_1703408", name: "Xonobod shahri", nameRu: "Город Ханабад", regionId: "r3", lat: 40.79762, lng: 73.00466 },
  { id: "uz_1703203", name: "Andijon tumani", nameRu: "Андижанский район", regionId: "r3", lat: 40.8, lng: 72.41667 },
  { id: "uz_1703220", name: "Qo'rg'ontepa tumani", nameRu: "Кургантепинский район", regionId: "r3", lat: 40.75, lng: 72.83333 },
  { id: "uz_1730408", name: "Quvasoy shahri", nameRu: "Город Кувасай", regionId: "r4", lat: 40.30787, lng: 71.9697 },
  { id: "uz_1730230", name: "O'zbekiston tumani", nameRu: "Узбекистанский район", regionId: "r4", lat: 40.33333, lng: 70.83333 },
  { id: "uz_1730233", name: "Farg'ona tumani", nameRu: "Ферганский район", regionId: "r4", lat: 40.25003, lng: 71.75003 },
  { id: "uz_1714212", name: "Namangan tumani", nameRu: "Наманганский район", regionId: "r5", lat: 40.92007, lng: 71.64717 },
  { id: "uz_davlatobod", name: "Davlatobod tumani", nameRu: "Давлатабадский район", regionId: "r5", lat: null, lng: null },
  { id: "uz_yangi-namangan", name: "Yangi Namangan tumani", nameRu: "Янги-Наманганский район", regionId: "r5", lat: null, lng: null },
  { id: "uz_1718215", name: "Kattaqo'rg'on tumani", nameRu: "Каттакурганский район", regionId: "r6", lat: 39.95, lng: 66.3 },
  { id: "uz_1718233", name: "Samarqand tumani", nameRu: "Самаркандский район", regionId: "r6", lat: 39.58333, lng: 66.91667 },
  { id: "uz_1706207", name: "Buxoro tumani", nameRu: "Бухарский район", regionId: "r7", lat: 39.53542, lng: 64.39921 },
  { id: "uz_1706219", name: "Kogon tumani", nameRu: "Каганский район", regionId: "r7", lat: 39.736, lng: 64.586 },
  { id: "uz_1712412", name: "G'ozg'on shahri", nameRu: "Город Газган", regionId: "r8", lat: 40.59078, lng: 65.49466 },
  { id: "uz_1712244", name: "Tomdi tumani", nameRu: "Тамдынский район", regionId: "r8", lat: 42.22496, lng: 65.2346 },
  { id: "uz_1712248", name: "Uchquduq tumani", nameRu: "Учкудукский район", regionId: "r8", lat: 42.13693, lng: 63.56827 },
  { id: "uz_1710240", name: "Ko'kdala tumani", nameRu: "Кукдалинский район", regionId: "r9", lat: null, lng: null },
  { id: "uz_1710224", name: "Qarshi tumani", nameRu: "Каршинский район", regionId: "r9", lat: 38.82798, lng: 65.87618 },
  { id: "uz_1710245", name: "Shahrisabz tumani", nameRu: "Шахрисабзский район", regionId: "r9", lat: 39, lng: 67.16667 },
  { id: "uz_1722220", name: "Termiz tumani", nameRu: "Термезский район", regionId: "r10", lat: 37.31667, lng: 67.5 },
  { id: "uz_1722226", name: "Sho'rchi tumani", nameRu: "Шурчинский район", regionId: "r10", lat: 38, lng: 67.83333 },
  { id: "uz_1708220", name: "Zarbdor tumani", nameRu: "Зарбдарский район", regionId: "r11", lat: 40.16667, lng: 68.16667 },
  { id: "uz_1724410", name: "Shirin shahri", nameRu: "Город Ширин", regionId: "r12", lat: 40.23333, lng: 69.12 },
  { id: "uz_1724220", name: "Guliston tumani", nameRu: "Гулистанский район", regionId: "r12", lat: 40.5, lng: 68.91667 },
  { id: "uz_1724231", name: "Sirdaryo tumani", nameRu: "Сырдарьинский район", regionId: "r12", lat: 40.83333, lng: 68.66667 },
  { id: "uz_1733217", name: "Urganch tumani", nameRu: "Ургенчский район", regionId: "r13", lat: 41.51269, lng: 60.52917 },
  { id: "uz_1733226", name: "Xiva tumani", nameRu: "Хивинский район", regionId: "r13", lat: 41.33333, lng: 60.41667 },
  { id: "uz_1735225", name: "Nukus tumani", nameRu: "Нукусский район", regionId: "r14", lat: 42.48043, lng: 59.69085 },
  { id: "uz_1735228", name: "Taxiatosh tumani", nameRu: "Тахиаташский район", regionId: "r14", lat: 42.3425, lng: 59.56995 },
];

const cityIds = new Set([
  "d6", "d7", "d8", "d9", "d10", "d112", "d11", "d15", "d16",
  "d17", "d19", "d22", "d23", "d25", "d27", "d28", "d29", "d30",
  "d31", "d32", "d34", "d36", "d37", "d38", "d39", "d40",
]);
const correctedNames: Record<string, string> = {
  d8: "Olmaliq", d9: "Bekobod", d103: "Olmazor", d117: "Bo'ston",
  d122: "Oltinko'l", d203: "Sharof Rashidov", d204: "Oqoltin", d40: "Nukus",
};

// Resolve a duplicate without deleting the historical ID or rewriting records.
export function canonicalDistrictId(id: string): string {
  return id === "d204" ? "d207" : id;
}

export function completeUzbekistanLocations(regions: StoredRegion[], districts: StoredDistrict[]): void {
  const uzRegions = regions.filter(region => region.countryId === "uz");
  const ids = new Set(uzRegions.map(region => region.id));
  for (const region of uzRegions) {
    if (region.id === "r14") region.name = "Qoraqalpog'iston Respublikasi";
    else if (region.id !== "r1" && !region.name.endsWith("viloyati")) region.name += " viloyati";
  }
  for (const district of districts) {
    if (!ids.has(district.regionId)) continue;
    if (district.id === "d192") {
      // Unknown old choice: retain its identity, never reinterpret as Sho'rchi.
      district.selectable = false;
      continue;
    }
    const base = correctedNames[district.id] ?? district.name.replace(/ (shahar|shahri|tumani)$/, "");
    district.name = `${base} ${cityIds.has(district.id) ? "shahri" : "tumani"}`;
    if (district.id === "d117") district.nameRu = "Бустанский район";
    else if (district.id === "d203") district.nameRu = "Шароф-Рашидовский район";
    else if (district.id === "d139") district.nameRu = "Чустский район";
    else {
      const ru = district.nameRu.replace(/ \(город\)$| район$/, "");
      district.nameRu = `${ru}${cityIds.has(district.id) ? " (город)" : " район"}`;
    }
    if (district.id === "d204") district.selectable = false;
  }
  const oldOqoltin = districts.find(district => district.id === "d204");
  const oqoltin = districts.find(district => district.id === "d207");
  if (oldOqoltin && oqoltin) {
    oldOqoltin.lat = oqoltin.lat;
    oldOqoltin.lng = oqoltin.lng;
  }
  for (const addition of additionalUzbekistanDistricts) {
    if (!districts.some(district => district.id === addition.id)) districts.push({ ...addition });
  }
}
