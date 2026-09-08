import React, { useState, useEffect } from 'react';
import { Product } from '../../types';

interface ProductFormViewProps {
  initialProduct?: Product | null;
  onSave: (productData: {
    id?: string;
    categoryId?: number;
    name: string;
    category: 'beras' | 'tepung' | 'camilan' | 'pemanis' | 'benih';
    price: number;
    priceMax?: number;
    unitInfo: string;
    weight: string;
    waContact?: string;
    image: string;
    description: string;
    composition?: string;
    shelfLife?: string;
    attributes?: string;
    glutenFree?: boolean;
    organic?: boolean;
    specification?: string;
    shippingInfo?: string;
    origin?: string;
    galleryImages?: string[];
  }) => void;
  onCancel: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  /** Opsi kategori dinamis dari Kelola Kategori (jika ada) */
  categoryOptions?: { id?: number; name: string; slug: string }[];
}

export const ProductFormView: React.FC<ProductFormViewProps> = ({
  initialProduct,
  onSave,
  onCancel,
  showToast,
  categoryOptions,
}) => {
  const [idInput, setIdInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<
    'beras' | 'tepung' | 'camilan' | 'pemanis' | 'benih'
  >('beras');
  const [categoryIdInput, setCategoryIdInput] = useState<number | undefined>(undefined);
  const [priceInput, setPriceInput] = useState<number | ''>('');
  const [priceMaxInput, setPriceMaxInput] = useState<number | ''>('');
  const [compositionInput, setCompositionInput] = useState('');
  const [shelfLifeInput, setShelfLifeInput] = useState('');
  const [attributesInput, setAttributesInput] = useState('');
  const [unitInput, setUnitInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [originInput, setOriginInput] = useState('');
  const [waContactInput, setWaContactInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [shippingInfoInput, setShippingInfoInput] = useState('');
  // Galeri produk (maks 4 gambar, diedit admin): URL gambar galeri + file upload per slot.
  // Gambar pertama (index 0) = gambar UTAMA produk (primary). Admin tidak perlu
  // upload "Foto & Visual" terpisah lagi — cukup 4 slot galeri, pilih 1 jadi utama.
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<(File | null)[]>([null, null, null, null]);

  // H3-5: jadikan gambar galeri idx sebagai gambar utama (primary).
  // Gambar index 0 = primary (replaceProductImages di BE menjadikan elemen
  // pertama is_primary=1). Cukup pindahkan URL ke posisi 0.
  const setPrimaryGallery = (idx: number) => {
    setGalleryImages((prev) => {
      const url = prev[idx];
      if (!url) return prev;
      const next = [url, ...prev.filter((_, i) => i !== idx)];
      return next.slice(0, 4);
    });
  };

  useEffect(() => {
    if (initialProduct) {
      setIdInput(initialProduct.id);
      setNameInput(initialProduct.name);
      setCategoryInput(initialProduct.category);
      // Sinkron categoryId ke kategori BE (kalau ada di options)
      const catMatch = categoryOptions?.find((c) => c.name.toLowerCase().includes(initialProduct.category));
      setCategoryIdInput(catMatch?.id);
      setPriceInput(initialProduct.price);
      setPriceMaxInput(initialProduct.priceMax ?? '');
      setCompositionInput(initialProduct.composition || '');
      setShelfLifeInput(initialProduct.shelfLife || '');
      setAttributesInput(initialProduct.attributes || '');
      setUnitInput(initialProduct.unitInfo || '');
      setWeightInput(initialProduct.weight || '');
      setOriginInput(initialProduct.origin || '');
      // Tampilkan nomor WA tanpa prefix (admin hanya lihat/isi digit setelah +62).
      const storedWa = initialProduct.waContact || '';
      const waDigits = storedWa.replace(/[^0-9]/g, '');
      setWaContactInput(waDigits.startsWith('62') ? waDigits.slice(2) : waDigits);
      setDescInput(initialProduct.description || '');
      setShippingInfoInput(initialProduct.shippingInfo || '');
      // Galeri dari DB (product.images) — max 4, urut sort_order
      setGalleryImages((initialProduct.images || []).map((img) => img.image_url).slice(0, 4));
    } else {
      setIdInput('');
      setNameInput('');
      setCategoryInput('beras');
      setCategoryIdInput(undefined);
      setPriceInput('');
      setPriceMaxInput('');
      setCompositionInput('');
      setShelfLifeInput('');
      setAttributesInput('');
      setUnitInput('');
      setWeightInput('');
      setOriginInput('');
      setWaContactInput('');
      setDescInput('');
      setShippingInfoInput('');
      setGalleryImages([]);
      setGalleryFiles([null, null, null, null]);
    }
  }, [initialProduct, categoryOptions]);

  // Upload gambar ke slot galeri tertentu (0-3) — preview dataURL, upload final saat save.
  const handleGalleryFileChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setGalleryImages((prev) => {
        const next = [...prev];
        next[idx] = reader.result as string;
        return next;
      });
      setGalleryFiles((prev) => {
        const next = [...prev];
        next[idx] = file;
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  const removeGalleryImage = (idx: number) => {
    setGalleryImages((prev) => {
      const next = [...prev];
      next[idx] = '';
      return next;
    });
    setGalleryFiles((prev) => {
      const next = [...prev];
      next[idx] = null;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      showToast('Masukkan nama produk!');
      return;
    }

    const priceNum = Number(priceInput) || 0;
    const priceMaxNum = priceMaxInput !== '' ? Number(priceMaxInput) : undefined;

    // Upload galeri: file baru (dataURL) → kompres → upload → URL final.
    // Slot kosong/URL lama dibiarkan (URL lama tidak perlu di-upload ulang).
    // Gambar utama produk = gambar galeri pertama (index 0) yang ter-upload/ada.
    const finalGallery: string[] = [];
    for (let i = 0; i < galleryImages.length; i++) {
      const val = galleryImages[i];
      if (!val) continue;
      const file = galleryFiles[i];
      if (file) {
        try {
          const { productAdminApi } = await import('../../api/adminApi');
          const { compressImage } = await import('../../utils/imageCompress');
          const toUpload = await compressImage(file, 800);
          const uploadedUrl = await productAdminApi.uploadImage(toUpload);
          if (uploadedUrl) finalGallery.push(uploadedUrl);
          else showToast(`Gagal upload gambar galeri #${i + 1}.`);
        } catch (err: any) {
          showToast(err?.message || `Gagal upload gambar galeri #${i + 1}.`);
          return;
        }
      } else {
        // URL lama / dataURL yang tidak punya file (user paste URL)
        finalGallery.push(val);
      }
    }

    // Nomor WA: admin hanya mengetik digit setelah +62 (format 8xx). Simpan dengan prefix 62.
    // Contoh: ketik "812...890" → simpan "62812...890". Kosong tetap kosong (pakai nomor toko).
    const rawWa = (waContactInput || '').replace(/[^0-9]/g, '');
    const waWithPrefix = rawWa ? `62${rawWa}` : '';

    // Gambar utama = gambar pertama galeri (kosong kalau tidak ada gambar sama sekali).
    const primaryImage = finalGallery[0] || '';

    onSave({
      id: idInput || initialProduct?.id,
      categoryId: categoryIdInput,
      name: nameInput,
      category: categoryInput,
      price: priceNum,
      priceMax: priceMaxNum && priceMaxNum > priceNum ? priceMaxNum : undefined,
      composition: compositionInput,
      shelfLife: shelfLifeInput,
      attributes: attributesInput,
      // Ukuran/Kemasan (weight_spec) — diisi admin langsung dari form, bukan hardcoded.
      unitInfo: unitInput.trim() || null,
      weight: weightInput || '1kg',
      origin: originInput,
      waContact: waWithPrefix || undefined,
      image: primaryImage,
      description: descInput,
      shippingInfo: shippingInfoInput,
      galleryImages: finalGallery,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      {/* Header & Breadcrumbs */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-[#556353] dark:text-white/60 mb-1">
            <ol className="flex items-center space-x-2">
              <li>
                <button
                  type="button"
                  onClick={onCancel}
                  className="hover:text-[#1F5132] dark:hover:text-[#86EFAC] transition-colors cursor-pointer"
                >
                  Kelola Produk
                </button>
              </li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">
                  chevron_right
                </span>
              </li>
              <li className="text-[#1F5132] dark:text-[#86EFAC] font-bold">
                {initialProduct ? 'Edit Katalog Produk' : 'Tambah Produk Baru'}
              </li>
            </ol>
          </nav>
          <h2 className="font-['Plus_Jakarta_Sans'] text-2xl md:text-3xl font-extrabold text-[#14331C] dark:text-[#F4F8F3] tracking-tight">
            {initialProduct ? 'Edit Produk' : 'Halaman Tambah Produk Baru'}
          </h2>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="bg-white dark:bg-[#0E1A11] border border-[#E2EFE0] dark:border-white/10 text-[#1F5132] dark:text-[#86EFAC] px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 hover:bg-[#EAF6E8] transition-all cursor-pointer font-bold text-xs shadow-2xs"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Kembali</span>
        </button>
      </section>

      {/* Form Card */}
      <div className="bg-[#FFFFFF] rounded-2xl shadow-2xs border border-[#E0E0E0] overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Galeri Produk (4 Gambar) — foto produk; gambar pertama = gambar utama */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-[#1B5E20]">
                Foto Produk (maks. 4 Gambar)
              </label>
              <p className="text-xs text-[#555555] mt-0.5">
                Gambar pertama menjadi gambar utama produk. Upload 1-4 foto; untuk mengganti
                gambar utama, klik "Jadikan Utama" pada foto pilihan.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((idx) => {
                const val = galleryImages[idx] || '';
                return (
                  <div key={idx} className="relative">
                    <input
                      type="file"
                      id={`gallery-file-input-${idx}`}
                      accept="image/*"
                      onChange={(e) => handleGalleryFileChange(idx, e)}
                      className="hidden"
                    />
                    <label
                      htmlFor={`gallery-file-input-${idx}`}
                      className={`block border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-all ${
                        val
                          ? 'border-[#A5D6A7] bg-[#F7F8F6]'
                          : 'border-[#E0E0E0] bg-[#F7F8F6] hover:border-[#2E7D32]'
                      }`}
                    >
                      {val ? (
                        <div className="relative aspect-square">
                          <img
                            src={val}
                            alt={`Galeri ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-white text-xs font-bold">Ganti</span>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-square flex flex-col items-center justify-center gap-1">
                          <span className="material-symbols-outlined text-2xl text-[#2E7D32]">
                            add_photo_alternate
                          </span>
                          <span className="text-[10px] text-[#555555] font-semibold">
                            {idx === 0 ? 'Foto Utama' : `Foto ${idx + 1}`}
                          </span>
                        </div>
                      )}
                    </label>
                    {val && (
                      <>
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(idx)}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#D32F2F] text-white flex items-center justify-center shadow-md hover:bg-[#B71C1C] transition-colors cursor-pointer"
                          title="Hapus gambar ini"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                        {/* H3-5: gambar Utama (index 0) / tombol Jadikan Utama (slot lain) */}
                        {idx === 0 ? (
                          <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#2E7D32] text-white text-[9px] font-extrabold uppercase tracking-wide shadow">
                            Utama
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPrimaryGallery(idx)}
                            className="absolute bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/70 text-white text-[9px] font-bold uppercase tracking-wide hover:bg-[#2E7D32] transition-colors cursor-pointer whitespace-nowrap"
                            title="Jadikan gambar utama"
                          >
                            Jadikan Utama
                          </button>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row 1: Nama & Kategori */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1B5E20]">
                Nama Produk <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Contoh: Sorgum Putih Organic 1kg"
                required
                className="w-full bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl p-3.5 text-xs sm:text-sm text-[#1B5E20] focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32] outline-none font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1B5E20]">
                Kategori Produk
              </label>
              <select
                value={categoryIdInput !== undefined ? `cat-${categoryIdInput}` : categoryInput}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.startsWith('cat-')) {
                    const id = Number(v.slice(4));
                    setCategoryIdInput(id);
                    // cari nama kategori utk update label fallback
                    const match = categoryOptions?.find((c) => c.id === id);
                    setCategoryInput((match?.name.toLowerCase().includes('tepung') ? 'tepung'
                      : match?.name.toLowerCase().includes('camilan') ? 'camilan'
                      : match?.name.toLowerCase().includes('pemanis') ? 'pemanis'
                      : match?.name.toLowerCase().includes('benih') ? 'benih'
                      : 'beras') as any);
                  } else {
                    setCategoryIdInput(undefined);
                    setCategoryInput(v as any);
                  }
                }}
                className="w-full bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl p-3.5 text-xs sm:text-sm text-[#1B5E20] focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32] outline-none cursor-pointer font-medium"
              >
                {categoryOptions && categoryOptions.length > 0 ? (
                  <>
                    {categoryOptions.map((c) => (
                      <option key={c.id} value={`cat-${c.id}`}>{c.name}</option>
                    ))}
                  </>
                ) : (
                  <>
                    <option value="beras">Beras Sorgum</option>
                    <option value="tepung">Tepung Sorgum</option>
                    <option value="camilan">Camilan Sehat</option>
                    <option value="pemanis">Pemanis Alami</option>
                    <option value="benih">Benih Sorgum</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Row 2: Harga (Rentang) + Ukuran/Kemasan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1B5E20]">
                Harga Minimum / Satuan (Rp) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value ? Number(e.target.value) : '')}
                placeholder="45000"
                required
                className="w-full bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl p-3.5 text-xs sm:text-sm text-[#1B5E20] focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32] outline-none font-mono"
              />
              <p className="text-[10px] text-[#555555]">Harga dasar atau batas bawah rentang harga produk.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1B5E20]">
                Harga Maksimum (Rp)
              </label>
              <input
                type="number"
                value={priceMaxInput}
                onChange={(e) => setPriceMaxInput(e.target.value ? Number(e.target.value) : '')}
                placeholder="Contoh: 95000"
                className="w-full bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl p-3.5 text-xs sm:text-sm text-[#1B5E20] focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32] outline-none font-mono"
              />
              <p className="text-[10px] text-[#555555]">Kosongkan jika produk memiliki satu harga tetap (bukan rentang harga).</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1B5E20]">
                Ukuran / Kemasan
              </label>
              <input
                type="text"
                value={unitInput}
                onChange={(e) => setUnitInput(e.target.value)}
                placeholder="Contoh: 500gr / Pouch, 1kg / Vacuum"
                className="w-full bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl p-3.5 text-xs sm:text-sm text-[#1B5E20] focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32] outline-none font-medium"
              />
              <p className="text-[10px] text-[#555555]">Ukuran/kemasan yang tampil di kartu & detail produk (contoh: 500gr / Pouch).</p>
            </div>
          </div>

          {/* Row 3: Nomor WA (+62) & Informasi Pengiriman (sebelah-menyebelah) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1B5E20]">
                Nomor WhatsApp Pemilik Produk
              </label>
              <div className="flex items-stretch">
                <span className="inline-flex items-center px-3.5 border border-r-0 border-[#E0E0E0] bg-[#F0F4EF] text-[#1B5E20] text-sm font-mono font-bold rounded-l-xl">
                  +62
                </span>
                <input
                  type="tel"
                  value={waContactInput}
                  onChange={(e) => setWaContactInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="81234567890 (kosongkan = pakai nomor toko)"
                  className="w-full bg-[#F7F8F6] border border-[#E0E0E0] rounded-r-xl p-3.5 text-xs sm:text-sm text-[#1B5E20] focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32] outline-none font-mono"
                />
              </div>
              <p className="text-[10px] text-[#555555]">
                Cukup ketik angka setelah +62 (contoh: 81234567890). Kosongkan jika ingin memakai nomor WhatsApp toko (Pengaturan Toko).
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1B5E20]">
                Informasi Pengiriman
              </label>
              <textarea
                rows={3}
                value={shippingInfoInput}
                onChange={(e) => setShippingInfoInput(e.target.value)}
                placeholder="Contoh: Dikirim dari Yogyakarta. Diproses sebelum jam 15:00 WIB."
                className="w-full bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl p-3.5 text-xs sm:text-sm text-[#1B5E20] focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32] outline-none font-medium"
              />
            </div>
          </div>

          {/* Row 4: Deskripsi */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#1B5E20]">
              Deskripsi Produk
            </label>
            <textarea
              rows={3}
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
              placeholder="Tuliskan deskripsi ringkas mengenai nutrisi, pengolahan, dan manfaat produk..."
              className="w-full bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl p-3.5 text-xs sm:text-sm text-[#1B5E20] focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32] outline-none font-medium"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4 space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 rounded-xl border border-[#E2EFE0] dark:border-white/10 text-[#556353] dark:text-white/60 font-bold text-xs hover:bg-[#EAF6E8] transition-all cursor-pointer"
            >
              Batalkan
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-[#3A8F4B] to-[#65B86B] hover:from-[#2F773E] hover:to-[#559E5B] text-white px-8 py-2.5 rounded-xl font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              {initialProduct ? 'Simpan Perubahan Produk' : 'Simpan Produk Baru'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
