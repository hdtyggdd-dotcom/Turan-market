import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Turan Market - AI Marketplace",
  description: "AI-powered marketplace for Central Asia - Uzbekistan, Turkmenistan, Kyrgyzstan",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body>
        {/* HEADER */}
        <header className="bg-white shadow-md sticky top-0 z-50">
          <div className="container-max py-4 flex justify-between items-center">
            {/* LOGO */}
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold">
              <span className="text-3xl">🌍</span>
              <span className="text-blue-600">Turan Market</span>
            </Link>

            {/* NAV LINKS */}
            <nav className="hidden md:flex gap-6">
              <Link href="/" className="hover:text-blue-600 transition">
                Asosiy
              </Link>
              <Link href="/marketplace" className="hover:text-blue-600 transition">
                🛒 Bozor
              </Link>
              <Link href="/seller/register" className="hover:text-blue-600 transition">
                🏪 Do'kon Ochish
              </Link>
            </nav>

            {/* CTA BUTTONS */}
            <div className="flex gap-3">
              <Link
                href="/login"
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
              >
                Kirish
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Ro'yxatdan O'tish
              </Link>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main>{children}</main>

        {/* FOOTER */}
        <footer className="bg-gray-900 text-white py-12 mt-20">
          <div className="container-max">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              {/* About */}
              <div>
                <h3 className="font-bold text-lg mb-4">Turan Market</h3>
                <p className="text-gray-400 text-sm">
                  Markaziy Osiyo'ning eng yaxshi AI-powered marketplace. Sotib ol, sotin, almash!
                </p>
              </div>

              {/* Links */}
              <div>
                <h4 className="font-bold mb-4">Links</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>
                    <Link href="/marketplace" className="hover:text-white transition">
                      Bozor
                    </Link>
                  </li>
                  <li>
                    <Link href="/seller/register" className="hover:text-white transition">
                      Sotuvchi Bo'l
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin" className="hover:text-white transition">
                      Admin
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h4 className="font-bold mb-4">Support</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>
                    <a href="mailto:hdtyggdd@gmail.com" className="hover:text-white transition">
                      Email
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition">
                      FAQ
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition">
                      Terms
                    </a>
                  </li>
                </ul>
              </div>

              {/* Social */}
              <div>
                <h4 className="font-bold mb-4">Ijtimoiy</h4>
                <div className="flex gap-4 text-2xl">
                  <a href="#" className="hover:text-blue-400 transition">📱</a>
                  <a href="#" className="hover:text-blue-400 transition">💬</a>
                  <a href="#" className="hover:text-blue-400 transition">🔗</a>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
              <p>&copy; 2024 Turan Market. Barcha huquqlar himoyalangan.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
