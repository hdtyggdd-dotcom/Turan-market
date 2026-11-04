import { categories, type StoredCategory } from "../data/store.js";

export const sportsFitnessCategory: StoredCategory = {
  id: "cat22",
  name: "Sport va fitnes jihozlari",
  nameRu: "Спортивные и фитнес-товары",
  icon: "🏋️",
  subcategories: [
    { id: "sub22_01", name: "Trenajyor va kardio jihozlari", nameRu: "Тренажёры и кардио", categoryId: "cat22" },
    { id: "sub22_02", name: "Og'ir atletika jihozlari", nameRu: "Тяжёлая атлетика", categoryId: "cat22" },
    { id: "sub22_03", name: "Gantellar va shtangalar", nameRu: "Гантели и штанги", categoryId: "cat22" },
    { id: "sub22_04", name: "Girya va kuch mashqlari jihozlari", nameRu: "Гири и силовые тренажёры", categoryId: "cat22" },
    { id: "sub22_05", name: "Yoga va pilates jihozlari", nameRu: "Йога и пилатес", categoryId: "cat22" },
    { id: "sub22_06", name: "Matlar va balans jihozlari", nameRu: "Коврики и балансировочное оборудование", categoryId: "cat22" },
    { id: "sub22_07", name: "Futbol jihozlari", nameRu: "Футбольные товары", categoryId: "cat22" },
    { id: "sub22_08", name: "Basketbol va voleybol jihozlari", nameRu: "Баскетбол и волейбол", categoryId: "cat22" },
    { id: "sub22_09", name: "Tennis, badminton va squash", nameRu: "Теннис, бадминтон и сквош", categoryId: "cat22" },
    { id: "sub22_10", name: "Boks va jang san'ati jihozlari", nameRu: "Бокс и единоборства", categoryId: "cat22" },
    { id: "sub22_11", name: "Velosiped va velosport", nameRu: "Велосипеды и велоспорт", categoryId: "cat22" },
    { id: "sub22_12", name: "Skeytbord, rolik va skuterlar", nameRu: "Скейтборды, ролики и самокаты", categoryId: "cat22" },
    { id: "sub22_13", name: "Suzish va suv sporti", nameRu: "Плавание и водный спорт", categoryId: "cat22" },
    { id: "sub22_14", name: "Yugurish va trekking jihozlari", nameRu: "Бег и треккинг", categoryId: "cat22" },
    { id: "sub22_15", name: "Sport kiyimlari va poyabzallari", nameRu: "Спортивная одежда и обувь", categoryId: "cat22" },
    { id: "sub22_16", name: "Sport sumkalari va himoya vositalari", nameRu: "Спортивные сумки и защита", categoryId: "cat22" },
    { id: "sub22_17", name: "Sport soatlari va elektronika", nameRu: "Спортивные часы и электроника", categoryId: "cat22" },
    { id: "sub22_18", name: "Boshqa sport va fitnes jihozlari", nameRu: "Другие спортивные и фитнес-товары", categoryId: "cat22" },
  ],
};

/** Adds the category once so repeated module setup remains safe. */
export function registerSportsFitnessCategory(): void {
  if (!categories.some((category) => category.id === sportsFitnessCategory.id)) {
    categories.push(sportsFitnessCategory);
  }
}
