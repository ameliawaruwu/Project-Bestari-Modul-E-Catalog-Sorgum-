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
    <div className="bg-white p-6 rounded-2xl border border-[#c4c8bc] shadow-xs space-y-4">
      <div className="flex items-center gap-2.5 border-b border-[#e2e8f0] pb-3">
        <span className="material-symbols-outlined text-xl text-[#162809]">sell</span>
        <h3 className="font-['Roboto'] text-lg font-bold text-[#1d1b17]">Kelola Badge</h3>
      </div>

      {/* Form tambah badge */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="Nama badge baru (misal: PROMO 50%)"
          className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#c4c8bc] bg-white focus:outline-none focus:ring-2 focus:ring-[#162809]"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={saving}
          className="px-4 py-2.5 text-xs font-bold text-white bg-[#162809] rounded-xl hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
        >
          + Tambah
        </button>
      </div>

      {/* Daftar badge */}
      {loading ? (
        <p className="text-xs text-gray-400">Memuat...</p>
      ) : badges.length === 0 ? (
        <p className="text-xs text-gray-400">Belum ada badge. Tambahkan di atas.</p>
      ) : (
        <div className="space-y-2">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[#e2e8f0] bg-[#faf9f6]"
            >
              {editingId === badge.id ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate(badge.id)}
                    autoFocus
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#c4c8bc] focus:outline-none focus:ring-2 focus:ring-[#162809]"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdate(badge.id)}
                    className="px-2.5 py-1.5 text-xs font-bold text-white bg-[#162809] rounded-lg hover:opacity-90 cursor-pointer"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-2.5 py-1.5 text-xs font-bold text-[#44483f] border border-[#c4c8bc] rounded-lg hover:bg-[#e7e2db] cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide bg-[#fade88]/60 text-[#162809] rounded-lg truncate">
                      {badge.name}
                    </span>
                    <span className={`text-[10px] font-semibold ${badge.is_active ? 'text-green-600' : 'text-gray-400'}`}>
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
                      className="p-1.5 text-xs text-[#162809] hover:bg-[#e7e2db] rounded-lg cursor-pointer"
                      title="Edit badge"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggle(badge)}
                      className={`p-1.5 text-xs rounded-lg cursor-pointer ${badge.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                      title={badge.is_active ? 'Nonaktifkan badge' : 'Aktifkan badge'}
                    >
                      <span className="material-symbols-outlined text-base">
                        {badge.is_active ? 'toggle_on' : 'toggle_off'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(badge)}
                      className="p-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
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

      <p className="text-[10px] text-gray-400">
        Badge yang aktif tampil di dropdown "Badge Highlight Produk" pada form Kelola Produk.
      </p>
    </div>
  );
};

export default BadgeManagement;
