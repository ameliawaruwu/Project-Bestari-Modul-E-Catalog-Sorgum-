import React, { useState, useEffect } from 'react';
import { AdminUser, UserAddress } from '../../types/admin';

interface UserDetailModalProps {
  isOpen: boolean;
  user: AdminUser | null;
  onClose: () => void;
  onSave: (updatedUser: AdminUser) => void;
  onSoftDelete: (userId: string) => void;
  onRestore: (userId: string) => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  isOpen,
  user,
  onClose,
  onSave,
  onSoftDelete,
  onRestore,
}) => {
  const [activeTab, setActiveTab] = useState<'profil' | 'pesanan'>('profil');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'AKTIF' | 'NONAKTIF'>('AKTIF');
  const [addresses, setAddresses] = useState<UserAddress[]>([]);

  // Add Address Form state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState('');
  const [newAddrRecipient, setNewAddrRecipient] = useState('');
  const [newAddrPhone, setNewAddrPhone] = useState('');
  const [newAddrFull, setNewAddrFull] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone);
      setStatus(user.status);
      setAddresses(user.addresses || []);
      setActiveTab('profil');
      setShowAddAddress(false);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleSaveUser = () => {
    const updated: AdminUser = {
      ...user,
      name,
      email,
      phone,
      status,
      isDeleted: status === 'NONAKTIF',
      addresses,
    };
    onSave(updated);
    onClose();
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrFull.trim()) return;

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
  };

  const handleSetPrimaryAddress = (addressId: string) => {
    setAddresses(
      addresses.map((addr) => ({
        ...addr,
        isPrimary: addr.id === addressId,
      }))
    );
  };

  const handleDeleteAddress = (addressId: string) => {
    setAddresses(addresses.filter((addr) => addr.id !== addressId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-[#c4c8bc] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-[#e2e8f0] bg-[#f9f8f6] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#162809] text-white flex items-center justify-center font-bold text-lg shadow-xs">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold font-['Playfair_Display'] text-[#1d1b17]">{user.name}</h3>
                <span className="px-2 py-0.5 bg-[#f3ede6] text-[#44483f] font-mono text-xs font-bold rounded-md border border-[#c4c8bc]/60">
                  {user.id}
                </span>
              </div>
              <p className="text-xs text-[#555] mt-0.5">{user.email} • Bergabung {user.joinedDate}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-[#e2e8f0] bg-[#f9f8f6]/50 px-6 gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('profil')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'profil'
                ? 'border-[#162809] text-[#162809]'
                : 'border-transparent text-[#777] hover:text-[#1d1b17]'
            }`}
          >
            <span className="material-symbols-outlined text-base">person</span>
            Profil &amp; Edit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pesanan')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pesanan'
                ? 'border-[#162809] text-[#162809]'
                : 'border-transparent text-[#777] hover:text-[#1d1b17]'
            }`}
          >
            <span className="material-symbols-outlined text-base">shopping_bag</span>
            Riwayat Pesanan ({user.orderHistory?.length || 0})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'profil' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Informasi Utama */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-[#1d1b17] flex items-center gap-1.5 border-b border-[#e2e8f0] pb-2">
                  <span className="material-symbols-outlined text-base text-[#162809]">contact_page</span>
                  Informasi Utama
                </h4>

                <div>
                  <label className="block text-xs font-bold text-[#44483f] mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#c4c8bc] bg-white focus:outline-none focus:ring-2 focus:ring-[#162809]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#44483f] mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#c4c8bc] bg-white focus:outline-none focus:ring-2 focus:ring-[#162809]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#44483f] mb-1">No. WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#c4c8bc] bg-white focus:outline-none focus:ring-2 focus:ring-[#162809]"
                  />
                </div>

                {/* Status Switch / Radio */}
                <div>
                  <label className="block text-xs font-bold text-[#44483f] mb-1.5">Status Akses Pengguna</label>
                  <div className="flex gap-3">
                    <label
                      onClick={() => setStatus('AKTIF')}
                      className={`flex-1 p-2.5 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        status === 'AKTIF'
                          ? 'border-[#162809] bg-[#d2eabb]/30 text-[#162809] font-bold shadow-xs'
                          : 'border-[#c4c8bc] text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                      <span className="text-xs">Aktif</span>
                    </label>

                    <label
                      onClick={() => setStatus('NONAKTIF')}
                      className={`flex-1 p-2.5 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        status === 'NONAKTIF'
                          ? 'border-red-600 bg-red-50 text-red-700 font-bold shadow-xs'
                          : 'border-[#c4c8bc] text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                      <span className="text-xs">Nonaktif (Soft Delete)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column: Daftar Alamat */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-2">
                  <h4 className="text-sm font-bold text-[#1d1b17] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-[#162809]">location_on</span>
                    Daftar Alamat
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(!showAddAddress)}
                    className="text-xs font-bold text-[#162809] hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {showAddAddress ? 'remove' : 'add'}
                    </span>
                    {showAddAddress ? 'Tutup' : 'Tambah Alamat'}
                  </button>
                </div>

                {/* Inline Add Address Form */}
                {showAddAddress && (
                  <form onSubmit={handleAddAddress} className="p-3 bg-[#f9f8f6] rounded-xl border border-[#c4c8bc] space-y-2.5 animate-fadeIn">
                    <input
                      type="text"
                      placeholder="Label Alamat (Contoh: Rumah, Kantor)"
                      value={newAddrLabel}
                      onChange={(e) => setNewAddrLabel(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#c4c8bc] bg-white"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Nama Penerima"
                        value={newAddrRecipient}
                        onChange={(e) => setNewAddrRecipient(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-lg border border-[#c4c8bc] bg-white"
                      />
                      <input
                        type="text"
                        placeholder="No. Telepon"
                        value={newAddrPhone}
                        onChange={(e) => setNewAddrPhone(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-lg border border-[#c4c8bc] bg-white"
                      />
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Alamat Lengkap (Jl, No, RT/RW, Kec, Kota, Kode Pos)"
                      value={newAddrFull}
                      onChange={(e) => setNewAddrFull(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#c4c8bc] bg-white"
                    />
                    <button
                      type="submit"
                      className="w-full py-1.5 text-xs font-bold text-white bg-[#162809] rounded-lg hover:bg-[#233e0e] transition-colors cursor-pointer"
                    >
                      Simpan Alamat
                    </button>
                  </form>
                )}

                {/* Address Cards List */}
                <div className="space-y-3">
                  {addresses.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">Belum ada alamat tersimpan.</p>
                  ) : (
                    addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-3.5 rounded-xl border text-xs space-y-1 relative transition-all ${
                          addr.isPrimary
                            ? 'border-[#162809] bg-[#fdfbf7] shadow-xs'
                            : 'border-[#c4c8bc]/70 bg-white hover:border-[#c4c8bc]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#1d1b17]">{addr.label}</span>
                            {addr.isPrimary && (
                              <span className="px-2 py-0.5 bg-[#d2eabb] text-[#162809] font-bold text-[10px] rounded-full">
                                UTAMA
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {!addr.isPrimary && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryAddress(addr.id)}
                                className="text-[11px] font-bold text-[#162809] hover:underline cursor-pointer"
                              >
                                Set Utama
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="text-gray-400 hover:text-red-600 cursor-pointer p-0.5"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        </div>
                        <p className="text-[#44483f] font-medium">
                          {addr.recipientName} ({addr.phone})
                        </p>
                        <p className="text-gray-600 leading-relaxed">{addr.fullAddress}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: Riwayat Pesanan */
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-[#1d1b17] flex items-center gap-1.5 border-b border-[#e2e8f0] pb-2">
                <span className="material-symbols-outlined text-base text-[#162809]">history</span>
                Daftar Pesanan User
              </h4>

              {(!user.orderHistory || user.orderHistory.length === 0) ? (
                <div className="p-8 text-center text-gray-500 text-xs">
                  <span className="material-symbols-outlined text-3xl mb-1 text-gray-300">shopping_cart_checkout</span>
                  <p>User belum pernah melakukan transaksi pesanan.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#c4c8bc]/60">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#f3ede6] text-[#44483f] font-bold uppercase tracking-wider border-b border-[#c4c8bc]">
                        <th className="p-3">ID Pesanan</th>
                        <th className="p-3">Tanggal</th>
                        <th className="p-3">Jumlah</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {user.orderHistory.map((order) => (
                        <tr key={order.orderId} className="hover:bg-gray-50">
                          <td className="p-3 font-mono font-bold text-[#162809]">{order.orderId}</td>
                          <td className="p-3 text-gray-600">{order.date}</td>
                          <td className="p-3 font-bold text-[#1d1b17]">{order.formattedAmount}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 font-bold rounded-full text-[10px] ${
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

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-[#e2e8f0] bg-[#f9f8f6] flex items-center justify-between">
          <div>
            {user.isDeleted || user.status === 'NONAKTIF' ? (
              <button
                type="button"
                onClick={() => {
                  onRestore(user.id);
                  onClose();
                }}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">restore</span>
                Pulihkan Soft Delete
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onSoftDelete(user.id);
                  onClose();
                }}
                className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">archive</span>
                Soft Delete User
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-[#44483f] bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveUser}
              className="px-5 py-2 text-xs font-bold text-white bg-[#162809] hover:bg-[#233e0e] rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              Simpan Perubahan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
