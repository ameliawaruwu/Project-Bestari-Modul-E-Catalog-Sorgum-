import React, { useState } from 'react';
import { Product } from '../../types';

interface ProductsTabProps {
  products: Product[];
  onToggleProductStatus: (id: string) => void;
  onDeleteProduct: (product: Product) => void;
  onOpenCreateProduct: () => void;
  onOpenEditProduct: (product: Product) => void;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({
  products,
  productActiveMap,
  productStockMap,
  onToggleProductStatus,
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
    .sort((a, b) => b.id - a.id);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Title & Breadcrumb */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-[#555555] mb-1">
            <ol className="flex items-center space-x-2">
              <li>Dashboard</li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">
                  chevron_right
                </span>
              </li>
              <li className="text-[#1B5E20] font-bold">Kelola Produk</li>
            </ol>
          </nav>
          <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1B5E20]">
            Kelola Produk
          </h2>
        </div>

        <button
          type="button"
          onClick={onOpenCreateProduct}
          className="bg-[#2E7D32] text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-[#1B5E20] transition-all shadow-xs cursor-pointer font-bold text-xs"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          <span>Tambah Produk</span>
        </button>
      </section>

      {/* Table Card: Daftar Produk */}
      <div className="bg-[#FFFFFF] rounded-2xl shadow-2xs border border-[#E0E0E0] overflow-hidden">
        <div className="p-6 border-b border-[#E0E0E0] flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#FFFFFF]">
          <div>
            <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#1B5E20]">
              Daftar Produk
            </h3>
            <p className="text-xs text-[#555555] mt-0.5">
              Daftar lengkap komoditas dan olahan sorgum Sorgum
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search bar */}
            <div className="flex items-center bg-[#F7F8F6] rounded-full px-4 py-2 border border-[#E0E0E0]">
              <span className="material-symbols-outlined text-[#555555] mr-2 text-lg">search</span>
              <input
                type="text"
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                placeholder="Cari nama produk..."
                className="bg-transparent border-none outline-none text-xs text-[#1B5E20] w-36 sm:w-48 placeholder:text-[#555555] font-medium"
              />
            </div>

            {/* Category Dropdown Filter */}
            <select
              value={selectedProductCategory}
              onChange={(e) => setSelectedProductCategory(e.target.value)}
              className="bg-[#F7F8F6] border border-[#E0E0E0] rounded-full px-4 py-2 text-xs font-semibold text-[#1B5E20] outline-none cursor-pointer hover:bg-[#E8F5E9] transition-colors"
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
              <tr style={{ backgroundColor: '#E8F5E9', color: '#1B5E20' }} className="border-y border-[#C8E6C9]">
                <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="px-4 py-3.5 w-[70px] text-xs font-extrabold uppercase tracking-wider"><strong className="font-black text-[#1B5E20]">GAMBAR</strong></th>
                <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider"><strong className="font-black text-[#1B5E20]">NAMA PRODUK</strong></th>
                <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="px-4 py-3.5 w-[140px] text-xs font-extrabold uppercase tracking-wider"><strong className="font-black text-[#1B5E20]">KATEGORI</strong></th>
                <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="px-4 py-3.5 w-[130px] text-xs font-extrabold uppercase tracking-wider"><strong className="font-black text-[#1B5E20]">HARGA</strong></th>
                <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="px-4 py-3.5 w-[85px] text-xs font-extrabold uppercase tracking-wider"><strong className="font-black text-[#1B5E20]">STOK</strong></th>
                <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="px-4 py-3.5 text-right w-[110px] text-xs font-extrabold uppercase tracking-wider"><strong className="font-black text-[#1B5E20]">AKSI</strong></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E0E0] text-xs sm:text-sm">
              {filteredProducts.map((prod) => {
                const stock = prod.stock ?? 0;
                return (
                  <tr key={prod.id} className="hover:bg-[#E8F5E9]/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="w-11 h-11 rounded-xl bg-[#e4dfd5] overflow-hidden border border-[#e4dfd5] shadow-2xs flex-shrink-0">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p className="font-bold text-[#1d1b17] leading-tight">{prod.name}</p>
                        {prod.badge && (
                          <span className="inline-block text-[9px] font-extrabold uppercase bg-[#fade88] text-[#756118] px-2 py-0.5 rounded-md leading-none">
                            {prod.badge}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#44483f] font-semibold text-xs">
                      {prod.categoryLabel || prod.category}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#162809] font-mono-custom">
                      {prod.originalPrice ? (
                        <div className="space-y-0.5">
                          <p className="text-[#162809] font-bold">
                            Rp {prod.price.toLocaleString('id-ID')}
                          </p>
                          <p className="text-[10px] text-gray-400 line-through">
                            Rp {prod.originalPrice.toLocaleString('id-ID')}
                          </p>
                        </div>
                      ) : (
                        `Rp ${prod.price.toLocaleString('id-ID')}`
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#1d1b17]">
                      {stock} Unit
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenEditProduct(prod)}
                          className="w-9 h-9 rounded-xl bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#1B5E20] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                          title="Edit produk"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(prod)}
                          className="w-9 h-9 rounded-xl bg-[#FFEBEE] hover:bg-[#FFCDD2] text-[#D32F2F] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
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
        <div className="p-4 bg-[#fdfbf7] text-[#44483f]/80 text-xs font-medium flex justify-between items-center border-t border-[#e4dfd5]">
          <span>
            Menampilkan {filteredProducts.length} dari {products.length} Produk
          </span>
          <div className="flex space-x-2">
            <button
              disabled
              className="px-3 py-1 border border-[#e4dfd5] rounded-xl hover:bg-[#f4efe8] disabled:opacity-50 text-xs cursor-not-allowed font-medium"
            >
              Sebelumnya
            </button>
            <button className="px-3 py-1 border border-[#e4dfd5] rounded-xl hover:bg-[#f4efe8] text-xs cursor-pointer font-medium text-[#162809]">
              Berikutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
