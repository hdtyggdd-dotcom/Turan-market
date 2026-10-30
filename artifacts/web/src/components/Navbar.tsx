"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-blue-600">🌍 Turan</div>
            <div className="text-xl font-semibold text-gray-800">Market</div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/#features"
              className="text-gray-700 hover:text-blue-600 transition"
            >
              Xususiyatlar
            </Link>
            <Link
              href="/marketplace"
              className="text-gray-700 hover:text-blue-600 transition"
            >
              Bozor
            </Link>
            <Link
              href="/#categories"
              className="text-gray-700 hover:text-blue-600 transition"
            >
              Kategoriyalar
            </Link>
            <Link
              href="/docs"
              className="text-gray-700 hover:text-blue-600 transition"
            >
              API Docs
            </Link>
            <Link
              href="/auth/login"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Kirish
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link
              href="/#features"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              Xususiyatlar
            </Link>
            <Link
              href="/marketplace"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              Bozor
            </Link>
            <Link
              href="/#categories"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              Kategoriyalar
            </Link>
            <Link
              href="/docs"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              API Docs
            </Link>
            <Link
              href="/auth/login"
              className="block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Kirish
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
