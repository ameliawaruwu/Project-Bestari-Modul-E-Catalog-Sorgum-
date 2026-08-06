import React, { useState, useEffect } from 'react';
import { AdminUser, UserAddress } from '../../types/admin';

interface UserFormViewProps {
  initialUser?: AdminUser | null;
  onSave: (
    user: AdminUser,
    password?: string
  ) => void;
  onCancel: () => void;
  onSoftDelete?: (userId: string) => void;
  onRestore?: (userId: string) => void;
  showToast: (msg: string) => void;
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
      setAddresses(initialUser.addresses || []);
      setPassword('');
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setStatus('AKTIF');
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
      orderCount: initialUser?.orderCount || 0,
      status,
      isDeleted: status === 'NONAKTIF',
      deletedAt: status === 'NONAKTIF' ? (initialUser?.deletedAt || new Date().toISOString().replace('T', ' ').substring(0, 16)) : undefined,
      addresses,
      orderHistory: initialUser?.orderHistory || [],
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#c4c8bc]/60 pb-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-[#44483f] mb-1">
            <ol className="flex items-center space-x-2">
              <li>Dashboard</li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">chevron_right</span>
              </li>
              <li className="cursor-pointer hover:underline" onClick={onCancel}>
                Kelola User
              </li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">chevron_right</span>
              </li>
              <li className="text-[#162809] font-bold">
                {isEditing ? `Edit User: ${initialUser?.name}` : 'Tambah User Baru'}
              </li>
            </ol>
          </nav>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-xl bg-white border border-[#c4c8bc] text-[#162809] hover:bg-[#f3ede6] transition-colors cursor-pointer"
              title="Kembali"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>
            <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1d1b17]">
              {isEditing ? 'Halaman Edit Data User' : 'Halaman Tambah User Baru'}
            </h2>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-white hover:bg-gray-100 border border-[#c4c8bc] text-[#44483f] text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-[#162809] hover:bg-[#233e0e] text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
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
          <div className="bg-white p-6 rounded-2xl border border-[#c4c8bc] shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-xl text-[#162809]">person</span>
                <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#1d1b17]">
                  Informasi Utama Akun
                </h3>
              </div>
              {isEditing && (
                <span className="px-3 py-1 bg-[#f3ede6] text-[#44483f] font-mono text-xs font-bold rounded-lg border border-[#c4c8bc]/60">
                  {initialUser?.id}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama Lengkap */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#1d1b17] mb-1.5">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Aruna Sorgum"
                  className={`w-full px-4 py-2.5 text-sm rounded-xl border ${
                    errors.name ? 'border-red-500 bg-red-50' : 'border-[#c4c8bc] bg-white'
                  } focus:outline-none focus:ring-2 focus:ring-[#162809]`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-[#1d1b17] mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@domain.com"
                  className={`w-full px-4 py-2.5 text-sm rounded-xl border ${
                    errors.email ? 'border-red-500 bg-red-50' : 'border-[#c4c8bc] bg-white'
                  } focus:outline-none focus:ring-2 focus:ring-[#162809]`}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              {/* No. WhatsApp */}
              <div>
                <label className="block text-xs font-bold text-[#1d1b17] mb-1.5">
                  No. WhatsApp / Telepon <span className="text-red-500">*</span>
                </label>
                <div className="flex rounded-xl overflow-hidden border border-[#c4c8bc] focus-within:ring-2 focus-within:ring-[#162809]">
                  <span className="bg-[#f3ede6] px-3.5 py-2.5 text-xs font-bold text-[#44483f] flex items-center border-r border-[#c4c8bc]">
                    +62
                  </span>
                  <input
                    type="text"
                    value={phone.replace(/^\+?62/, '')}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="81234567890"
                    className="w-full px-3.5 py-2.5 text-sm bg-white focus:outline-none"
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>

              {/* Password */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#1d1b17] mb-1.5">
                  {isEditing ? 'Ubah Password (Opsional)' : 'Password Awal *'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isEditing ? 'Kosongkan jika tidak ingin mengubah password' : 'Minimal 6 karakter'}
                    className={`w-full px-4 py-2.5 pr-10 text-sm rounded-xl border ${
                      errors.password ? 'border-red-500 bg-red-50' : 'border-[#c4c8bc] bg-white'
                    } focus:outline-none focus:ring-2 focus:ring-[#162809]`}
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
            </div>
          </div>

          {/* Card 2: Daftar Alamat Pengiriman */}
          <div className="bg-white p-6 rounded-2xl border border-[#c4c8bc] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-xl text-[#162809]">location_on</span>
                <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#1d1b17]">
                  Alamat Pengiriman ({addresses.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAddress(!showAddAddress)}
                className="px-3 py-1.5 bg-[#f3ede6] hover:bg-[#e2dacd] text-[#162809] text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">
                  {showAddAddress ? 'close' : 'add'}
                </span>
                {showAddAddress ? 'Tutup Form' : 'Tambah Alamat'}
              </button>
            </div>

            {/* Inline Form Tambah Alamat Baru */}
            {showAddAddress && (
              <div className="p-4 bg-[#f9f8f6] rounded-xl border border-[#c4c8bc] space-y-3 animate-fadeIn">
                <h4 className="text-xs font-bold text-[#162809] flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">add_location_alt</span>
                  Tambah Alamat Baru untuk Konsumen Ini
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#44483f] mb-1">Label Alamat</label>
                    <input
                      type="text"
                      placeholder="Rumah, Kantor, dsb."
                      value={newAddrLabel}
                      onChange={(e) => setNewAddrLabel(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#c4c8bc] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#44483f] mb-1">Nama Penerima</label>
                    <input
                      type="text"
                      placeholder="Nama Penerima"
                      value={newAddrRecipient}
                      onChange={(e) => setNewAddrRecipient(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#c4c8bc] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#44483f] mb-1">No. HP Penerima</label>
                    <input
                      type="text"
                      placeholder="0812xxxx"
                      value={newAddrPhone}
                      onChange={(e) => setNewAddrPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#c4c8bc] bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#44483f] mb-1">Alamat Lengkap</label>
                  <textarea
                    rows={2}
                    placeholder="Jl. Raya No. 123, Kelurahan, Kecamatan, Kota, Kode Pos"
                    value={newAddrFull}
                    onChange={(e) => setNewAddrFull(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#c4c8bc] bg-white"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(false)}
                    className="px-3 py-1.5 text-xs font-bold text-[#44483f] bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleAddAddress}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-[#162809] hover:bg-[#233e0e] rounded-lg cursor-pointer"
                  >
                    Simpan Alamat
                  </button>
                </div>
              </div>
            )}

            {/* List Alamat */}
            <div className="space-y-3">
              {addresses.length === 0 ? (
                <div className="p-6 text-center text-gray-500 border border-dashed border-[#c4c8bc] rounded-xl text-xs">
                  <span className="material-symbols-outlined text-2xl text-gray-300 mb-1">wrong_location</span>
                  <p>Belum ada alamat tersimpan untuk user ini.</p>
                </div>
              ) : (
                addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`p-4 rounded-xl border text-xs space-y-1.5 transition-all ${
                      addr.isPrimary
                        ? 'border-[#162809] bg-[#fdfbf7] shadow-xs'
                        : 'border-[#c4c8bc]/70 bg-white hover:border-[#c4c8bc]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1d1b17] text-sm">{addr.label}</span>
                        {addr.isPrimary ? (
                          <span className="px-2.5 py-0.5 bg-[#d2eabb] text-[#162809] font-bold text-[10px] rounded-full">
                            ALAMAT UTAMA
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryAddress(addr.id)}
                            className="text-[11px] font-bold text-[#162809] hover:underline cursor-pointer"
                          >
                            Set Sebagai Utama
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-gray-400 hover:text-red-600 cursor-pointer p-1 rounded-lg hover:bg-red-50 transition-colors"
                        title="Hapus Alamat"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>

                    <p className="text-[#44483f] font-semibold">
                      Penerima: {addr.recipientName} ({addr.phone})
                    </p>
                    <p className="text-gray-600 leading-relaxed">{addr.fullAddress}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card 3: Riwayat Pesanan (Only displayed in edit mode if orders exist) */}
          {isEditing && (
            <div className="bg-white p-6 rounded-2xl border border-[#c4c8bc] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-xl text-[#162809]">shopping_bag</span>
                  <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#1d1b17]">
                    Riwayat Transaksi Pesanan ({initialUser?.orderHistory?.length || 0})
                  </h3>
                </div>
              </div>

              {(!initialUser?.orderHistory || initialUser.orderHistory.length === 0) ? (
                <div className="p-6 text-center text-gray-500 text-xs">
                  <span className="material-symbols-outlined text-3xl mb-1 text-gray-300">shopping_cart_checkout</span>
                  <p>User ini belum pernah melakukan transaksi pesanan.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#c4c8bc]/60">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#f3ede6] text-[#44483f] font-bold uppercase tracking-wider border-b border-[#c4c8bc]">
                        <th className="p-3">ID Pesanan</th>
                        <th className="p-3">Tanggal</th>
                        <th className="p-3">Total Jumlah</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {initialUser.orderHistory.map((order) => (
                        <tr key={order.orderId} className="hover:bg-gray-50">
                          <td className="p-3 font-mono font-bold text-[#162809]">{order.orderId}</td>
                          <td className="p-3 text-gray-600">{order.date}</td>
                          <td className="p-3 font-bold text-[#1d1b17]">{order.formattedAmount}</td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-0.5 font-bold rounded-full text-[10px] ${
                                order.status === 'Selesai'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : order.status === 'Diproses'
                                  ? 'bg-blue-100 text-blue-800'
                                  : order.status === 'Dikirim'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
