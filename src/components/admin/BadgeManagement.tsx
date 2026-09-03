import React, { useState, useEffect, useCallback } from 'react';
import { badgeAdminApi, BadgeItem } from '../../api/adminApi';

interface BadgeManagementProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onBadgesChange?: (badges: BadgeItem[]) => void;
}

/**
 * Kelola Badge (di Kelola Lain).
 * CRUD badge + toggle aktif. List badge di-sync ke dropdown "Badge Highlight Produk"
 * di form Kelola Produk lewat onBadgesChange.
 */
const BadgeManagement: React.FC<BadgeManagementProps> = ({ showToast, onBadgesChange }) => {
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await badgeAdminApi.list();
      setBadges(list);
      onBadgesChange?.(list);
    } catch (e: any) {
      showToast(e?.message || 'Gagal memuat daftar badge');
    } finally {
      setLoading(false);
    }
  }, [showToast, onBadgesChange]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      showToast('Nama badge wajib diisi');
      return;
    }
    setSaving(true);
    try {
      await badgeAdminApi.create(name);
      showToast('Badge berhasil ditambahkan');
      setNewName('');
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Gagal menambah badge', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: number) => {
    const name = editName.trim();
    if (!name) {
      showToast('Nama badge wajib diisi');
      return;
    }
    setSaving(true);
    try {
      await badgeAdminApi.update(id, name, true);
      showToast('Badge berhasil diupdate');
      setEditingId(null);
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Gagal mengupdate badge', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (badge: BadgeItem) => {
    try {
      await badgeAdminApi.update(badge.id, badge.name, !badge.is_active);
      showToast(badge.is_active ? 'Badge dinonaktifkan' : 'Badge diaktifkan');
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Gagal mengubah status badge', 'error');
    }
  };

  const handleDelete = async (badge: BadgeItem) => {
    if (!confirm(`Hapus badge "${badge.name}"? Produk yang memakai badge ini akan kehilangan badge-nya.`)) return;
    try {
      await badgeAdminApi.remove(badge.id);
      showToast('Badge berhasil dihapus');
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Gagal menghapus badge', 'error');
    }
  };

  return (
    <div className="bg-white dark:bg-[#0E1A11] p-5 sm:p-6 rounded-2xl border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] shadow-xs space-y-4">
      <div className="flex items-center gap-2.5 border-b border-[#E2EFE0] dark:border-white/10 pb-3">
        <span className="material-symbols-outlined text-xl text-[#1F5132] dark:text-[#86EFAC]">sell</span>
        <h3 className="font-['Plus_Jakarta_Sans'] text-base sm:text-lg font-extrabold text-[#1F5132] dark:text-[#F4F8F3]">
          Kelola Badge
        </h3>
      </div>

      {/* Form tambah badge */}
      <div className="flex gap-2.5 items-center">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="Nama badge baru (misal: PROMO 50%)"
          className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2EFE0] dark:border-white/10 bg-[#F9FBF7] dark:bg-[#162419] focus:bg-white dark:focus:bg-[#1B2C1F] focus:outline-none focus:border-[#3A8F4B] focus:ring-1 focus:ring-[#3A8F4B] text-[#1F5132] dark:text-[#F4F8F3] placeholder-[#556353]/60 font-medium transition-all shadow-2xs"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={saving || !newName.trim()}
          className="px-4.5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#3A8F4B] to-[#65B86B] hover:from-[#2F773E] hover:to-[#559E5B] rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-xs flex items-center gap-1 shrink-0 active:scale-95"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>Tambah</span>
        </button>
      </div>

      {/* Daftar badge */}
      {loading ? (
        <p className="text-xs text-[#555555]">Memuat...</p>
      ) : badges.length === 0 ? (
        <p className="text-xs text-[#555555]">Belum ada badge. Tambahkan di atas.</p>
      ) : (
        <div className="space-y-2">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-[#E2EFE0] dark:border-white/10 bg-[#F9FBF7] dark:bg-[#122316]"
            >
              {editingId === badge.id ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate(badge.id)}
                    autoFocus
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#E2EFE0] dark:border-white/10 bg-white dark:bg-[#0E1A11] text-[#1F5132] dark:text-[#F4F8F3] focus:outline-none focus:ring-1 focus:ring-[#3A8F4B]"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdate(badge.id)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-[#1F5132] hover:bg-[#14331C] rounded-lg cursor-pointer"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 text-xs font-bold text-[#556353] border border-[#E2EFE0] bg-white hover:bg-[#EAF6E8] rounded-lg cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide bg-[#FADE88] text-[#8D6B14] rounded-lg truncate shadow-3xs">
                      {badge.name}
                    </span>
                    <span className={`text-[10px] font-bold ${badge.is_active ? 'text-[#1F5132] dark:text-[#86EFAC]' : 'text-[#556353] dark:text-white/60'}`}>
                      {badge.is_active ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(badge.id);
                        setEditName(badge.name);
                      }}
                      className="p-1.5 text-xs text-[#1F5132] dark:text-[#86EFAC] hover:bg-[#EAF6E8] dark:hover:bg-[#152718] rounded-lg cursor-pointer"
                      title="Edit badge"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggle(badge)}
                      className={`p-1.5 text-xs rounded-lg cursor-pointer ${badge.is_active ? 'text-[#3A8F4B] hover:bg-[#EAF6E8]' : 'text-gray-400 hover:bg-gray-100'}`}
                      title={badge.is_active ? 'Nonaktifkan badge' : 'Aktifkan badge'}
                    >
                      <span className="material-symbols-outlined text-base">
                        {badge.is_active ? 'toggle_on' : 'toggle_off'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(badge)}
                      className="p-1.5 text-xs text-[#D32F2F] hover:bg-[#FFEBEE] rounded-lg cursor-pointer"
                      title="Hapus badge"
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

      <p className="text-[10px] text-[#556353] dark:text-white/60">
        Badge yang aktif tampil di dropdown "Badge Highlight Produk" pada form Kelola Produk.
      </p>
    </div>
  );
};

export default BadgeManagement;
