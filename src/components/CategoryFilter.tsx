import React from 'react';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  sortBy,
  onSortChange,
}) => {
  const categories = [
    { id: 'semua', label: 'Semua' },
    { id: 'beras', label: 'Beras Sorgum' },
    { id: 'tepung', label: 'Tepung Sorgum' },
    { id: 'camilan', label: 'Camilan' },
    { id: 'benih', label: 'Benih' },
  ];

  return (
    <section className="py-8 md:py-12 bg-transparent">
      <div className="max-w-[1280px] mx-auto px-4 md:px-10 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2.5 sm:gap-3">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`px-5 py-2.5 rounded-xl font-['Plus_Jakarta_Sans'] text-xs sm:text-sm font-semibold transition-all duration-200 focus:outline-none cursor-pointer ${
                  isActive
                    ? 'bg-[#2E7D32] hover:bg-[#1B5E20] text-white shadow-2xs'
                    : 'bg-[#FFFFFF] hover:bg-[#E8F5E9] text-[#1B5E20] border border-[#E0E0E0]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-3 bg-[#FFFFFF] px-4 py-2.5 rounded-xl border border-[#E0E0E0] shadow-2xs self-end md:self-auto">
          <span className="font-['Plus_Jakarta_Sans'] text-xs font-semibold text-[#555555]">Urutkan:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-transparent border-none font-['Plus_Jakarta_Sans'] text-xs sm:text-sm font-bold text-[#1B5E20] focus:ring-0 cursor-pointer outline-none"
          >
            <option value="populer">Populer</option>
            <option value="harga-terendah">Harga Terendah</option>
            <option value="harga-tertinggi">Harga Tertinggi</option>
            <option value="terbaru">Terbaru</option>
          </select>
        </div>
      </div>
    </section>
  );
};
