import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Turan Market — O'zbekiston & Markaziy Osiyo Marketplace",
  description:
    "AI-powered marketplace. Rasm yukla → AI e'lonni yaratadi. Transport, agro, chorva, sanoat, ko'chmas mulk, xizmatlar.",
  keywords: "marketplace, O'zbekiston, savdo, AI, e'lon",
  authors: [{ name: "Turan Market Team" }],
  openGraph: {
    type: "website",
    url: "https://turanmarket.uz",
    title: "Turan Market",
    description: "O'zbekiston & Markaziy Osiyo Marketplace",
    images: [
      {
        url: "https://turanmarket.uz/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body className={`${inter.className} bg-white text-gray-900`}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
