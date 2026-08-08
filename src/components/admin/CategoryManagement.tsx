import React, { useState, useEffect, useCallback } from 'react';
import { categoryAdminApi, CategoryItem } from '../../api/adminApi';

interface CategoryManagementProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onCategoriesChange?: (categories: CategoryItem[]) => void;
}

/**
 * Kelola Kategori (di Kelola Lain).
 * CRUD kategori + auto-generate slug. List kategori di-sync ke dropdown kategori
 * di form Kelola Produk lewat onCategoriesChange.
 */
const CategoryManagement: React.FC<CategoryManagementProps> = ({ showToast, onCategoriesChange }) => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const toSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60);

  const load = useCallback(async () => {
    try {
      const list = await categoryAdminApi.list();
      setCategories(list);
      onCategoriesChange?.(list);
    } catch (e: any) {
      showToast(e?.message || 'Gagal memuat daftar kategori');
    } finally {
      setLoading(false);
    }
  }, [showToast, onCategoriesChange]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      showToast('Nama kategori wajib diisi');
      return;
    }
    setSaving(true);
    try {
      await categoryAdminApi.create(name, toSlug(name));
      showToast('Kategori berhasil ditambahkan');
      setNewName('');
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Gagal menambah kategori', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: number) => {
    const name = editName.trim();
    if (!name) {
      showToast('Nama kategori wajib diisi');
      return;
    }
    setSaving(true);
    try {
      await categoryAdminApi.update(id, name, toSlug(name));
      showToast('Kategori berhasil diupdate');
      setEditingId(null);
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Gagal mengupdate kategori', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: CategoryItem) => {
    if (!confirm(`Hapus kategori "${cat.name}"? Produk dalam kategori ini bisa kehilangan kategorinya.`)) return;
    try {
      await categoryAdminApi.remove(cat.id);
      showToast('Kategori berhasil dihapus');
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Gagal menghapus kategori', 'error');
    }
  };

  return (
    <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E0E0E0] shadow-2xs space-y-4">
      <div className="flex items-center gap-2.5 border-b border-[#E0E0E0] pb-3">
        <span className="material-symbols-outlined text-xl text-[#1B5E20]">category</span>
        <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#1B5E20]">Kelola Kategori</h3>
      </div>

      {/* Form tambah kategori */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="Nama kategori baru (misal: Minuman Sorgum)"
          className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E0E0E0] bg-[#F7F8F6] focus:outline-none focus:ring-1 focus:ring-[#2E7D32] text-[#1B5E20] font-medium"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={saving}
          className="px-4 py-2.5 text-xs font-bold text-white bg-[#2E7D32] rounded-xl hover:bg-[#1B5E20] transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
        >
          + Tambah
        </button>
      </div>

      {/* Daftar kategori */}
      {loading ? (
        <p className="text-xs text-[#555555]">Memuat...</p>
      ) : categories.length === 0 ? (
        <p className="text-xs text-[#555555]">Belum ada kategori. Tambahkan di atas.</p>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[#E0E0E0] bg-[#F7F8F6]"
            >
              {editingId === cat.id ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate(cat.id)}
                    autoFocus
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#E0E0E0] bg-[#FFFFFF] text-[#1B5E20] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdate(cat.id)}
                    className="px-2.5 py-1.5 text-xs font-bold text-white bg-[#2E7D32] hover:bg-[#1B5E20] rounded-lg cursor-pointer"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-2.5 py-1.5 text-xs font-bold text-[#555555] border border-[#E0E0E0] bg-[#FFFFFF] hover:bg-[#F7F8F6] rounded-lg cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9] rounded-lg truncate">
                      {cat.name}
                    </span>
                    <span className="text-[10px] font-mono text-[#555555] truncate">/{cat.slug}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditName(cat.name);
                      }}
                      className="p-1.5 text-xs text-[#1B5E20] hover:bg-[#E8F5E9] rounded-lg cursor-pointer"
                      title="Edit kategori"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat)}
                      className="p-1.5 text-xs text-[#D32F2F] hover:bg-[#FFEBEE] rounded-lg cursor-pointer"
                      title="Hapus kategori"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-[#555555]">
        Kategori tampil di dropdown kategori pada form Kelola Produk &amp; filter kategori di toko.
      </p>
    </div>
  );
};

export default CategoryManagement;
