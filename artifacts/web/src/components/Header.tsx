import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container-max py-4 flex justify-between items-center">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold">
          <span className="text-3xl">🌍</span>
          <span className="text-blue-600">Turan</span>
        </Link>

        {/* NAV */}
        <nav className="hidden md:flex gap-6">
          <Link href="/" className="hover:text-blue-600 transition">
            Home
          </Link>
          <Link href="/marketplace" className="hover:text-blue-600 transition">
            Marketplace
          </Link>
          <Link href="/seller/register" className="hover:text-blue-600 transition">
            Become Seller
          </Link>
        </nav>

        {/* BUTTONS */}
        <div className="flex gap-2">
          <Link href="/login" className="btn-outline px-4 py-2">
            Login
          </Link>
          <Link href="/signup" className="btn-primary px-4 py-2">
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}
