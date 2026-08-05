import React, { useState, useEffect } from 'react';
import { Product } from '../../types';

interface ProductFormViewProps {
  initialProduct?: Product | null;
  initialStock?: number;
  onSave: (productData: {
    id?: string;
    name: string;
    category: 'beras' | 'tepung' | 'camilan' | 'pemanis' | 'benih';
    price: number;
    unitInfo: string;
    weight: string;
    badge: 'BEST SELLER' | 'DISKON 15%' | 'BARU' | '' | undefined;
    image: string;
    stock: number;
    description: string;
    glutenFree: boolean;
    organic: boolean;
    specification?: string;
    shippingInfo?: string;
  }) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}

export const ProductFormView: React.FC<ProductFormViewProps> = ({
  initialProduct,
  initialStock = 100,
  onSave,
  onCancel,
  showToast,
}) => {
  const [idInput, setIdInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<
    'beras' | 'tepung' | 'camilan' | 'pemanis' | 'benih'
  >('beras');
  const [priceInput, setPriceInput] = useState<number | ''>('');
  const [unitInput, setUnitInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [badgeInput, setBadgeInput] = useState<string>('');
  const [imageInput, setImageInput] = useState('');
  const [stockInput, setStockInput] = useState<number | ''>('');
  const [descInput, setDescInput] = useState('');
  const [glutenFreeInput, setGlutenFreeInput] = useState(true);
  const [organicInput, setOrganicInput] = useState(true);
  const [specificationInput, setSpecificationInput] = useState('');
  const [shippingInfoInput, setShippingInfoInput] = useState('');

  useEffect(() => {
    if (initialProduct) {
      setIdInput(initialProduct.id);
      setNameInput(initialProduct.name);
      setCategoryInput(initialProduct.category);
      setPriceInput(initialProduct.price);
      setUnitInput(initialProduct.unitInfo || '');
      setWeightInput(initialProduct.weight || '');
      setBadgeInput(initialProduct.badge || '');
      setImageInput(initialProduct.image || '');
      setStockInput(initialStock);
      setDescInput(initialProduct.description || '');
      setGlutenFreeInput(initialProduct.glutenFree ?? true);
      setOrganicInput(initialProduct.organic ?? true);
      setSpecificationInput(initialProduct.specification || '');
      setShippingInfoInput(initialProduct.shippingInfo || '');
    } else {
      setIdInput('');
      setNameInput('');
      setCategoryInput('beras');
      setPriceInput('');
      setUnitInput('');
      setWeightInput('');
      setBadgeInput('');
      setImageInput('');
      setStockInput('');
      setDescInput('');
      setGlutenFreeInput(true);
      setOrganicInput(true);
      setSpecificationInput('');
      setShippingInfoInput('');
    }
  }, [initialProduct, initialStock]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageInput(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      showToast('Masukkan nama produk!');
      return;
    }

    const priceNum = Number(priceInput) || 0;
    const stockNum = Number(stockInput) || 0;

    onSave({
      id: idInput || initialProduct?.id,
      name: nameInput,
      category: categoryInput,
      price: priceNum,
      unitInfo: unitInput || `${weightInput || '1kg'} / Premium`,
      weight: weightInput || '1kg',
      badge: (badgeInput as any) || undefined,
      image:
        imageInput ||
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDx6V_oUnfKzyojm9uXQ7bSN6saxNNJzgrPhjyFQ8SDKkwHBRL_MjAtQ9wWncQju2t0FE095pnEc_KY0CAkXND0ZFmkKncxnCLaoz85Fx4_p818g2JXproo8RQRnDBzZALrKLSfKPiQVF-HikX7czDtanpQjjZbF7NGwy0DsKUT2yDAqx4-esjUOFhaf0e9oAZ7w7KV3MmH3BosDB1jK0DgJcYibaN7d2Vo68vjaZR_58IEQO_Zl5E',
      stock: stockNum,
      description: descInput,
      glutenFree: glutenFreeInput,
      organic: organicInput,
      specification: specificationInput,
      shippingInfo: shippingInfoInput,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      {/* Header & Breadcrumbs */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-[#44483f] mb-1">
            <ol className="flex items-center space-x-2">
              <li>
                <button
                  type="button"
                  onClick={onCancel}
                  className="hover:text-[#162809] transition-colors cursor-pointer"
                >
                  Kelola Produk
                </button>
              </li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">
                  chevron_right
                </span>
              </li>
              <li className="text-[#162809] font-bold">
                {initialProduct ? 'Edit Katalog Produk' : 'Tambah Produk Baru'}
              </li>
            </ol>
          </nav>
          <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1d1b17]">
            {initialProduct ? 'Edit Produk' : 'Halaman Tambah Produk Baru'}
          </h2>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="bg-white border border-[#c4c8bc] text-[#1d1b17] px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 hover:bg-[#f3ede6] transition-all cursor-pointer font-bold text-xs"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Kembali</span>
        </button>
      </section>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#c4c8bc] overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* ID Produk (Read-Only) */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#1d1b17]">
              ID Produk <span className="text-gray-500 font-normal">(Otomatis Terisi)</span>
            </label>
            <input
              type="text"
              value={idInput}
              disabled
              className="w-full bg-[#e7e2db]/50 border border-[#c4c8bc] rounded-xl p-3.5 text-xs sm:text-sm text-[#44483f] font-mono outline-none cursor-not-allowed"
            />
          </div>

          {/* Upload Gambar Field (Local Device Upload Only) */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-[#1d1b17]">
              Foto &amp; Visual Produk
            </label>
            <input
              type="file"
              id="image-file-input"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="image-file-input"
              className="block border-2 border-dashed border-[#c4c8bc] rounded-2xl p-6 text-center bg-[#faf8f5] hover:border-[#162809] transition-all group relative cursor-pointer"
            >
              <div className="space-y-3">
                {imageInput ? (
                  <div className="relative w-28 h-28 mx-auto rounded-xl overflow-hidden border border-[#c4c8bc] shadow-xs">
                    <img src={imageInput} alt="Preview Produk" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-bold">Pilih Gambar Baru</span>
                    </div>
                  </div>
                ) : (
                  <span className="material-symbols-outlined text-5xl text-[#93a97f] group-hover:text-[#162809] transition-colors">
                    cloud_upload
                  </span>
                )}
                <div>
                  <p className="text-sm font-semibold text-[#1d1b17]">
                    Klik untuk memilih foto produk dari perangkat Anda
                  </p>
                  <p className="text-xs text-[#44483f]">Format JPG/PNG, rekomendasi 800x800 px</p>
                </div>
              </div>
            </label>
          </div>

          {/* Row 1: Nama & Kategori */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1d1b17]">
                Nama Produk <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Contoh: Sorgum Putih Organic 1kg"
                required
                className="w-full bg-[#faf8f5] border border-[#c4c8bc] rounded-xl p-3.5 text-xs sm:text-sm text-[#1d1b17] focus:ring-2 focus:ring-[#162809] outline-none font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1d1b17]">
                Kategori Produk
              </label>
              <select
                value={categoryInput}
                onChange={(e) =>
                  setCategoryInput(
                    e.target.value as 'beras' | 'tepung' | 'camilan' | 'pemanis' | 'benih'
                  )
                }
                className="w-full bg-[#faf8f5] border border-[#c4c8bc] rounded-xl p-3.5 text-xs sm:text-sm text-[#1d1b17] focus:ring-2 focus:ring-[#162809] outline-none cursor-pointer font-medium"
              >
                <option value="beras">Beras Sorgum</option>
                <option value="tepung">Tepung Sorgum</option>
                <option value="camilan">Camilan Sehat</option>
                <option value="pemanis">Pemanis Alami</option>
                <option value="benih">Benih Sorgum</option>
              </select>
            </div>
          </div>

          {/* Row 2: Harga & Kemasan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1d1b17]">
                Harga Satuan (Rp) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value ? Number(e.target.value) : '')}
                placeholder="45000"
                required
                className="w-full bg-[#faf8f5] border border-[#c4c8bc] rounded-xl p-3.5 text-xs sm:text-sm text-[#1d1b17] focus:ring-2 focus:ring-[#162809] outline-none font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1d1b17]">
                Kemasan / Berat (Info Unit)
              </label>
              <input
                type="text"
                value={unitInput}
                onChange={(e) => setUnitInput(e.target.value)}
                placeholder="Contoh: 1kg / Kemasan Vacuum"
                className="w-full bg-[#faf8f5] border border-[#c4c8bc] rounded-xl p-3.5 text-xs sm:text-sm text-[#1d1b17] focus:ring-2 focus:ring-[#162809] outline-none"
              />
            </div>
          </div>

          {/* Row 3: Stok & Badge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1d1b17]">
                Jumlah Stok (Unit)
              </label>
              <input
                type="number"
                value={stockInput}
                onChange={(e) => setStockInput(e.target.value ? Number(e.target.value) : '')}
                placeholder="100"
                className="w-full bg-[#faf8f5] border border-[#c4c8bc] rounded-xl p-3.5 text-xs sm:text-sm text-[#1d1b17] focus:ring-2 focus:ring-[#162809] outline-none font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1d1b17]">
                Badge Highlight Produk
              </label>
              <select
                value={badgeInput}
                onChange={(e) => setBadgeInput(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#c4c8bc] rounded-xl p-3.5 text-xs sm:text-sm text-[#1d1b17] focus:ring-2 focus:ring-[#162809] outline-none cursor-pointer"
              >
                <option value="">Tidak Ada Badge</option>
                <option value="BEST SELLER">BEST SELLER</option>
                <option value="DISKON 15%">DISKON 15%</option>
                <option value="BARU">BARU</option>
              </select>
            </div>
          </div>

          {/* Row 4: Deskripsi */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#1d1b17]">
              Deskripsi Produk
            </label>
            <textarea
              rows={3}
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
              placeholder="Tuliskan deskripsi ringkas mengenai nutrisi, pengolahan, dan manfaat produk..."
              className="w-full bg-[#faf8f5] border border-[#c4c8bc] rounded-xl p-3.5 text-xs sm:text-sm text-[#1d1b17] focus:ring-2 focus:ring-[#162809] outline-none"
            />
          </div>

          {/* Row 5: Attribute Checkboxes */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#1d1b17]">
              Atribut Spesifikasi Nutrisi
            </label>
            <div className="flex flex-wrap gap-6 pt-1">
              <label className="inline-flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={glutenFreeInput}
                  onChange={(e) => setGlutenFreeInput(e.target.checked)}
                  className="w-4 h-4 rounded text-[#162809] focus:ring-[#162809]"
                />
                <span className="text-xs font-semibold text-[#1d1b17]">100% Bebas Gluten</span>
              </label>
              <label className="inline-flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={organicInput}
                  onChange={(e) => setOrganicInput(e.target.checked)}
                  className="w-4 h-4 rounded text-[#162809] focus:ring-[#162809]"
                />
                <span className="text-xs font-semibold text-[#1d1b17]">Organik &amp; Alami</span>
              </label>
            </div>
          </div>

          {/* Row: Spesifikasi & Informasi Pengiriman */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1d1b17]">
                Spesifikasi Produk
              </label>
              <textarea
                rows={2}
                value={specificationInput}
                onChange={(e) => setSpecificationInput(e.target.value)}
                placeholder="Contoh: Kadar air <14%, Masa simpan 12 bulan, Gluten-Free."
                className="w-full bg-[#faf8f5] border border-[#c4c8bc] rounded-xl p-3.5 text-xs sm:text-sm text-[#1d1b17] focus:ring-2 focus:ring-[#162809] outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1d1b17]">
                Informasi Pengiriman
              </label>
              <textarea
                rows={2}
                value={shippingInfoInput}
                onChange={(e) => setShippingInfoInput(e.target.value)}
                placeholder="Contoh: Dikirim dari Yogyakarta. Diproses sebelum jam 15:00 WIB."
                className="w-full bg-[#faf8f5] border border-[#c4c8bc] rounded-xl p-3.5 text-xs sm:text-sm text-[#1d1b17] focus:ring-2 focus:ring-[#162809] outline-none"
              />
            </div>
          </div>



          {/* Actions */}
          <div className="flex justify-end pt-4 space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 rounded-xl border border-[#75786e] text-[#44483f] font-bold text-xs hover:bg-[#e7e2db] transition-all cursor-pointer"
            >
              Batalkan
            </button>
            <button
              type="submit"
              className="bg-[#162809] text-white px-8 py-2.5 rounded-xl font-bold text-xs hover:opacity-90 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              {initialProduct ? 'Simpan Perubahan Produk' : 'Simpan Produk Baru'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
