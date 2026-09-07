import Link from "next/link";

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  seller: string;
  location: string;
  condition: "yangi" | "ishlatilgan";
  date: string;
}

export default function ListingCard({
  id,
  title,
  price,
  image,
  seller,
  location,
  condition,
  date,
}: ListingCardProps) {
  return (
    <Link href={`/marketplace/${id}`}>
      <div className="card hover:shadow-xl transition cursor-pointer">
        {/* Image */}
        <div className="bg-gradient-to-br from-blue-400 to-blue-600 h-48 rounded-lg flex items-center justify-center mb-4">
          <div className="text-6xl">{image}</div>
        </div>

        {/* Content */}
        <h3 className="font-bold text-lg mb-2 truncate">{title}</h3>

        {/* Price */}
        <div className="text-2xl font-bold text-blue-600 mb-3">
          ${price.toLocaleString()}
        </div>

        {/* Meta */}
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <p>📍 {location}</p>
          <p>👤 {seller}</p>
          <p>📅 {new Date(date).toLocaleDateString("uz-UZ")}</p>
        </div>

        {/* Condition Badge */}
        <span
          className={`badge ${
            condition === "yangi"
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {condition === "yangi" ? "✨ Yangi" : "♻️ Ishlatilgan"}
        </span>
      </div>
    </Link>
  );
}
