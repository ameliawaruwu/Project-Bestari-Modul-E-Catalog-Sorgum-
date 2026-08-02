import React, { useState } from 'react';
import { Product } from '../../types';

interface ProductsTabProps {
  products: Product[];
  productActiveMap: Record<string, boolean>;
  productStockMap: Record<string, number>;
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

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
      (p.categoryLabel || p.category).toLowerCase().includes(searchProduct.toLowerCase()) ||
      (p.unitInfo || '').toLowerCase().includes(searchProduct.toLowerCase());

    const matchesCategory =
      selectedProductCategory === 'semua' || p.category === selectedProductCategory;

    return matchesSearch && matchesCategory;
  });

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
              Daftar lengkap komoditas dan olahan sorgum Bestari
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
                <th className="px-4 py-3 w-[80px]">ID Produk</th>
                <th className="px-4 py-3 w-[80px]">Gambar</th>
                <th className="px-4 py-3 w-[160px]">Nama Produk</th>
                <th className="px-4 py-3 w-[120px]">Kategori</th>
                <th className="px-4 py-3 w-[100px]">Harga</th>
                <th className="px-4 py-3 w-[85px]">Stok</th>
                <th className="px-4 py-3 w-[80px]">Berat</th>
                <th className="px-4 py-3 w-[160px]">Spesifikasi</th>
                <th className="px-4 py-3 w-[200px]">Deskripsi</th>
                <th className="px-4 py-3 w-[160px]">Info Pengiriman</th>
                <th className="px-4 py-3 text-right w-[90px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c4c8bc]/60 text-xs sm:text-sm">
              {filteredProducts.map((prod) => {
                const stock = productStockMap[prod.id] ?? 50;
                return (
                  <tr key={prod.id} className="hover:bg-[#f9f3ec] transition-colors odd:bg-white even:bg-[#faf9f6]">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-[#44483f]">
                      {prod.id}
                    </td>
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
                    <td className="px-4 py-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#d2eabb] text-[#162809]">
                        {prod.categoryLabel || prod.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-[#162809] font-mono">
                      Rp {prod.price.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#1d1b17]">
                      {stock} Unit
                    </td>
                    <td className="px-4 py-3 text-[#1d1b17]">
                      {prod.weight || '1kg'}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#44483f] leading-normal break-words">
                      {prod.specification || 'Bebas Gluten, Organik & Alami.'}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#44483f] leading-normal break-words">
                      <div className="line-clamp-3">
                        {prod.description}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#44483f] leading-normal break-words">
                      {prod.shippingInfo || 'Dikirim dari Yogyakarta.'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => onOpenEditProduct(prod)}
                          className="p-1.5 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit produk"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(prod)}
                          className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
