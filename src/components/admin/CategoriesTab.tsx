import React, { useState, useEffect, useCallback } from 'react';
import { categoryAdminApi } from '../../api/adminApi';

interface CategoryRow {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
  product_count: number;
}

interface CategoriesTabProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
  /** Dipanggil setelah kategori berubah, supaya dropdown form produk ikut refresh. */
  onDataChanged?: () => void;
  /** Tampil sebagai seksi di dalam halaman lain (tanpa breadcrumb & judul halaman). */
  embedded?: boolean;
}

export const CategoriesTab: React.FC<CategoriesTabProps> = ({ showToast, onDataChanged, embedded = false }) => {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  // null = mode daftar; -1 = tambah baru; >0 = edit kategori dengan id tsb.
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [sortOrderInput, setSortOrderInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await categoryAdminApi.listCategories();
      setCategories(Array.isArray(list) ? list : []);
    } catch {
      showToast('Gagal memuat kategori.', 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditingId(-1);
    setNameInput('');
    setSortOrderInput('');
  };

  const openEdit = (c: CategoryRow) => {
    setEditingId(c.id);
    setNameInput(c.name);
    setSortOrderInput(String(c.sort_order ?? 0));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNameInput('');
    setSortOrderInput('');
  };

  const handleSave = async () => {
    const name = nameInput.trim();
    if (name.length < 2) {
      showToast('Nama kategori minimal 2 karakter.', 'error');
      return;
    }
    setSaving(true);
    try {
      const sortOrder = Number(sortOrderInput) || 0;
      if (editingId === -1) {
        await categoryAdminApi.createCategory({ name, sort_order: sortOrder });
        showToast(`Kategori "${name}" berhasil ditambahkan!`);
      } else if (editingId !== null) {
        await categoryAdminApi.updateCategory(String(editingId), { name, sort_order: sortOrder });
        showToast('Kategori berhasil diperbarui!');
      }
      await load();
      onDataChanged?.();
      cancelEdit();
    } catch (e: any) {
      showToast(e?.message || 'Gagal menyimpan kategori.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: CategoryRow) => {
    if (!window.confirm(`Hapus kategori "${c.name}"?`)) return;
    setDeletingId(c.id);
    try {
      await categoryAdminApi.deleteCategory(String(c.id));
      showToast(`Kategori "${c.name}" dihapus.`);
      await load();
      onDataChanged?.();
    } catch (e: any) {
      showToast(e?.message || 'Gagal menghapus kategori.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn w-full max-w-full overflow-hidden">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {!embedded && (
            <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-[#556353] dark:text-white/60 mb-1">
              <ol className="flex items-center space-x-2">
                <li>Dashboard</li>
                <li>
                  <span className="material-symbols-outlined text-xs leading-none">chevron_right</span>
                </li>
                <li className="text-[#1F5132] dark:text-[#86EFAC] font-bold">Kelola Kategori</li>
              </ol>
            </nav>
          )}
          <h2
            className={`font-['Plus_Jakarta_Sans'] font-extrabold text-[#14331C] dark:text-[#F4F8F3] tracking-tight ${
              embedded ? 'text-lg sm:text-xl' : 'text-2xl md:text-3xl'
            }`}
          >
            Kelola Kategori Produk
          </h2>
          <p className="text-xs text-[#556353] dark:text-white/60 mt-1">
            Tambah dan atur kategori yang tampil di dropdown form produk.
          </p>
        </div>

        {editingId === null && (
          <button
            type="button"
            onClick={openCreate}
            className="bg-gradient-to-r from-[#3A8F4B] to-[#65B86B] hover:from-[#2F773E] hover:to-[#559E5B] text-white px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Tambah Kategori</span>
          </button>
        )}
      </div>

      {/* Form Tambah/Edit Kategori */}
      {editingId !== null && (
        <div className="bg-white dark:bg-[#0E1A11] p-5 rounded-2xl border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] shadow-xs">
          <h3 className="font-['Plus_Jakarta_Sans'] text-base font-extrabold text-[#14331C] dark:text-[#F4F8F3] mb-4">
            {editingId === -1 ? 'Tambah Kategori Baru' : 'Edit Kategori'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1F5132] dark:text-[#F4F8F3]">
                Nama Kategori <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Contoh: Minuman Sorgum"
                className="w-full px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-[#E2EFE0] dark:border-white/10 bg-[#F9FBF7] dark:bg-[#162419] focus:bg-white dark:focus:bg-[#1B2C1F] focus:outline-none focus:border-[#3A8F4B] focus:ring-1 focus:ring-[#3A8F4B] text-[#1F5132] dark:text-[#F4F8F3]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1F5132] dark:text-[#F4F8F3]">
                Urutan Tampil (opsional)
              </label>
              <input
                type="number"
                value={sortOrderInput}
                onChange={(e) => setSortOrderInput(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-[#E2EFE0] dark:border-white/10 bg-[#F9FBF7] dark:bg-[#162419] focus:bg-white dark:focus:bg-[#1B2C1F] focus:outline-none focus:border-[#3A8F4B] focus:ring-1 focus:ring-[#3A8F4B] text-[#1F5132] dark:text-[#F4F8F3]"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-[#3A8F4B] to-[#65B86B] hover:from-[#2F773E] hover:to-[#559E5B] text-white px-4 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[15px]">save</span>
              <span>{saving ? 'Menyimpan...' : 'Simpan Kategori'}</span>
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-1.5 rounded-lg border border-[#E2EFE0] dark:border-white/10 text-[#556353] dark:text-white/70 hover:bg-[#EAF6E8] text-xs font-semibold transition-all cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Daftar Kategori */}
      <div className="bg-white dark:bg-[#0E1A11] rounded-2xl border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E2EFE0] dark:border-white/10">
          <h3 className="font-['Plus_Jakarta_Sans'] text-base sm:text-lg font-bold text-[#14331C] dark:text-[#F4F8F3]">
            Daftar Kategori ({categories.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-6 text-center text-xs text-[#556353] dark:text-white/60">Memuat kategori...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#556353] dark:text-white/60">
            Belum ada kategori. Klik "Tambah Kategori" untuk mulai.
          </div>
        ) : (
          <div className="divide-y divide-[#E2EFE0] dark:divide-white/10">
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-[#F9FBF7] dark:hover:bg-[#0A150D] transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-[#14331C] dark:text-[#F4F8F3] font-['Plus_Jakarta_Sans']">
                      {c.name}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-[#EAF6E8] dark:bg-[#152718] text-[#1F5132] dark:text-[#86EFAC] rounded-md border border-[#3A8F4B]/20">
                      {c.product_count} produk
                    </span>
                  </div>
                  <p className="text-[11px] text-[#556353] dark:text-white/60">
                    Urutan: {c.sort_order} · slug: {c.slug}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    className="w-8 h-8 rounded-lg bg-[#EAF6E8] hover:bg-[#D7EED3] dark:bg-[#152718] dark:hover:bg-[#1B3320] text-[#1F5132] dark:text-[#86EFAC] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                    title="Edit kategori"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c)}
                    disabled={deletingId === c.id}
                    className="w-8 h-8 rounded-lg bg-[#FFEBEE] hover:bg-[#FFCDD2] dark:bg-[#2A1215] dark:hover:bg-[#3B171B] text-[#D32F2F] flex items-center justify-center transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                    title="Hapus kategori"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
