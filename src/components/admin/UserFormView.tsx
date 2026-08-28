import React, { useState, useEffect } from 'react';
import { AdminUser, UserAddress } from '../../types/admin';
import { PhoneInput } from '../PhoneInput';

interface UserFormViewProps {
  initialUser?: AdminUser | null;
  onSave: (
    user: AdminUser,
    password?: string
  ) => void;
  onCancel: () => void;
  onSoftDelete?: (userId: string) => void;
  onRestore?: (userId: string) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const UserFormView: React.FC<UserFormViewProps> = ({
  initialUser,
  onSave,
  onCancel,
  onSoftDelete,
  onRestore,
  showToast,
}) => {
  const isEditing = Boolean(initialUser);

  // Form Fields State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'AKTIF' | 'NONAKTIF'>('AKTIF');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [addresses, setAddresses] = useState<UserAddress[]>([]);

  // Add Address Form state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState('');
  const [newAddrRecipient, setNewAddrRecipient] = useState('');
  const [newAddrPhone, setNewAddrPhone] = useState('');
  const [newAddrFull, setNewAddrFull] = useState('');

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialUser) {
      setName(initialUser.name);
      setEmail(initialUser.email);
      setPhone(initialUser.phone);
      setStatus(initialUser.status);
      setRole(initialUser.role || 'user');
      setAddresses(initialUser.addresses || []);
      setPassword('');
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setStatus('AKTIF');
      setRole('user');
      setAddresses([]);
      setPassword('');
    }
    setErrors({});
  }, [initialUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Nama lengkap wajib diisi';
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Email tidak valid';
    if (!phone.trim()) newErrors.phone = 'No. WhatsApp wajib diisi';
    if (!isEditing && (!password || password.length < 6)) {
      newErrors.password = 'Password minimal 6 karakter';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Mohon lengkapi semua bidang bertanda bintang (*)');
      return;
    }

    const formattedPhone = phone.startsWith('0') || phone.startsWith('+') ? phone : `0${phone}`;

    const userPayload: AdminUser = {
      id: initialUser?.id || '',
      name,
      email,
      phone: formattedPhone,
      joinedDate: initialUser?.joinedDate || '',
      status,
      isDeleted: status === 'NONAKTIF',
      deletedAt: status === 'NONAKTIF' ? (initialUser?.deletedAt || new Date().toISOString().replace('T', ' ').substring(0, 16)) : undefined,
      role,
      addresses,
    };

    onSave(userPayload, password || undefined);
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrFull.trim()) {
      showToast('Alamat lengkap wajib diisi');
      return;
    }

    const newAddress: UserAddress = {
      id: `ADDR-${Date.now()}`,
      label: newAddrLabel || 'Alamat Baru',
      recipientName: newAddrRecipient || name,
      phone: newAddrPhone || phone,
      fullAddress: newAddrFull,
      isPrimary: addresses.length === 0,
    };

    setAddresses([...addresses, newAddress]);
    setNewAddrLabel('');
    setNewAddrRecipient('');
    setNewAddrPhone('');
    setNewAddrFull('');
    setShowAddAddress(false);
    showToast('Alamat baru berhasil ditambahkan');
  };

  const handleSetPrimaryAddress = (addressId: string) => {
    setAddresses(
      addresses.map((addr) => ({
        ...addr,
        isPrimary: addr.id === addressId,
      }))
    );
    showToast('Alamat utama berhasil diperbarui');
  };

  const handleDeleteAddress = (addressId: string) => {
    setAddresses(addresses.filter((addr) => addr.id !== addressId));
    showToast('Alamat dihapus');
  };

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-4xl mx-auto">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E0E0E0] pb-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-[#555555] mb-1">
            <ol className="flex items-center space-x-2">
              <li>Dashboard</li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">chevron_right</span>
              </li>
              <li className="cursor-pointer hover:underline hover:text-[#1B5E20]" onClick={onCancel}>
                Kelola User
              </li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">chevron_right</span>
              </li>
              <li className="text-[#1B5E20] font-bold">
                {isEditing ? `Edit User: ${initialUser?.name}` : 'Tambah User Baru'}
              </li>
            </ol>
          </nav>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-xl bg-[#FFFFFF] border border-[#E0E0E0] text-[#1B5E20] hover:bg-[#E8F5E9] transition-colors cursor-pointer shadow-2xs"
              title="Kembali"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>
            <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1B5E20]">
              {isEditing ? 'Halaman Edit Data User' : 'Halaman Tambah User Baru'}
            </h2>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-[#FFFFFF] hover:bg-[#F7F8F6] border border-[#E0E0E0] text-[#555555] text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            {isEditing ? 'Simpan Perubahan' : 'Tambah User Baru'}
          </button>
        </div>
      </div>

      {/* Main Form Content Grid */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Left 2 Columns: User Info & Addresses */}
        <div className="space-y-6">
          {/* Card 1: Informasi Utama */}
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E0E0E0] shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#E0E0E0] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-xl text-[#1B5E20]">person</span>
                <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#1B5E20]">
                  Informasi Utama Akun
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama Lengkap */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#1B5E20] mb-1.5">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Aruna Sorgum"
                  className={`w-full px-4 py-2.5 text-sm rounded-xl border ${
                    errors.name ? 'border-red-500 bg-red-50 text-red-900' : 'border-[#E0E0E0] bg-[#F7F8F6] text-[#1B5E20]'
                  } focus:outline-none focus:ring-1 focus:ring-[#2E7D32] font-medium`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-[#1B5E20] mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@domain.com"
                  className={`w-full px-4 py-2.5 text-sm rounded-xl border ${
                    errors.email ? 'border-red-500 bg-red-50 text-red-900' : 'border-[#E0E0E0] bg-[#F7F8F6] text-[#1B5E20]'
                  } focus:outline-none focus:ring-1 focus:ring-[#2E7D32] font-medium`}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              {/* No. WhatsApp */}
              <div>
                <label className="block text-xs font-bold text-[#1B5E20] mb-1.5">
                  No. WhatsApp / Telepon <span className="text-red-500">*</span>
                </label>
                <div className="flex rounded-xl overflow-hidden border border-[#E0E0E0] focus-within:ring-1 focus-within:ring-[#2E7D32]">
                  <span className="bg-[#E8F5E9] px-3.5 py-2.5 text-xs font-bold text-[#1B5E20] flex items-center border-r border-[#E0E0E0]">
                    +62
                  </span>
                  <input
                    type="text"
                    value={phone.replace(/^\+?62/, '')}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="81234567890"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F7F8F6] text-[#1B5E20] focus:outline-none font-medium"
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>

              {/* Password */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#1B5E20] mb-1.5">
                  {isEditing ? 'Ubah Password (Opsional)' : 'Password Awal *'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isEditing ? 'Kosongkan jika tidak ingin mengubah password' : 'Minimal 6 karakter'}
                    className={`w-full px-4 py-2.5 pr-10 text-sm rounded-xl border ${
                      errors.password ? 'border-red-500 bg-red-50 text-red-900' : 'border-[#E0E0E0] bg-[#F7F8F6] text-[#1B5E20]'
                    } focus:outline-none focus:ring-1 focus:ring-[#2E7D32] font-medium`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>

              {/* Role Akun (hanya saat edit — create selalu 'user') */}
              {isEditing && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1B5E20] mb-1.5">
                    Peran Akun (Role)
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E0E0E0] bg-[#F7F8F6] text-[#1B5E20] focus:outline-none focus:ring-1 focus:ring-[#2E7D32] font-medium cursor-pointer"
                  >
                    <option value="user">User (Pelanggan)</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className="text-[11px] text-[#555555] mt-1">
                    Menjadikan user sebagai admin memberinya akses ke panel admin.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Daftar Alamat Pengiriman */}
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E0E0E0] shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E0E0E0] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-xl text-[#1B5E20]">location_on</span>
                <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#1B5E20]">
                  Alamat Pengiriman ({addresses.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAddress(!showAddAddress)}
                className="px-3 py-1.5 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#1B5E20] text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">
                  {showAddAddress ? 'close' : 'add'}
                </span>
                {showAddAddress ? 'Tutup Form' : 'Tambah Alamat'}
              </button>
            </div>

            {/* Inline Form Tambah Alamat Baru */}
            {showAddAddress && (
              <div className="p-4 bg-[#F7F8F6] rounded-xl border border-[#E0E0E0] space-y-3 animate-fadeIn">
                <h4 className="text-xs font-bold text-[#1B5E20] flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">add_location_alt</span>
                  Tambah Alamat Baru untuk Konsumen Ini
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#555555] mb-1">Label Alamat</label>
                    <input
                      type="text"
                      placeholder="Rumah, Kantor, dsb."
                      value={newAddrLabel}
                      onChange={(e) => setNewAddrLabel(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#E0E0E0] bg-[#FFFFFF] text-[#1B5E20]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#555555] mb-1">Nama Penerima</label>
                    <input
                      type="text"
                      placeholder="Nama Penerima"
                      value={newAddrRecipient}
                      onChange={(e) => setNewAddrRecipient(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#E0E0E0] bg-[#FFFFFF] text-[#1B5E20]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#555555] mb-1">No. HP Penerima</label>
                    <PhoneInput
                      value={newAddrPhone.replace(/^\+?62/, '').replace(/^0/, '')}
                      onChange={(digits) => setNewAddrPhone(digits)}
                      placeholder="812-xxxx-xxxx"
                      className="px-3 py-2 text-xs rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#555555] mb-1">Alamat Lengkap</label>
                  <textarea
                    rows={2}
                    placeholder="Jl. Raya No. 123, Kelurahan, Kecamatan, Kota, Kode Pos"
                    value={newAddrFull}
                    onChange={(e) => setNewAddrFull(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E0E0E0] bg-[#FFFFFF] text-[#1B5E20]"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(false)}
                    className="px-3 py-1.5 text-xs font-bold text-[#555555] bg-[#FFFFFF] border border-[#E0E0E0] hover:bg-[#F7F8F6] rounded-lg cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleAddAddress}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-[#2E7D32] hover:bg-[#1B5E20] rounded-lg cursor-pointer transition-colors shadow-2xs"
                  >
                    Simpan Alamat
                  </button>
                </div>
              </div>
            )}

            {/* List Alamat */}
            <div className="space-y-3">
              {addresses.length === 0 ? (
                <div className="p-6 text-center text-[#555555] border border-dashed border-[#E0E0E0] rounded-xl text-xs">
                  <span className="material-symbols-outlined text-2xl text-gray-300 mb-1">wrong_location</span>
                  <p>Belum ada alamat tersimpan untuk user ini.</p>
                </div>
              ) : (
                addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`p-4 rounded-xl border text-xs space-y-1.5 transition-all ${
                      addr.isPrimary
                        ? 'border-2 border-[#2E7D32] bg-[#E8F5E9] text-[#1B5E20] shadow-2xs'
                        : 'border-[#E0E0E0] bg-[#FFFFFF] hover:border-[#2E7D32]/50 text-[#1B5E20]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1B5E20] text-sm">{addr.label}</span>
                        {addr.isPrimary ? (
                          <span className="px-2.5 py-0.5 bg-[#2E7D32] text-white font-bold text-[10px] rounded-full">
                            ALAMAT UTAMA
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryAddress(addr.id)}
                            className="text-[11px] font-bold text-[#2E7D32] hover:underline cursor-pointer"
                          >
                            Set Sebagai Utama
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-[#D32F2F] hover:bg-[#FFEBEE] cursor-pointer p-1 rounded-lg transition-colors"
                        title="Hapus Alamat"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>

                    <p className="text-[#555555] font-semibold">
                      Penerima: {addr.recipientName} ({addr.phone})
                    </p>
                    <p className="text-[#555555] leading-relaxed">{addr.fullAddress}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
