import React, { useState, useEffect } from 'react';
import { voucherAdminApi } from '../../api/adminApi';

interface Voucher {
  id: number;
  code: string;
  discount_amount: number;
  min_purchase: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

interface VouchersTabProps {
  showToast: (msg: string) => void;
}

export const VouchersTab: React.FC<VouchersTabProps> = ({ showToast }) => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ code: '', discount_amount: 0, min_purchase: 0, max_uses: '', is_active: true, expires_at: '' });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await voucherAdminApi.list();
      setVouchers(data);
    } catch { setVouchers([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  const resetForm = () => {
    setForm({ code: '', discount_amount: 0, min_purchase: 0, max_uses: '', is_active: true, expires_at: '' });
    setEditingId(null);
  };

  const openCreate = () => { resetForm(); setShowForm(true); };
  const openEdit = (v: Voucher) => {
    setForm({
      code: v.code,
      discount_amount: v.discount_amount,
      min_purchase: v.min_purchase,
      max_uses: v.max_uses?.toString() || '',
      is_active: !!v.is_active,
      expires_at: v.expires_at ? v.expires_at.slice(0, 16) : '',
    });
    setEditingId(v.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        max_uses: form.max_uses ? parseInt(form.max_uses, 10) : null,
        expires_at: form.expires_at || null,
      };
      if (editingId) {
        await voucherAdminApi.update(editingId, payload);
        showToast('Voucher berhasil diperbarui.');
      } else {
        await voucherAdminApi.create(payload);
        showToast('Voucher berhasil dibuat.');
      }
      setShowForm(false);
      resetForm();
      refresh();
    } catch { showToast('Gagal menyimpan voucher.'); }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await voucherAdminApi.remove(deletingId);
      showToast('Voucher berhasil dihapus.');
      setDeletingId(null);
      refresh();
    } catch { showToast('Gagal menghapus voucher.'); }
  };

  if (loading) return <div className="text-center py-12 text-[#555555]">Memuat data voucher...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#1B5E20]">Kelola Voucher</h2>
          <p className="text-xs text-[#555555] mt-1">Buat &amp; atur kode voucher diskon untuk pelanggan.</p>
        </div>
        <button onClick={openCreate} className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-4 py-2 rounded-xl font-bold text-sm cursor-pointer transition-colors shadow-2xs">
          + Tambah Voucher
        </button>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] max-w-md w-full rounded-2xl p-6 shadow-xl border border-[#E0E0E0]">
            <h3 className="font-bold text-lg text-[#1B5E20] mb-4">{editingId ? 'Edit Voucher' : 'Voucher Baru'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#555555]">Kode Voucher</label>
                <input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full border border-[#E0E0E0] bg-[#F7F8F6] rounded-xl p-2.5 text-sm focus:ring-1 focus:ring-[#2E7D32] text-[#1B5E20] outline-none font-medium" placeholder="SORGUM10" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#555555]">Diskon (Rp)</label>
                  <input required type="number" min={0} value={form.discount_amount} onChange={e => setForm({ ...form, discount_amount: parseInt(e.target.value) || 0 })}
                    className="w-full border border-[#E0E0E0] bg-[#F7F8F6] rounded-xl p-2.5 text-sm focus:ring-1 focus:ring-[#2E7D32] text-[#1B5E20] outline-none font-medium" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#555555]">Min. Belanja (Rp)</label>
                  <input required type="number" min={0} value={form.min_purchase} onChange={e => setForm({ ...form, min_purchase: parseInt(e.target.value) || 0 })}
                    className="w-full border border-[#E0E0E0] bg-[#F7F8F6] rounded-xl p-2.5 text-sm focus:ring-1 focus:ring-[#2E7D32] text-[#1B5E20] outline-none font-medium" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#555555]">Maks. Penggunaan</label>
                  <input type="number" min={1} value={form.max_uses} onChange={e => setForm({ ...form, max_uses: e.target.value })}
                    className="w-full border border-[#E0E0E0] bg-[#F7F8F6] rounded-xl p-2.5 text-sm focus:ring-1 focus:ring-[#2E7D32] text-[#1B5E20] outline-none font-medium" placeholder="Kosong = unlimited" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#555555]">Kadaluarsa</label>
                  <input type="datetime-local" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })}
                    className="w-full border border-[#E0E0E0] bg-[#F7F8F6] rounded-xl p-2.5 text-sm focus:ring-1 focus:ring-[#2E7D32] text-[#1B5E20] outline-none font-medium" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-[#2E7D32]" />
                <span className="font-bold text-[#555555]">Aktif</span>
              </label>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 border border-[#E0E0E0] text-[#555555] py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:bg-[#F7F8F6]">Batal</button>
                <button type="submit" className="flex-1 bg-[#2E7D32] text-white py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:bg-[#1B5E20] transition-colors">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FFFFFF] max-w-sm w-full rounded-2xl p-6 shadow-2xl border border-[#E0E0E0] text-center space-y-4">
            {/* Icon Tong Sampah */}
            <div className="w-16 h-16 rounded-full bg-[#FFEBEE] text-[#D32F2F] flex items-center justify-center mx-auto shadow-2xs">
              <span className="material-symbols-outlined text-3xl">delete_forever</span>
            </div>

            {/* Judul & Subtitle */}
            <div className="space-y-1">
              <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#1B5E20]">
                Hapus voucher ini?
              </h3>
              <p className="text-xs text-[#555555]">
                Voucher akan dihapus secara permanen.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E0E0E0] bg-[#FFFFFF] text-[#555555] font-bold text-xs hover:bg-[#F7F8F6] transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-[#D32F2F] hover:bg-[#C62828] text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
              >
                Ya
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE */}
      {vouchers.length === 0 ? (
        <div className="text-center py-12 text-[#555555]">Belum ada voucher.</div>
      ) : (
        <div className="overflow-x-auto bg-[#FFFFFF] rounded-2xl border border-[#E0E0E0] shadow-2xs">
          <table className="w-full text-xs">
            <thead style={{ backgroundColor: '#E8F5E9', color: '#1B5E20' }} className="border-b border-[#C8E6C9]">
              <tr>
                <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="p-3.5 text-left font-black uppercase text-[#1B5E20]">Kode</th>
                <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="p-3.5 text-left font-black uppercase text-[#1B5E20]">Diskon</th>
                <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="p-3.5 text-left font-black uppercase text-[#1B5E20]">Min. Belanja</th>
                <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="p-3.5 text-left font-black uppercase text-[#1B5E20]">Digunakan</th>
                <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="p-3.5 text-left font-black uppercase text-[#1B5E20]">Status</th>
                <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="p-3.5 text-right font-black uppercase text-[#1B5E20]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4dfd5]/60">
              {vouchers.map((v) => (
                <tr key={v.id} className="hover:bg-[#f5efe6] transition-colors">
                  <td className="p-3.5 font-bold text-[#1B5E20]">{v.code}</td>
                  <td className="p-3.5 font-bold font-mono-custom text-[#1B5E20]">Rp {v.discount_amount.toLocaleString('id-ID')}</td>
                  <td className="p-3.5 font-mono-custom text-[#555555]">Rp {v.min_purchase.toLocaleString('id-ID')}</td>
                  <td className="p-3.5 text-[#555555] font-mono-custom">{v.used_count}{v.max_uses ? `/${v.max_uses}` : ''}</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${v.is_active ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                      {v.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(v)}
                        className="w-9 h-9 rounded-xl bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#1B5E20] inline-flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                        title="Edit voucher"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => setDeletingId(v.id)}
                        className="w-9 h-9 rounded-xl bg-[#FFEBEE] hover:bg-[#FFCDD2] text-[#D32F2F] inline-flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                        title="Hapus voucher"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
