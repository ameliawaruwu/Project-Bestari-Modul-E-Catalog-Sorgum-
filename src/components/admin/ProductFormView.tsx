import React, { useState, useEffect } from 'react';
import { Product } from '../../types';

interface ProductFormViewProps {
  initialProduct?: Product | null;
  initialStock?: number;
  onSave: (productData: {
    id?: string;
    categoryId?: number;
    name: string;
    category: 'beras' | 'tepung' | 'camilan' | 'pemanis' | 'benih';
    price: number;
    unitInfo: string;
    weight: string;
    badge: string | undefined;
    image: string;
    stock: number;
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
  /** Opsi badge dinamis dari Kelola Badge (jika ada) */
  badgeOptions?: string[];
  /** Opsi kategori dinamis dari Kelola Kategori (jika ada) */
  categoryOptions?: { id?: number; name: string; slug: string }[];
}

export const ProductFormView: React.FC<ProductFormViewProps> = ({
  initialProduct,
  initialStock = 100,
  onSave,
  onCancel,
  showToast,
  badgeOptions,
  categoryOptions,
}) => {
  const [idInput, setIdInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<
    'beras' | 'tepung' | 'camilan' | 'pemanis' | 'benih'
  >('beras');
  const [categoryIdInput, setCategoryIdInput] = useState<number | undefined>(undefined);
  const [priceInput, setPriceInput] = useState<number | ''>('');
  const [compositionInput, setCompositionInput] = useState('');
  const [shelfLifeInput, setShelfLifeInput] = useState('');
  const [attributesInput, setAttributesInput] = useState('');
  const [unitInput, setUnitInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [originInput, setOriginInput] = useState('');
  const [badgeInput, setBadgeInput] = useState<string>('');
  const [imageInput, setImageInput] = useState('');
  const [stockInput, setStockInput] = useState<number | ''>('');
  const [descInput, setDescInput] = useState('');
  const [shippingInfoInput, setShippingInfoInput] = useState('');
  // Galeri produk (maks 4 gambar, diedit admin): URL gambar galeri + file upload per slot
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
      setCompositionInput(initialProduct.composition || '');
      setShelfLifeInput(initialProduct.shelfLife || '');
      setAttributesInput(initialProduct.attributes || '');
      setUnitInput(initialProduct.unitInfo || '');
      setWeightInput(initialProduct.weight || '');
      setOriginInput(initialProduct.origin || '');
      setBadgeInput(initialProduct.badge || '');
      setImageInput(initialProduct.image || '');
      setStockInput(initialStock);
      setDescInput(initialProduct.description || '');
      setShippingInfoInput(initialProduct.shippingInfo || '');
      // Galeri dari DB (product.images) — max 4, urut sort_order
      setGalleryImages((initialProduct.images || []).map((img) => img.image_url).slice(0, 4));
      // Badge yang sudah tidak terdaftar di Kelola Badge → reset ke kosong (cegah badge yatim tampil)
      if (initialProduct.badge && badgeOptions && badgeOptions.length > 0 && !badgeOptions.includes(initialProduct.badge)) {
        setBadgeInput('');
      }
    } else {
      setIdInput('');
      setNameInput('');
      setCategoryInput('beras');
      setCategoryIdInput(undefined);
      setPriceInput('');
      setCompositionInput('');
      setShelfLifeInput('');
      setAttributesInput('');
      setUnitInput('');
      setWeightInput('');
      setOriginInput('');
      setBadgeInput('');
      setImageInput('');
      setStockInput('');
      setDescInput('');
      setShippingInfoInput('');
      setGalleryImages([]);
      setGalleryFiles([null, null, null, null]);
    }
  }, [initialProduct, initialStock, categoryOptions]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageInput(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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

  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      showToast('Masukkan nama produk!');
      return;
    }

    const priceNum = Number(priceInput) || 0;
    const stockNum = Number(stockInput) || 0;

    // Upload galeri: file baru (dataURL) → kompres → upload → URL final.
    // Slot kosong/URL lama dibiarkan (URL lama tidak perlu di-upload ulang).
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

    // Kalau ada file baru → kompres dulu (lolos limit nginx/multer), upload, dapat URL
    let finalImage = imageInput; // dataURL preview / URL lama
    if (imageFile) {
      try {
        const { productAdminApi } = await import('../../api/adminApi');
        const { compressImage } = await import('../../utils/imageCompress');
        const toUpload = await compressImage(imageFile, 800);
        const uploadedUrl = await productAdminApi.uploadImage(toUpload);
        if (uploadedUrl) finalImage = uploadedUrl;
        else showToast('Gagal upload gambar.');
      } catch (err: any) {
        showToast(err?.message || 'Gagal upload gambar.');
        return;
      }
    }

    onSave({
      id: idInput || initialProduct?.id,
      categoryId: categoryIdInput,
      name: nameInput,
      category: categoryInput,
      price: priceNum,
      stock: stockNum,
      composition: compositionInput,
      shelfLife: shelfLifeInput,
      attributes: attributesInput,
      unitInfo: unitInput || `${weightInput || '1kg'} / Premium`,
      weight: weightInput || '1kg',
      origin: originInput,
      badge: (badgeInput as any) || undefined,
      image: finalImage,
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
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-[#555555] mb-1">
            <ol className="flex items-center space-x-2">
              <li>
                <button
                  type="button"
                  onClick={onCancel}
                  className="hover:text-[#1B5E20] transition-colors cursor-pointer"
                >
                  Kelola Produk
                </button>
              </li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">
                  chevron_right
                </span>
              </li>
              <li className="text-[#1B5E20] font-bold">
                {initialProduct ? 'Edit Katalog Produk' : 'Tambah Produk Baru'}
              </li>
            </ol>
          </nav>
          <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1B5E20]">
            {initialProduct ? 'Edit Produk' : 'Halaman Tambah Produk Baru'}
          </h2>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="bg-[#FFFFFF] border border-[#E0E0E0] text-[#1B5E20] px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 hover:bg-[#E8F5E9] transition-all cursor-pointer font-bold text-xs shadow-2xs"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Kembali</span>
        </button>
      </section>

      {/* Form Card */}
      <div className="bg-[#FFFFFF] rounded-2xl shadow-2xs border border-[#E0E0E0] overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Upload Gambar Field (Local Device Upload Only) */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-[#1B5E20]">
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
              className="block border-2 border-dashed border-[#E0E0E0] rounded-2xl p-6 text-center bg-[#F7F8F6] hover:border-[#2E7D32] transition-all group relative cursor-pointer"
            >
              <div className="space-y-3">
                {imageInput ? (
                  <div className="relative w-28 h-28 mx-auto rounded-xl overflow-hidden border border-[#E0E0E0] shadow-2xs">
                    <img src={imageInput} alt="Preview Produk" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-bold">Pilih Gambar Baru</span>
                    </div>
                  </div>
                ) : (
                  <span className="material-symbols-outlined text-5xl text-[#2E7D32] group-hover:text-[#1B5E20] transition-colors">
                    cloud_upload
                  </span>
                )}
                <div>
                  <p className="text-sm font-semibold text-[#1B5E20]">
                    Klik untuk memilih foto produk dari perangkat Anda
                  </p>
                  <p className="text-xs text-[#555555]">Format JPG/PNG, rekomendasi 800x800 px</p>
                </div>
              </div>
            </label>
          </div>

          {/* Galeri Produk (4 Gambar) — foto tambahan di halaman detail produk */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-[#1B5E20]">
                Galeri Produk (maks. 4 Gambar)
              </label>
              <p className="text-xs text-[#555555] mt-0.5">
                Gambar tambahan yang tampil di halaman detail produk. Slot kosong diabaikan.
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
                            Gambar {idx + 1}
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
                        {/* H3-5: badge Utama (index 0) / tombol Jadikan Utama (slot lain) */}
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

          {/* Row 2: Harga */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1B5E20]">
                Harga Satuan (Rp) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value ? Number(e.target.value) : '')}
                placeholder="45000"
                required
                className="w-full bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl p-3.5 text-xs sm:text-sm text-[#1B5E20] focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32] outline-none font-mono"
              />
              <p className="text-[10px] text-[#555555]">Harga jual produk yang tampil di katalog.</p>
            </div>

            {/* Row 3: Stok & Badge */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1B5E20]">
                Jumlah Stok (Unit)
              </label>
              <input
                type="number"
                value={stockInput}
                onChange={(e) => setStockInput(e.target.value ? Number(e.target.value) : '')}
                placeholder="100"
                className="w-full bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl p-3.5 text-xs sm:text-sm text-[#1B5E20] focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32] outline-none font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1B5E20]">
                Badge Highlight Produk
              </label>
              <select
                value={badgeInput}
                onChange={(e) => setBadgeInput(e.target.value)}
                className="w-full bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl p-3.5 text-xs sm:text-sm text-[#1B5E20] focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32] outline-none cursor-pointer"
              >
                <option value="">Tidak Ada Badge</option>
                {(badgeOptions && badgeOptions.length > 0 ? badgeOptions : []).map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              {(!badgeOptions || badgeOptions.length === 0) && (
                <p className="text-[10px] text-[#C89B3C]">
                  Belum ada badge. Tambahkan dulu di Kelola Lain → Kelola Badge.
                </p>
              )}
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

          {/* Row: Informasi Pengiriman */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1B5E20]">
                Informasi Pengiriman
              </label>
              <textarea
                rows={2}
                value={shippingInfoInput}
                onChange={(e) => setShippingInfoInput(e.target.value)}
                placeholder="Contoh: Dikirim dari Yogyakarta. Diproses sebelum jam 15:00 WIB."
                className="w-full bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl p-3.5 text-xs sm:text-sm text-[#1B5E20] focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32] outline-none font-medium"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4 space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 rounded-xl border border-[#E0E0E0] text-[#555555] font-bold text-xs hover:bg-[#F7F8F6] transition-all cursor-pointer"
            >
              Batalkan
            </button>
            <button
              type="submit"
              className="bg-[#2E7D32] text-white px-8 py-2.5 rounded-xl font-bold text-xs hover:bg-[#1B5E20] shadow-2xs active:scale-95 transition-all cursor-pointer"
            >
              {initialProduct ? 'Simpan Perubahan Produk' : 'Simpan Produk Baru'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
