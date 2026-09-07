export async function GET() {
  const categories = [
    {
      id: 1,
      name: "Transport",
      icon: "🚗",
      subcategories: [
        { id: 11, name: "Cars", count: 234 },
        { id: 12, name: "Motorcycles", count: 89 },
        { id: 13, name: "Spare Parts", count: 456 },
      ],
    },
    {
      id: 2,
      name: "Qishloq xo'jaligi",
      icon: "🌾",
      subcategories: [
        { id: 21, name: "Seeds", count: 123 },
        { id: 22, name: "Crops", count: 45 },
        { id: 23, name: "Equipment", count: 78 },
      ],
    },
    {
      id: 3,
      name: "Chorva",
      icon: "🐄",
      subcategories: [
        { id: 31, name: "Cattle", count: 56 },
        { id: 32, name: "Sheep", count: 34 },
        { id: 33, name: "Poultry", count: 89 },
      ],
    },
  ];

  return Response.json({ success: true, data: categories });
}
