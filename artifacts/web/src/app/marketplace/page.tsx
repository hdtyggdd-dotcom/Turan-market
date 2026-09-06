"use client";

import { useState } from "react";
import Link from "next/link";

interface Listing {
  id: string;
  title: string;
  category: string;
  price: number;
  image: string;
  seller: string;
  location: string;
  date: string;
  condition: "yangi" | "ishlatilgan";
}

const MOCK_LISTINGS: Listing[] = [
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
  {
    id: "3",
    title: "Qoramol (30 ta)",
    category: "Chorva",
    price: 45000,
    image: "🐄",
    seller: "Qishloq Xo'jaligi LLC",
    location: "Samarkand",
    date: "2024-09-03",
    condition: "yangi",
  },
  {
    id: "4",
    title: "CNC Stanok (2023)",
    category: "Sanoat",
    price: 120000,
    image: "🏭",
    seller: "Industrial Solutions",
    location: "Tashkent",
    date: "2024-09-02",
    condition: "yangi",
  },
];

export default function Marketplace() {
  const [listings, setListings] = useState<Listing[]>(MOCK_LISTINGS);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredListings =
    selectedCategory === "all"
      ? listings
      : listings.filter((l) => l.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-max">
        {/* HEADER */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">🛒 Bozor</h1>
          <p className="text-xl text-gray-600">
            O'zbekiston va Markaziy Osiyo'dan mahsulotlar
          </p>
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">🔍 Filtrlar</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "all", label: "Barcha" },
              { value: "Transport", label: "🚗 Transport" },
              { value: "Qishloq xo'jaligi", label: "🌾 Qishloq xo'jaligi" },
              { value: "Chorva", label: "🐄 Chorva" },
              { value: "Sanoat", label: "🏭 Sanoat" },
              { value: "Ko'chmas mulk", label: "🏠 Ko'chmas mulk" },
            ].map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-lg transition font-semibold ${
                  selectedCategory === cat.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* LISTINGS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredListings.map((listing) => (
            <Link
              key={listing.id}
              href={`/marketplace/${listing.id}`}
              className="card hover:shadow-xl transition cursor-pointer"
            >
              {/* Image */}
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 h-48 rounded-lg flex items-center justify-center mb-4">
                <div className="text-6xl">{listing.image}</div>
              </div>

              {/* Content */}
              <div>
                <h3 className="font-bold text-lg mb-2 truncate">{listing.title}</h3>

                {/* Price */}
                <div className="text-2xl font-bold text-blue-600 mb-3">
                  ${listing.price.toLocaleString()}
                </div>

                {/* Meta */}
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p>📍 {listing.location}</p>
                  <p>👤 {listing.seller}</p>
                  <p>📅 {new Date(listing.date).toLocaleDateString("uz-UZ")}</p>
                </div>

                {/* Condition Badge */}
                <div className="flex gap-2">
                  <span
                    className={`badge ${
                      listing.condition === "yangi"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {listing.condition === "yangi" ? "✨ Yangi" : "♻️ Ishlatilgan"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* EMPTY STATE */}
        {filteredListings.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold mb-2">E'lon topilmadi</h3>
            <p className="text-gray-600">Bu kategoriyadagi e'lonlar hozir mavjud emas</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 text-center bg-blue-50 rounded-lg p-12">
          <h2 className="text-3xl font-bold mb-4">📤 O'zingizning e'lonini joylashtiring</h2>
          <p className="text-lg text-gray-600 mb-6">
            Rasm yukla, AI tayyorlasin, sotuvni boshlang!
          </p>
          <Link href="/seller/create-listing" className="btn-primary">
            ➕ E'lon Yaratish
          </Link>
        </div>
      </div>
    </div>
  );
}
