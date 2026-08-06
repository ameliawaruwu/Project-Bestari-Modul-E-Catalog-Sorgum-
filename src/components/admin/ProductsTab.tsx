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
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-[#44483f] mb-1">
            <ol className="flex items-center space-x-2">
              <li>Dashboard</li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">
                  chevron_right
                </span>
              </li>
              <li className="text-[#162809] font-bold">Kelola Produk</li>
            </ol>
          </nav>
          <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1d1b17]">
            Kelola Produk
          </h2>
        </div>

        <button
          type="button"
          onClick={onOpenCreateProduct}
          className="bg-[#162809] text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:opacity-90 transition-all shadow-xs cursor-pointer font-bold text-xs"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          <span>Tambah Produk</span>
        </button>
      </section>

      {/* Table Card: Daftar Produk */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#c4c8bc] overflow-hidden">
        <div className="p-6 border-b border-[#c4c8bc] flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#f9f3ec]">
          <div>
            <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#1d1b17]">
              Daftar Produk
            </h3>
            <p className="text-xs text-[#44483f] mt-0.5">
              Daftar lengkap komoditas dan olahan sorgum Sorgum
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search bar */}
            <div className="flex items-center bg-white rounded-full px-4 py-2 border border-[#c4c8bc]">
              <span className="material-symbols-outlined text-[#44483f] mr-2 text-lg">search</span>
              <input
                type="text"
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                placeholder="Cari nama produk..."
                className="bg-transparent border-none outline-none text-xs text-[#1d1b17] w-36 sm:w-48 placeholder:text-[#44483f]/60"
              />
            </div>

            {/* Category Dropdown Filter */}
            <select
              value={selectedProductCategory}
              onChange={(e) => setSelectedProductCategory(e.target.value)}
              className="bg-white border border-[#c4c8bc] rounded-full px-4 py-2 text-xs font-semibold text-[#1d1b17] outline-none cursor-pointer"
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-[#f3ede6] text-[#44483f] text-xs font-bold uppercase tracking-wider border-b border-[#c4c8bc]">
                <th className="px-4 py-3 w-[80px]">Gambar</th>
                <th className="px-4 py-3 w-[250px]">Nama Produk</th>
                <th className="px-4 py-3 w-[130px]">Harga</th>
                <th className="px-4 py-3 w-[85px]">Stok</th>
                <th className="px-4 py-3 text-right w-[150px] sticky right-0 bg-[#f3ede6]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c4c8bc]/60 text-xs sm:text-sm">
              {filteredProducts.map((prod) => {
                const stock = prod.stock ?? 0;
                return (
                  <tr key={prod.id} className="hover:bg-[#f9f3ec] transition-colors odd:bg-white even:bg-[#faf9f6]">
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 rounded-xl bg-[#e7e2db] overflow-hidden border border-[#c4c8bc] shadow-xs flex-shrink-0">
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
                          <span className="inline-block text-[9px] font-bold uppercase bg-[#fade88] text-[#756118] px-1.5 py-0.5 rounded leading-none">
                            {prod.badge}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-[#162809] font-mono">
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
                    <td className="px-4 py-3 text-right sticky right-0 bg-white odd:bg-white even:bg-[#faf9f6] hover:bg-[#f9f3ec] z-10">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenEditProduct(prod)}
                          className="p-2 text-[#162809] bg-[#fade88]/50 hover:bg-[#fade88] rounded-lg transition-all cursor-pointer"
                          title="Edit produk"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(prod)}
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all cursor-pointer"
                          title="Hapus produk"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
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
        <div className="p-4 bg-[#f9f3ec] text-[#44483f] text-xs font-medium flex justify-between items-center border-t border-[#c4c8bc]">
          <span>
            Menampilkan {filteredProducts.length} dari {products.length} Produk
          </span>
          <div className="flex space-x-2">
            <button
              disabled
              className="px-3 py-1 border border-[#c4c8bc] rounded hover:bg-[#f3ede6] disabled:opacity-50 text-xs cursor-not-allowed"
            >
              Sebelumnya
            </button>
            <button className="px-3 py-1 border border-[#c4c8bc] rounded hover:bg-[#f3ede6] text-xs cursor-pointer">
              Berikutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
