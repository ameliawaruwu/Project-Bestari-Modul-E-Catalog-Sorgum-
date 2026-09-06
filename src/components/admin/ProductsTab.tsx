import React, { useState } from 'react';
import { Product } from '../../types';

interface ProductsTabProps {
  products: Product[];
  onDeleteProduct: (product: Product) => void;
  onOpenCreateProduct: () => void;
  onOpenEditProduct: (product: Product) => void;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({
  products,
  onDeleteProduct,
  onOpenCreateProduct,
  onOpenEditProduct,
}) => {
  const [searchProduct, setSearchProduct] = useState('');
  const [selectedProductCategory, setSelectedProductCategory] = useState<string>('semua');

  const filteredProducts = products
    .filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
        (p.categoryLabel || p.category).toLowerCase().includes(searchProduct.toLowerCase()) ||
        (p.unitInfo || '').toLowerCase().includes(searchProduct.toLowerCase());

      const matchesCategory =
        selectedProductCategory === 'semua' || p.category === selectedProductCategory;

      return matchesSearch && matchesCategory;
    })
    // ID urut DESC (terbaru di atas)
    .sort((a, b) => Number(b.id) - Number(a.id));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Title & Breadcrumb */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-[#556353] dark:text-white/60 mb-1">
            <ol className="flex items-center space-x-2">
              <li>Dashboard</li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">
                  chevron_right
                </span>
              </li>
              <li className="text-[#1F5132] dark:text-[#86EFAC] font-bold">Kelola Produk</li>
            </ol>
          </nav>
          <h2 className="font-['Plus_Jakarta_Sans'] text-2xl md:text-3xl font-extrabold text-[#14331C] dark:text-[#F4F8F3] tracking-tight">
            Kelola Produk
          </h2>
        </div>

        <button
          type="button"
          onClick={onOpenCreateProduct}
          className="bg-gradient-to-r from-[#3A8F4B] to-[#65B86B] hover:from-[#2F773E] hover:to-[#559E5B] text-white px-4.5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer font-bold text-xs active:scale-95"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>Tambah Produk</span>
        </button>
      </section>

      {/* Table Card: Daftar Produk */}
      <div className="bg-white dark:bg-[#0E1A11] rounded-2xl shadow-2xs border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] overflow-hidden">
        <div className="p-6 border-b border-[#E2EFE0] dark:border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#14331C] dark:text-[#F4F8F3]">
              Daftar Produk
            </h3>
            <p className="text-xs text-[#556353] dark:text-white/60 mt-0.5">
              Daftar lengkap komoditas dan olahan sorgum Sorgum
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search bar */}
            <div className="flex items-center bg-[#F9FBF7] dark:bg-[#122316] rounded-full px-4 py-2 border border-[#E2EFE0] dark:border-white/10">
              <span className="material-symbols-outlined text-[#556353] dark:text-white/60 mr-2 text-lg">search</span>
              <input
                type="text"
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                placeholder="Cari nama produk..."
                className="bg-transparent border-none outline-none text-xs text-[#1F5132] dark:text-[#F4F8F3] w-36 sm:w-48 placeholder:text-[#556353] font-medium"
              />
            </div>

            {/* Category Dropdown Filter */}
            <select
              value={selectedProductCategory}
              onChange={(e) => setSelectedProductCategory(e.target.value)}
              className="bg-[#F9FBF7] dark:bg-[#122316] border border-[#E2EFE0] dark:border-white/10 rounded-full px-4 py-2 text-xs font-semibold text-[#1F5132] dark:text-[#86EFAC] outline-none cursor-pointer hover:bg-[#EAF6E8] transition-colors"
            >
              <option value="semua">Semua Kategori</option>
              <option value="beras">Beras Sorgum</option>
              <option value="tepung">Tepung Sorgum</option>
              <option value="camilan">Camilan Sehat</option>
              <option value="pemanis">Pemanis Alami</option>
              <option value="benih">Benih Sorgum</option>
            </select>
          </div>
        </div>

        {/* Table - 6 Kolom Sesuai Aturan UI */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-[#F2F7F0] dark:bg-[#152718] border-y border-[#E2EFE0] dark:border-white/10 text-[#1F5132] dark:text-[#86EFAC]">
                <th className="px-4 py-3.5 w-[70px] text-xs font-extrabold uppercase tracking-wider">GAMBAR</th>
                <th className="px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider">NAMA PRODUK</th>
                <th className="px-4 py-3.5 w-[140px] text-xs font-extrabold uppercase tracking-wider">KATEGORI</th>
                <th className="px-4 py-3.5 w-[130px] text-xs font-extrabold uppercase tracking-wider">HARGA</th>
                <th className="px-4 py-3.5 w-[85px] text-xs font-extrabold uppercase tracking-wider">STOK</th>
                <th className="px-4 py-3.5 text-right w-[110px] text-xs font-extrabold uppercase tracking-wider">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2EFE0] dark:divide-white/10 text-xs sm:text-sm">
              {filteredProducts.map((prod) => {
                const stock = prod.stock ?? 0;
                return (
                  <tr key={prod.id} className="hover:bg-[#EAF6E8]/60 dark:hover:bg-[#162B1C]/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="w-11 h-11 rounded-xl bg-[#FAF7EE] dark:bg-[#122316] overflow-hidden border border-[#E2EFE0] dark:border-white/10 shadow-2xs flex-shrink-0">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p className="font-bold text-[#14331C] dark:text-[#F4F8F3] leading-tight">{prod.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#556353] dark:text-white/60 font-semibold text-xs">
                      {prod.categoryLabel || prod.category}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#1F5132] dark:text-[#86EFAC] font-mono">
                      Rp {prod.price.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#1F5132] dark:text-[#86EFAC]">
                      {stock} Unit
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenEditProduct(prod)}
                          className="w-9 h-9 rounded-xl bg-[#EAF6E8] hover:bg-[#D7EED3] dark:bg-[#152718] dark:hover:bg-[#1B3320] text-[#1F5132] dark:text-[#86EFAC] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                          title="Edit produk"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(prod)}
                          className="w-9 h-9 rounded-xl bg-[#FFEBEE] hover:bg-[#FFCDD2] dark:bg-[#2A1215] dark:hover:bg-[#3B171B] text-[#D32F2F] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                          title="Hapus produk"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination & Counter */}
        <div className="p-4 bg-[#F9FBF7] dark:bg-[#0E1A11] text-[#556353] dark:text-white/60 text-xs font-medium flex justify-between items-center border-t border-[#E2EFE0] dark:border-white/10">
          <span>
            Menampilkan {filteredProducts.length} dari {products.length} Produk
          </span>
          <div className="flex space-x-2">
            <button
              disabled
              className="px-3 py-1 border border-[#E2EFE0] dark:border-white/10 rounded-xl hover:bg-[#EAF6E8] disabled:opacity-50 text-xs cursor-not-allowed font-medium"
            >
              Sebelumnya
            </button>
            <button className="px-3 py-1 border border-[#E2EFE0] dark:border-white/10 rounded-xl hover:bg-[#EAF6E8] text-xs cursor-pointer font-medium text-[#1F5132] dark:text-[#86EFAC]">
              Berikutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
