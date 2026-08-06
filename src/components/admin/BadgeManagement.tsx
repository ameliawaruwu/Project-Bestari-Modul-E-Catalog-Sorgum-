import React, { useState, useEffect, useCallback } from 'react';
import { badgeAdminApi, BadgeItem } from '../../api/adminApi';

interface BadgeManagementProps {
  showToast: (msg: string) => void;
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
      showToast(e?.message || 'Gagal menambah badge');
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
      showToast(e?.message || 'Gagal mengupdate badge');
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
      showToast(e?.message || 'Gagal mengubah status badge');
    }
  };

  const handleDelete = async (badge: BadgeItem) => {
    if (!confirm(`Hapus badge "${badge.name}"? Produk yang memakai badge ini akan kehilangan badge-nya.`)) return;
    try {
      await badgeAdminApi.remove(badge.id);
      showToast('Badge berhasil dihapus');
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Gagal menghapus badge');
    }
  };

  return (
    <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E0E0E0] shadow-2xs space-y-4">
      <div className="flex items-center gap-2.5 border-b border-[#E0E0E0] pb-3">
        <span className="material-symbols-outlined text-xl text-[#1B5E20]">sell</span>
        <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#1B5E20]">Kelola Badge</h3>
      </div>

      {/* Form tambah badge */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="Nama badge baru (misal: PROMO 50%)"
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
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[#E0E0E0] bg-[#F7F8F6]"
            >
              {editingId === badge.id ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate(badge.id)}
                    autoFocus
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#E0E0E0] bg-[#FFFFFF] text-[#1B5E20] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdate(badge.id)}
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
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide bg-[#FFF8E1] text-[#C89B3C] border border-[#FFE082] rounded-lg truncate">
                      {badge.name}
                    </span>
                    <span className={`text-[10px] font-bold ${badge.is_active ? 'text-[#2E7D32]' : 'text-[#555555]'}`}>
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
                      className="p-1.5 text-xs text-[#1B5E20] hover:bg-[#E8F5E9] rounded-lg cursor-pointer"
                      title="Edit badge"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggle(badge)}
                      className={`p-1.5 text-xs rounded-lg cursor-pointer ${badge.is_active ? 'text-[#2E7D32] hover:bg-[#E8F5E9]' : 'text-gray-400 hover:bg-gray-100'}`}
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

      <p className="text-[10px] text-[#555555]">
        Badge yang aktif tampil di dropdown "Badge Highlight Produk" pada form Kelola Produk.
      </p>
    </div>
  );
};

export default BadgeManagement;
