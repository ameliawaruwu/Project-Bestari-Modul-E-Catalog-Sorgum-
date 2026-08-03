import React, { useState } from 'react';
import { AdminUser } from '../../types/admin';
import { initialAdminUsers } from '../../data/mockUsers';
import { UserFormView } from './UserFormView';
import { SoftDeleteConfirmModal } from './SoftDeleteConfirmModal';

interface UsersTabProps {
  showToast: (msg: string) => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({ showToast }) => {
  const [users, setUsers] = useState<AdminUser[]>(initialAdminUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'SEMUA' | 'AKTIF' | 'NONAKTIF'>('SEMUA');

  // Dedicated Page View Mode: 'list' | 'create' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<AdminUser | null>(null);

  // Soft Delete Confirmation Modal state
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<AdminUser | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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

  // CRUD Handlers
  const handleSaveUserFromPage = (userData: AdminUser) => {
    if (viewMode === 'create') {
      // Create new user
      const nextNum = users.length + 1;
      const newId = `USR-${String(nextNum).padStart(3, '0')}`;
      const todayStr = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const newUser: AdminUser = {
        ...userData,
        id: newId,
        joinedDate: todayStr,
        orderCount: 0,
        status: userData.status || 'AKTIF',
        isDeleted: userData.status === 'NONAKTIF',
      };

      setUsers([newUser, ...users]);
      showToast(`User baru ${newUser.name} (${newId}) berhasil didaftarkan!`);
    } else {
      // Edit existing user
      setUsers(users.map((u) => (u.id === userData.id ? userData : u)));
      showToast(`Data user ${userData.name} (${userData.id}) berhasil diperbarui!`);
    }

    // Return back to list page view
    setViewMode('list');
    setSelectedUserForEdit(null);
  };

  const handleSoftDelete = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    setUsers(
      users.map((u) =>
        u.id === userId
          ? {
              ...u,
              status: 'NONAKTIF',
              isDeleted: true,
              deletedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : u
      )
    );
    if (targetUser) {
      showToast(`User ${targetUser.name} berhasil dinonaktifkan (Soft Delete).`);
    }
  };

  const handleRestoreUser = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    setUsers(
      users.map((u) =>
        u.id === userId
          ? {
              ...u,
              status: 'AKTIF',
              isDeleted: false,
              deletedAt: undefined,
            }
          : u
      )
    );
    if (targetUser) {
      showToast(`User ${targetUser.name} berhasil dipulihkan (Status AKTIF kembali).`);
    }
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
  const avgOrders = (
    users.reduce((acc, u) => acc + u.orderCount, 0) / (totalUsers || 1)
  ).toFixed(1);

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
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-[#44483f] mb-1">
            <ol className="flex items-center space-x-2">
              <li>Dashboard</li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">chevron_right</span>
              </li>
              <li className="text-[#162809] font-bold">Kelola User</li>
            </ol>
          </nav>
          <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1d1b17]">
            Daftar Konsumen &amp; Pengguna
          </h2>
        </div>

        <button
          type="button"
          onClick={handleOpenCreatePage}
          className="px-4 py-2.5 bg-[#162809] hover:bg-[#233e0e] text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          + Tambah User Baru
        </button>
      </div>

      {/* Filter & Action Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#c4c8bc] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
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
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#c4c8bc] bg-[#fdfbf7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162809]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Select */}
          <div className="flex items-center gap-1.5 bg-[#fdfbf7] border border-[#c4c8bc] px-3 py-1.5 rounded-xl">
            <span className="text-xs font-medium text-[#44483f]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-bold text-[#1d1b17] focus:outline-none cursor-pointer"
            >
              <option value="SEMUA">Semua Status ({totalUsers})</option>
              <option value="AKTIF">Aktif ({activeUsers})</option>
              <option value="NONAKTIF">Nonaktif / Soft Delete ({inactiveUsers})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Users Table */}
      <div className="bg-white rounded-2xl border border-[#c4c8bc] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#f3ede6] text-[#44483f] font-bold uppercase tracking-wider border-b border-[#c4c8bc]">
                <th className="p-3.5 pl-5">ID User</th>
                <th className="p-3.5">Nama Konsumen</th>
                <th className="p-3.5">No. WhatsApp</th>
                <th className="p-3.5">Bergabung</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 pr-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c4c8bc]/30">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
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
                      className={`hover:bg-[#f9f3ec]/60 transition-colors ${
                        isSoftDeleted ? 'bg-gray-50/80 opacity-75' : ''
                      }`}
                    >
                      {/* ID User */}
                      <td className="p-3.5 pl-5 font-mono font-bold text-[#162809]">{u.id}</td>

                      {/* Nama Konsumen */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isSoftDeleted
                                ? 'bg-gray-200 text-gray-600'
                                : 'bg-[#162809] text-white shadow-2xs'
                            }`}
                          >
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-[#1d1b17] block">{u.name}</span>
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
                          className="text-[#1d1b17] font-mono font-medium hover:underline"
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
                          <span className="px-2.5 py-1 bg-[#d2eabb] text-[#162809] font-bold rounded-full text-[11px] inline-flex items-center gap-1">
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
                            className={`w-8 h-4 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                              isSoftDeleted ? 'bg-gray-300' : 'bg-[#162809]'
                            }`}
                          >
                            <div
                              className={`w-3 h-3 rounded-full bg-white transition-transform ${
                                isSoftDeleted ? 'translate-x-0' : 'translate-x-4'
                              }`}
                            />
                          </button>

                          {/* Edit Page Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditPage(u)}
                            title="Buka Halaman Edit User"
                            className="p-1.5 text-[#162809] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer flex items-center justify-center font-bold text-xs"
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
        <div className="p-4 bg-[#f9f8f6] border-t border-[#c4c8bc]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#44483f]">
          <p>
            Menampilkan{' '}
            <strong className="text-[#1d1b17]">
              {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)}
            </strong>{' '}
            dari <strong className="text-[#1d1b17]">{totalItems}</strong> Konsumen
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#c4c8bc] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  currentPage === page
                    ? 'bg-[#162809] text-white'
                    : 'bg-white border border-[#c4c8bc] text-[#44483f] hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-[#c4c8bc] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
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
