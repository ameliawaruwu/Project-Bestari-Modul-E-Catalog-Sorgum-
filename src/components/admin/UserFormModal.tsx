import React, { useState } from 'react';
import { AdminUser, UserAddress } from '../../types/admin';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newUser: Omit<AdminUser, 'id' | 'joinedDate' | 'orderCount' | 'status' | 'isDeleted'> & { password?: string }) => void;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mainAddress, setMainAddress] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Nama lengkap wajib diisi';
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Email tidak valid';
    if (!phone.trim()) newErrors.phone = 'No. WhatsApp wajib diisi';
    if (!password || password.length < 6) newErrors.password = 'Password minimal 6 karakter';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const addresses: UserAddress[] = mainAddress.trim()
      ? [
          {
            id: `ADDR-${Date.now()}`,
            label: 'Rumah Utama',
            recipientName: name,
            phone: phone.startsWith('0') ? phone : `0${phone}`,
            fullAddress: mainAddress,
            isPrimary: true,
          },
        ]
      : [];

    onSave({
      name,
      email,
      phone: phone.startsWith('0') || phone.startsWith('+') ? phone : `0${phone}`,
      password,
      addresses,
      orderHistory: [],
    });

    // Reset form
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setMainAddress('');
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#c4c8bc]">
        {/* Header */}
        <div className="p-6 border-b border-[#e2e8f0] flex justify-between items-start bg-[#f9f8f6]">
          <div>
            <h3 className="text-xl font-bold font-['Playfair_Display'] text-[#1d1b17]">Tambah User Baru</h3>
            <p className="text-xs text-[#555] mt-1">Masukkan detail informasi untuk mendaftarkan user baru.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1 rounded-lg hover:bg-gray-100"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Nama Lengkap */}
          <div>
            <label className="block text-xs font-bold text-[#1d1b17] mb-1.5">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Ahmad Fauzi"
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
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
              placeholder="nama@email.com"
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                errors.email ? 'border-red-500 bg-red-50' : 'border-[#c4c8bc] bg-white'
              } focus:outline-none focus:ring-2 focus:ring-[#162809]`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          {/* No. WhatsApp */}
          <div>
            <label className="block text-xs font-bold text-[#1d1b17] mb-1.5">
              No. WhatsApp <span className="text-red-500">*</span>
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

          {/* Password Awal */}
          <div>
            <label className="block text-xs font-bold text-[#1d1b17] mb-1.5">
              Password Awal <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 karakter"
                className={`w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl border ${
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

          {/* Alamat Pengiriman Utama */}
          <div>
            <label className="block text-xs font-bold text-[#1d1b17] mb-1.5">
              Alamat Pengiriman Utama (Opsional)
            </label>
            <textarea
              rows={3}
              value={mainAddress}
              onChange={(e) => setMainAddress(e.target.value)}
              placeholder="Jl. Raya No. 123, Kelurahan, Kecamatan, Kota, Kode Pos"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#c4c8bc] bg-white focus:outline-none focus:ring-2 focus:ring-[#162809]"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 flex justify-end gap-3 border-t border-[#e2e8f0]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-[#44483f] bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#162809] hover:bg-[#233e0e] rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Tambah User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
