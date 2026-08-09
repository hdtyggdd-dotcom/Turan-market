import React, { useState, useEffect } from 'react';
import { Heart, Filter, Search, MapPin, DollarSign } from 'lucide-react';

interface SavedListing {
  id: string;
  title: string;
  price: number;
  image: string;
  region: string;
  category: string;
  createdAt: string;
  seller: {
    name: string;
    rating: number;
  };
  isSaved: boolean;
}

const Favorites: React.FC = () => {
  const [favorites, setFavorites] = useState<SavedListing[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<SavedListing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');

  // Mock data
  useEffect(() => {
    const mockFavorites: SavedListing[] = [
      {
        id: '1',
        title: 'iPhone 15 Pro Max',
        price: 15000000,
        image: 'https://via.placeholder.com/200?text=iPhone+15',
        region: 'Tashkent',
        category: 'Electronics',
        createdAt: '2026-08-08',
        seller: { name: 'TechStore', rating: 4.8 },
        isSaved: true,
      },
      {
        id: '2',
        title: 'MacBook Pro 14"',
        price: 28000000,
        image: 'https://via.placeholder.com/200?text=MacBook',
        region: 'Tashkent',
        category: 'Electronics',
        createdAt: '2026-08-07',
        seller: { name: 'Apple Store', rating: 4.9 },
        isSaved: true,
      },
      {
        id: '3',
        title: 'Qora sigir - hochiq',
        price: 5000000,
        image: 'https://via.placeholder.com/200?text=Sigir',
        region: 'Samarkand',
        category: 'Livestock',
        createdAt: '2026-08-06',
        seller: { name: 'Chorva Bozori', rating: 4.5 },
        isSaved: true,
      },
      {
        id: '4',
        title: 'Ikki xonali appartament - Mirabad',
        price: 800000000,
        image: 'https://via.placeholder.com/200?text=Apartment',
        region: 'Tashkent',
        category: 'Real Estate',
        createdAt: '2026-08-05',
        seller: { name: 'Real Estate Pro', rating: 4.7 },
        isSaved: true,
      },
      {
        id: '5',
        title: 'Matiz avtomobili - 2015 yil',
        price: 45000000,
        image: 'https://via.placeholder.com/200?text=Matiz',
        region: 'Bukhara',
        category: 'Vehicles',
        createdAt: '2026-08-04',
        seller: { name: 'CarZone', rating: 4.6 },
        isSaved: true,
      },
    ];
    setFavorites(mockFavorites);
    setFilteredFavorites(mockFavorites);
  }, []);

  // Filter va Sort
  useEffect(() => {
    let result = [...favorites];

    // Search filteri
    if (searchQuery.trim()) {
      result = result.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filteri
    if (selectedCategory !== 'all') {
      result = result.filter((item) => item.category === selectedCategory);
    }

    // Region filteri
    if (selectedRegion !== 'all') {
      result = result.filter((item) => item.region === selectedRegion);
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
      default:
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    setFilteredFavorites(result);
  }, [searchQuery, selectedCategory, selectedRegion, sortBy, favorites]);

  const removeFavorite = (id: string) => {
    setFavorites(favorites.filter((item) => item.id !== id));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price);
  };

  const uniqueCategories = Array.from(new Set(favorites.map((f) => f.category)));
  const uniqueRegions = Array.from(new Set(favorites.map((f) => f.region)));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">Saqlangan e'lonlar</h1>
            <span className="text-sm text-gray-500">({filteredFavorites.length})</span>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="E'lon nomi bo'yicha qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition whitespace-nowrap"
            >
              <Filter className="w-4 h-4" />
              Filtr
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Yangi</option>
              <option value="price-low">Narx (past→yuqori)</option>
              <option value="price-high">Narx (yuqori→past)</option>
            </select>

            <div className="flex gap-1">
              <button
                onClick={() => setViewType('grid')}
                className={`px-3 py-2 rounded-lg transition ${
                  viewType === 'grid'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ⊞
              </button>
              <button
                onClick={() => setViewType('list')}
                className={`px-3 py-2 rounded-lg transition ${
                  viewType === 'list'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ≡
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategoriya
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Barchasi</option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Region Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Viloyat
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Barchasi</option>
                  {uniqueRegions.map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedRegion('all');
                    setSearchQuery('');
                  }}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                  Filtri bekor qilish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {filteredFavorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Heart className="w-16 h-16 text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Saqlangan e'lonlar yo'q
            </h2>
            <p className="text-gray-500 mb-6">
              E'lonlarni qo'lining belgisini bosib saqlang
            </p>
            <a
              href="/"
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition"
            >
              E'lonlarni qidirish
            </a>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewType === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredFavorites.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg shadow-sm hover:shadow-lg transition overflow-hidden group"
                  >
                    {/* Image */}
                    <div className="relative overflow-hidden bg-gray-200 h-48">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <button
                        onClick={() => removeFavorite(item.id)}
                        className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-red-50 transition"
                      >
                        <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                      </button>
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                        SAQLANDI
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      {/* Title */}
                      <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
                        {item.title}
                      </h3>

                      {/* Price */}
                      <div className="text-lg font-bold text-blue-600 mb-2">
                        {formatPrice(item.price)} so'm
                      </div>

                      {/* Location & Category */}
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <MapPin className="w-3 h-3" />
                        <span>{item.region}</span>
                      </div>

                      {/* Seller Info */}
                      <div className="flex items-center justify-between text-xs text-gray-600 border-t pt-2">
                        <span className="font-medium">{item.seller.name}</span>
                        <span className="text-yellow-500">
                          ★ {item.seller.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* List View */}
            {viewType === 'list' && (
              <div className="space-y-3">
                {filteredFavorites.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition flex overflow-hidden"
                  >
                    {/* Image */}
                    <div className="relative w-32 h-32 bg-gray-200 flex-shrink-0 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeFavorite(item.id)}
                        className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-red-50"
                      >
                        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {item.region}
                          </span>
                          <span>{item.category}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-blue-600">
                          {formatPrice(item.price)} so'm
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">
                            {item.seller.name}
                          </span>
                          <span className="text-xs text-yellow-500">
                            ★ {item.seller.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Favorites;
