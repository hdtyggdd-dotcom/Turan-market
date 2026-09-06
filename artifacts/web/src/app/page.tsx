import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <>
      {/* HERO SECTION */}
      <section className="hero-gradient text-white py-20 md:py-32">
        <div className="container-max">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                🌍 Turan Market
              </h1>
              <p className="text-lg md:text-xl mb-4 text-blue-100">
                O'zbekiston va Markaziy Osiyo'ning birinchi <strong>AI-powered marketplace</strong>
              </p>
              <p className="text-base md:text-lg mb-8 text-blue-100">
                Rasm yukla → AI e'lonni tayyorlasin → Sotib ol/Sotin O'zbekcha va Ruscha
              </p>
              <div className="flex gap-4">
                <Link
                  href="/marketplace"
                  className="btn-primary inline-block"
                >
                  📱 Bozorga o'tish
                </Link>
                <Link
                  href="#features"
                  className="btn-outline inline-block text-white border-white hover:bg-white hover:text-blue-600"
                >
                  Batafsil
                </Link>
              </div>
            </div>

            {/* HERO IMAGE */}
            <div className="animate-slide-in-left">
              <div className="bg-blue-400 rounded-lg shadow-2xl p-8 text-center">
                <div className="text-7xl mb-4">🚗</div>
                <p className="text-white font-semibold">Transport</p>
                <p className="text-sm text-blue-100 mt-2">Avtomobil, ehtiyot qismlar, mototsikl...</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container-max">
          <h2 className="text-4xl font-bold text-center mb-16">✨ Asosiy Xususiyatlar</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card">
              <div className="text-5xl mb-4">🤖</div>
              <h3 className="text-2xl font-bold mb-4">AI E'lon Yaratish</h3>
              <p className="text-gray-700">
                Rasm yukla, AI kategoriya, nom, tavsif, teglarni avtomatik tayyorlasin. 
                Sotuvchi faqat tasdiqlasa — tayyor!
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card">
              <div className="text-5xl mb-4">🏪</div>
              <h3 className="text-2xl font-bold mb-4">Shaxsiy Do'kon</h3>
              <p className="text-gray-700">
                Har bir sotuvchiga alohida do'kon sahifasi. 
                Logo, banner, reyting, barcha mahsulotlar.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold mb-4">Smart Qidiruv</h3>
              <p className="text-gray-700">
                Dinamik filtrlar, fuzzy qidiruv, kategoriyalar bo'yicha asingli tashkil.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card">
              <div className="text-5xl mb-4">🚚</div>
              <h3 className="text-2xl font-bold mb-4">Yuk Tashish</h3>
              <p className="text-gray-700">
                Shahar ichida, shaharlararo, xalqaro. Maxsus yuk (refrigerated, hazmat).
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-2xl font-bold mb-4">Optom Savdo</h3>
              <p className="text-gray-700">
                B2B rejimi. Minimal miqdor, tiered pricing. Admin komissiyani boshqaradi.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card">
              <div className="text-5xl mb-4">🔄</div>
              <h3 className="text-2xl font-bold mb-4">Ayirboshlash</h3>
              <p className="text-gray-700">
                Mahsulotlarni almashta. Qo'shimcha pul berish yoki olish mumkin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES SECTION */}
      <section id="categories" className="py-20">
        <div className="container-max">
          <h2 className="text-4xl font-bold text-center mb-16">📦 Kategoriyalar</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: "🚗", name: "Transport", desc: "Avtomobil, moto, ehtiyot" },
              { icon: "🌾", name: "Qishloq xo'jaligi", desc: "Urug', ekinlar, o'simlik" },
              { icon: "🐄", name: "Chorva", desc: "Qoramol, qo'y, parranda" },
              { icon: "🏭", name: "Sanoat", desc: "Stanoklar, liniyalar, jihozlar" },
              { icon: "🏠", name: "Ko'chmas mulk", desc: "Kvartira, hovli, ofis" },
              { icon: "💼", name: "Xizmatlar", desc: "Qurilish, ta'mirlash, IT" },
              { icon: "♻️", name: "Ishlatilgan", desc: "Barcha kategoriyalarda" },
              { icon: "🎯", name: "Boshqalar", desc: "Antikvar, vintage, ovchilik" },
            ].map((cat, i) => (
              <Link
                key={i}
                href={`/marketplace?category=${cat.name.toLowerCase()}`}
                className="card hover:scale-105 transition"
              >
                <div className="text-4xl mb-3">{cat.icon}</div>
                <h3 className="font-bold text-lg mb-2">{cat.name}</h3>
                <p className="text-sm text-gray-600">{cat.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-gray-50">
        <div className="container-max">
          <h2 className="text-4xl font-bold text-center mb-16">🎯 Qanday Ishlamaslik?</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "1️⃣",
                title: "Ro'yxatdan o'tish",
                desc: "Email yoki telefon orqali tez ro'yxatdan o'tish",
              },
              {
                step: "2️⃣",
                title: "Rasm yukla",
                desc: "Mahsulotning rasmini yuklab bering",
              },
              {
                step: "3️⃣",
                title: "AI tayyorlaydi",
                desc: "AI nom, tavsif, teglarni avtomatik yaratadi",
              },
              {
                step: "4️⃣",
                title: "Sotib/Sotin",
                desc: "E'lon chiqadi, xaridorlar topadi, sotiladı!",
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl mb-4">{item.step}</div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-20 hero-gradient text-white">
        <div className="container-max">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "10+", label: "Kategoriya" },
              { number: "50+", label: "Subkategoriya" },
              { number: "500+", label: "Dinamik atribut" },
              { number: "2", label: "Til (Uz + Ru)" },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-5xl font-bold mb-2">{stat.number}</div>
                <p className="text-blue-100">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SELLERS CTA */}
      <section className="py-20 bg-gray-50">
        <div className="container-max text-center">
          <h2 className="text-4xl font-bold mb-6">👨‍💼 Sotuvchi boʻlmoqchisiz?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Turan Market'da o'z do'koningizni oching. 
            Tez ro'yxatdan o'ting, mahsulot joylashtiring, AI e'lonlarni yarating.
          </p>
          <Link href="/seller/register" className="btn-primary">
            🏪 Sotuvchi Ro'yxatdan O'tish
          </Link>
        </div>
      </section>

      {/* DOWNLOAD SECTION */}
      <section className="py-20">
        <div className="container-max text-center">
          <h2 className="text-4xl font-bold mb-6">📱 Mobil Ilovani Yuklab Oling</h2>
          <p className="text-lg text-gray-600 mb-8">
            iOS va Android'da mavjud. O'zbekcha va Ruscha.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="https://play.google.com/store/apps/details?id=uz.turanmarket"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-block"
            >
              🤖 Google Play
            </a>
            <a
              href="https://apps.apple.com/uz/app/turan-market"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-block"
            >
              🍎 App Store
            </a>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 hero-gradient text-white text-center">
        <div className="container-max">
          <h2 className="text-4xl font-bold mb-6">🚀 Bugun Boshlang!</h2>
          <p className="text-xl mb-8 text-blue-100">
            Turan Market'da sotuvchi bo'ling yoki xaridor bo'ling.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/marketplace" className="btn-primary">
              🛒 Bozorga O'tish
            </Link>
            <Link
              href="/seller/register"
              className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition font-semibold"
            >
              🏪 Do'kon Ochish
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
