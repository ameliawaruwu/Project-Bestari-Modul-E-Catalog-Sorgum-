import React, { useState, useEffect } from 'react';
import { AdminUser } from '../../types/admin';
import { UserFormView } from './UserFormView';
import { SoftDeleteConfirmModal } from './SoftDeleteConfirmModal';
import { userAdminApi } from '../../api/adminApi';
import { formatDate } from '../../utils/formatDate';

interface UsersTabProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

// BE user row -> AdminUser (FE shape)
function mapAdminUser(u: { id: number; name: string; email: string; phone: string | null; role?: string; is_deleted?: number; created_at: string }): AdminUser {
  const isDeleted = !!u.is_deleted;
  return {
    id: String(u.id),
    name: u.name,
    email: u.email,
    phone: u.phone || '-',
    joinedDate: formatDate(u.created_at, 'long'),
    status: isDeleted ? 'NONAKTIF' : 'AKTIF',
    isDeleted,
    role: u.role === 'admin' ? 'admin' : 'user',
    addresses: [],
  };
}

export const UsersTab: React.FC<UsersTabProps> = ({ showToast }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'SEMUA' | 'AKTIF' | 'NONAKTIF'>('SEMUA');

  // Dedicated Page View Mode: 'list' | 'create' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<AdminUser | null>(null);

  // Soft Delete Confirmation Modal state
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<AdminUser | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  // Naik dari 5 → 20 agar user yang lebih lama (mis. dibuat sebelum banyak user test)
  // tetap terlihat tanpa harus ganti halaman berkali-kali.
  const itemsPerPage = 20;

  // Fetch users dari BE saat mount
  const refreshUsers = async () => {
    setLoading(true);
    try {
      const rows = await userAdminApi.listUsers();
      setUsers(rows.map(mapAdminUser));
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    // Search query filter
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    let matchesStatus = true;
    if (statusFilter === 'AKTIF') {
      matchesStatus = u.status === 'AKTIF' && !u.isDeleted;
    } else if (statusFilter === 'NONAKTIF') {
      matchesStatus = u.status === 'NONAKTIF' || u.isDeleted;
    }

    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  // CRUD Handlers — onSave menerima (user, password?)
  const handleSaveUserFromPage = async (userData: AdminUser, password?: string) => {
    if (viewMode === 'create') {
      try {
        await userAdminApi.createUser({
          name: userData.name,
          email: userData.email,
          password: password || 'sorgum123', // default kalau kosong
          phone: userData.phone !== '-' ? userData.phone : undefined,
        });
        showToast(`User baru ${userData.name} berhasil didaftarkan!`);
      } catch (e: any) {
        showToast(e?.message || 'Gagal membuat user.', 'error');
        return; // Jangan tutup form kalau create gagal — user perlu lihat & perbaiki input
      }
    } else if (selectedUserForEdit) {
      try {
        await userAdminApi.updateUser(Number(selectedUserForEdit.id), {
          name: userData.name,
          email: userData.email,
          phone: userData.phone !== '-' ? userData.phone : undefined,
          ...(password ? { password } : {}),
          role: userData.role,
        });
        showToast(`Data user ${userData.name} berhasil diperbarui!`);
      } catch (e: any) {
        showToast(e?.message || 'Gagal memperbarui user.', 'error');
        return; // Jangan tutup form kalau update gagal
      }
    }

    // Refresh list dari BE
    await refreshUsers();

    // Return back to list page view
    setViewMode('list');
    setSelectedUserForEdit(null);
  };

  const handleSoftDelete = async (userId: string) => {
    try {
      await userAdminApi.deleteUser(Number(userId));
      showToast(`User berhasil dinonaktifkan (Soft Delete).`);
    } catch (e: any) {
      showToast(e?.message || 'Gagal menonaktifkan user.', 'error');
    }
    await refreshUsers();
  };

  const handleRestoreUser = async (userId: string) => {
    try {
      await userAdminApi.updateUser(Number(userId), { is_deleted: 0 });
      showToast('User berhasil dipulihkan (aktif kembali).');
    } catch (e: any) {
      showToast(e?.message || 'Gagal memulihkan user.', 'error');
    }
    refreshUsers();
  };

  const handleToggleStatus = (user: AdminUser) => {
    if (user.status === 'AKTIF') {
      setSelectedUserForDelete(user);
    } else {
      handleRestoreUser(user.id);
    }
  };

  // Open Create Page
  const handleOpenCreatePage = () => {
    setSelectedUserForEdit(null);
    setViewMode('create');
  };

  // Open Edit Page
  const handleOpenEditPage = (user: AdminUser) => {
    setSelectedUserForEdit(user);
    setViewMode('edit');
  };

  // Stats calculations
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'AKTIF' && !u.isDeleted).length;
  const inactiveUsers = users.filter((u) => u.status === 'NONAKTIF' || u.isDeleted).length;

  // IF IN CREATE OR EDIT MODE -> RENDER DEDICATED FULL USER FORM PAGE
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <UserFormView
        initialUser={selectedUserForEdit}
        onSave={handleSaveUserFromPage}
        onCancel={() => {
          setViewMode('list');
          setSelectedUserForEdit(null);
        }}
        onSoftDelete={handleSoftDelete}
        onRestore={handleRestoreUser}
        showToast={showToast}
      />
    );
  }

  // DEFAULT VIEW: LIST OF USERS PAGE
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-[#555555] mb-1">
            <ol className="flex items-center space-x-2">
              <li>Dashboard</li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">chevron_right</span>
              </li>
              <li className="text-[#1B5E20] font-bold">Kelola User</li>
            </ol>
          </nav>
          <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1B5E20]">
            Daftar Konsumen &amp; Pengguna
          </h2>
        </div>

        <button
          type="button"
          onClick={handleOpenCreatePage}
          className="px-4 py-2.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          Tambah User Baru
        </button>
      </div>

      {/* Filter & Action Toolbar */}
      <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#E0E0E0] shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama konsumen, email, atau No. WA..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#E0E0E0] bg-[#F7F8F6] focus:bg-[#FFFFFF] focus:outline-none focus:ring-1 focus:ring-[#2E7D32] text-[#1B5E20] font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Select */}
          <div className="flex items-center gap-1.5 bg-[#F7F8F6] border border-[#E0E0E0] px-3 py-1.5 rounded-xl">
            <span className="text-xs font-medium text-[#555555]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-bold text-[#1B5E20] focus:outline-none cursor-pointer"
            >
              <option value="SEMUA">Semua Status ({totalUsers})</option>
              <option value="AKTIF">Aktif ({activeUsers})</option>
              <option value="NONAKTIF">Nonaktif / Soft Delete ({inactiveUsers})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Users Table */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E0E0E0] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr style={{ backgroundColor: '#E8F5E9', color: '#1B5E20' }} className="border-b border-[#C8E6C9]">
                <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="p-3.5 pl-5 font-black uppercase tracking-wider text-[#1B5E20]">Nama Konsumen</th>
                <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="p-3.5 font-black uppercase tracking-wider text-[#1B5E20]">No. WhatsApp</th>
                <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="p-3.5 font-black uppercase tracking-wider text-[#1B5E20]">Bergabung</th>
                <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="p-3.5 font-black uppercase tracking-wider text-[#1B5E20]">Status</th>
                <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="p-3.5 pr-5 text-right font-black uppercase tracking-wider text-[#1B5E20]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E0E0]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <p className="font-medium text-xs">Memuat data pengguna...</p>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <span className="material-symbols-outlined text-3xl mb-1 text-gray-300">person_off</span>
                    <p className="font-medium text-xs">Tidak ada data konsumen yang cocok dengan pencarian/filter.</p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const initials = u.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  const isSoftDeleted = u.isDeleted || u.status === 'NONAKTIF';

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-[#f5efe6] transition-colors ${isSoftDeleted ? 'bg-[#f4efe8]/80 opacity-75' : ''
                        }`}
                    >
                      {/* Nama Konsumen */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${isSoftDeleted
                                ? 'bg-gray-200 text-gray-600'
                                : 'bg-[#2E7D32] text-white shadow-2xs'
                              }`}
                          >
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-[#1B5E20] block">{u.name}</span>
                            {isSoftDeleted && (
                              <span className="text-[10px] text-amber-700 font-semibold italic">
                                Soft Deleted
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phone WhatsApp */}
                      <td className="p-3.5">
                        <a
                          href={`https://wa.me/${u.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#1B5E20] font-mono font-medium hover:underline"
                        >
                          {u.phone}
                        </a>
                      </td>

                      {/* Bergabung */}
                      <td className="p-3.5 text-gray-600">{u.joinedDate}</td>

                      {/* Status */}
                      <td className="p-3.5">
                        {isSoftDeleted ? (
                          <span className="px-2.5 py-1 bg-red-100 text-red-800 font-bold rounded-full text-[11px] inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                            NONAKTIF
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-[#d2eabb] text-[#1B5E20] font-bold rounded-full text-[11px] inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            AKTIF
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Switch */}
                          <button
                            type="button"
                            title={isSoftDeleted ? 'Aktifkan Kembali' : 'Nonaktifkan (Soft Delete)'}
                            onClick={() => handleToggleStatus(u)}
                            className={`w-8 h-4 rounded-full transition-colors relative p-0.5 cursor-pointer ${isSoftDeleted ? 'bg-gray-300' : 'bg-[#2E7D32]'
                              }`}
                          >
                            <div
                              className={`w-3 h-3 rounded-full bg-white transition-transform ${isSoftDeleted ? 'translate-x-0' : 'translate-x-4'
                                }`}
                            />
                          </button>

                          {/* Edit Page Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditPage(u)}
                            title="Buka Halaman Edit User"
                            className="w-8 h-8 rounded-xl bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#1B5E20] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-[#f9f8f6] border-t border-[#E0E0E0]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#555555]">
          <p>
            Menampilkan{' '}
            <strong className="text-[#1B5E20]">
              {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)}
            </strong>{' '}
            dari <strong className="text-[#1B5E20]">{totalItems}</strong> Konsumen
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#E0E0E0] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded-lg text-xs font-bold cursor-pointer transition-colors ${currentPage === page
                    ? 'bg-[#2E7D32] text-white'
                    : 'bg-white border border-[#E0E0E0] text-[#555555] hover:bg-gray-50'
                  }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-[#E0E0E0] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>



      {/* Soft Delete Modal */}
      <SoftDeleteConfirmModal
        isOpen={!!selectedUserForDelete}
        user={selectedUserForDelete}
        onClose={() => setSelectedUserForDelete(null)}
        onConfirmSoftDelete={handleSoftDelete}
        onConfirmRestore={handleRestoreUser}
      />
    </div>
  );
};
