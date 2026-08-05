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

  if (loading) return <div className="text-center py-12 text-[#44483f]">Memuat data voucher...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#1d1b17]">Kelola Voucher</h2>
          <p className="text-xs text-[#44483f] mt-1">Buat & atur kode voucher diskon untuk pelanggan.</p>
        </div>
        <button onClick={openCreate} className="bg-[#2b3e1d] hover:bg-[#162809] text-white px-4 py-2 rounded-xl font-bold text-sm cursor-pointer">
          + Tambah Voucher
        </button>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-xl border border-[#c4c8bc]/30">
            <h3 className="font-bold text-lg mb-4">{editingId ? 'Edit Voucher' : 'Voucher Baru'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#44483f]">Kode Voucher</label>
                <input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full border border-[#c4c8bc] rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#162809] outline-none" placeholder="BESTARI10" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#44483f]">Diskon (Rp)</label>
                  <input required type="number" min={0} value={form.discount_amount} onChange={e => setForm({ ...form, discount_amount: parseInt(e.target.value) || 0 })}
                    className="w-full border border-[#c4c8bc] rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#162809] outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#44483f]">Min. Belanja (Rp)</label>
                  <input required type="number" min={0} value={form.min_purchase} onChange={e => setForm({ ...form, min_purchase: parseInt(e.target.value) || 0 })}
                    className="w-full border border-[#c4c8bc] rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#162809] outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#44483f]">Maks. Penggunaan</label>
                  <input type="number" min={1} value={form.max_uses} onChange={e => setForm({ ...form, max_uses: e.target.value })}
                    className="w-full border border-[#c4c8bc] rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#162809] outline-none" placeholder="Kosong = unlimited" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#44483f]">Kadaluarsa</label>
                  <input type="datetime-local" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })}
                    className="w-full border border-[#c4c8bc] rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#162809] outline-none" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4" />
                <span className="font-bold text-[#44483f]">Aktif</span>
              </label>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 border border-[#c4c8bc] text-[#44483f] py-2.5 rounded-xl font-bold text-sm cursor-pointer">Batal</button>
                <button type="submit" className="flex-1 bg-[#2b3e1d] text-white py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:bg-[#162809]">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-xl text-center">
            <p className="font-bold mb-4">Hapus voucher ini?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingId(null)} className="flex-1 border border-[#c4c8bc] py-2 rounded-xl font-bold text-sm cursor-pointer">Batal</button>
              <button onClick={handleDelete} className="flex-1 bg-red-700 text-white py-2 rounded-xl font-bold text-sm cursor-pointer">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE */}
      {vouchers.length === 0 ? (
        <div className="text-center py-12 text-[#44483f]">Belum ada voucher.</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl border border-[#c4c8bc]/30 shadow-sm">
          <table className="w-full text-xs">
            <thead className="bg-[#f9f3ec] text-[#44483f] font-bold uppercase">
              <tr>
                <th className="p-3 text-left">Kode</th>
                <th className="p-3 text-left">Diskon</th>
                <th className="p-3 text-left">Min. Belanja</th>
                <th className="p-3 text-left">Digunakan</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v) => (
                <tr key={v.id} className="border-t border-[#c4c8bc]/20 hover:bg-[#faf8f5]">
                  <td className="p-3 font-bold">{v.code}</td>
                  <td className="p-3">Rp {v.discount_amount.toLocaleString('id-ID')}</td>
                  <td className="p-3">Rp {v.min_purchase.toLocaleString('id-ID')}</td>
                  <td className="p-3">{v.used_count}{v.max_uses ? `/${v.max_uses}` : ''}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${v.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                      {v.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => openEdit(v)} className="text-[#2b3e1d] hover:underline font-bold cursor-pointer">Edit</button>
                    <button onClick={() => setDeletingId(v.id)} className="text-red-700 hover:underline font-bold cursor-pointer">Hapus</button>
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
