export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const listings = [
    {
      id: "1",
      title: "Toyota Camry 2015",
      category: "Transport",
      price: 15000,
      image: "🚗",
      seller: "Alisher Auto",
      location: "Tashkent",
      date: "2024-09-05",
      condition: "ishlatilgan",
    },
    {
      id: "2",
      title: "Paxta urug'i 100kg",
      category: "Qishloq xo'jaligi",
      price: 5000,
      image: "🌾",
      seller: "Fergona Farm",
      location: "Fergona",
      date: "2024-09-04",
      condition: "yangi",
    },
  ];

  const filtered = category
    ? listings.filter((l) => l.category.toLowerCase() === category.toLowerCase())
    : listings;

  return Response.json({ success: true, data: filtered });
}

export async function POST(request: Request) {
  const body = await request.json();

  // TODO: Save to database
  const newListing = {
    id: Math.random().toString(),
    ...body,
    createdAt: new Date(),
  };

  return Response.json({ success: true, data: newListing });
}
