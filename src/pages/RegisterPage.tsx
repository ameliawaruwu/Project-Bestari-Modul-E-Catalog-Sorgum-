import React, { useState } from 'react';
import { User } from '../types';
import { useApp } from '../context/AppContext';

interface RegisterPageProps {
  onRegisterSuccess: (user: User) => void;
  onNavigateLogin: () => void;
  onNavigateHome: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onRegisterSuccess,
  onNavigateLogin,
  onNavigateHome,
}) => {
  const { t, register } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!agreeToTerms) {
      setErrorMsg('Anda harus menyetujui Syarat & Ketentuan yang berlaku.');
      return;
    }

    setLoading(true);

    try {
      const res = await register({
        name,
        email,
        password,
        confirmPassword,
        agreeToTerms,
      });

      if (res.success && res.user) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onRegisterSuccess(res.user!);
          onNavigateHome();
        }, 600);
      } else {
        setErrorMsg(res.message || 'Gagal mendaftar. Silakan periksa data Anda.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan pada sistem. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#faf8f5] text-[#1d1b17] font-['Plus_Jakarta_Sans']">
      {/* Left Column: Visual Storytelling Banner (Hidden on Mobile) */}
      <div
        className="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 bg-cover bg-center relative overflow-hidden"
        style={{
          backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAMcn2APMEfhH2pPwdjiofzevuFQSUfE1GzUpDVCOaRDdTNVQuqTVJc3HjkxHjgakIQ_1uq9d4TUdcKegU3B04cDr9Mjjis_scQLe_pETtAfvQDWYJiiCrb2RL4iJnp7q7Fra1_gFPivtw6XB_06PlKuM2ITfUAMpJ7YaeJTm1Yd2eLR1kE0KEh5SqytKxI0JEwt2BOG1K2OyMB_9U1UNFbiLcKMaJxWCyENe7xX6OxuGYvMFF1ptY')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#162809]/90 via-[#162809]/60 to-black/35 z-10"></div>
        
        {/* Banner Top Brand */}
        <div className="relative z-20 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#fade88] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            eco
          </span>
          <span className="font-['Playfair_Display'] text-lg font-black tracking-wider text-white">BESTARI</span>
        </div>

        {/* Banner Copywriter */}
        <div className="relative z-20 text-white space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold leading-tight drop-shadow-md">
            {t('Langkah Awal Menuju Konsumsi Lebih Baik', 'First Step Toward Better Consumption')}
          </h2>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-sm">
            Daftarkan diri Anda untuk memesan langsung, menyimpan produk favorit, serta melacak riwayat pengiriman belanja sorgum Anda secara mudah.
          </p>
        </div>

        {/* Banner Footer */}
        <div className="relative z-20 text-[10px] text-white/40 tracking-wider">
          © 2026 BESTARI SORGUM. ALL RIGHTS RESERVED.
        </div>
      </div>

      {/* Right Column: Clean Form Container */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center py-12 px-4 sm:px-6 md:px-8 bg-[#faf8f5]">
        <div className="w-full max-w-[480px] bg-white rounded-xl p-8 border border-[#c4c8bc]/50 shadow-2xs">
          
          {/* Back Button */}
          <button
            type="button"
            onClick={onNavigateHome}
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#75786e] hover:text-[#162809] transition-colors cursor-pointer group"
          >
            <span className="material-symbols-outlined text-base transition-transform group-hover:-translate-x-1">
              arrow_back
            </span>
            <span>{t('Kembali ke Beranda', 'Back to Home')}</span>
          </button>

          {/* Form Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#162809] mb-1">
              {t('Bergabung dengan Bestari', 'Join Bestari')}
            </h1>
            <p className="text-xs sm:text-sm text-[#75786e] font-semibold">
              {t('Mulai belanja sehat produk sorgum organik pilihan Anda', 'Start shopping for your choice of organic sorghum products')}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3.5 bg-[#ffdad6] text-[#93000a] text-xs font-semibold rounded-xl text-center border border-[#ba1a1a]/20">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-3.5 bg-[#d2eabb] text-[#0e2004] text-xs font-semibold rounded-xl text-center border border-[#50643f]/20">
              {successMsg}
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama Lengkap */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#44483f] ml-0.5">
                {t('Nama Lengkap', 'Full Name')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('Masukkan nama lengkap Anda', 'Enter your full name')}
                required
                className="w-full h-11 px-4 bg-white border border-[#c4c8bc]/60 rounded-xl text-xs sm:text-sm text-[#1d1b17] placeholder-[#75786e]/60 focus:outline-none focus:border-[#2b3e1d] focus:ring-1 focus:ring-[#2b3e1d] transition-all font-medium"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#44483f] ml-0.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contoh@email.com"
                required
                className="w-full h-11 px-4 bg-white border border-[#c4c8bc]/60 rounded-xl text-xs sm:text-sm text-[#1d1b17] placeholder-[#75786e]/60 focus:outline-none focus:border-[#2b3e1d] focus:ring-1 focus:ring-[#2b3e1d] transition-all font-medium"
              />
            </div>

            {/* Passwords Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#44483f] ml-0.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full h-11 pl-4 pr-10 bg-white border border-[#c4c8bc]/60 rounded-xl text-xs sm:text-sm text-[#1d1b17] placeholder-[#75786e]/60 focus:outline-none focus:border-[#2b3e1d] focus:ring-1 focus:ring-[#2b3e1d] transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#75786e] hover:text-[#2b3e1d] transition-colors cursor-pointer flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#44483f] ml-0.5">
                  Konfirmasi Kata Sandi
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-11 px-4 bg-white border border-[#c4c8bc]/60 rounded-xl text-xs sm:text-sm text-[#1d1b17] placeholder-[#75786e]/60 focus:outline-none focus:border-[#2b3e1d] focus:ring-1 focus:ring-[#2b3e1d] transition-all font-medium"
                />
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-2.5 py-1">
              <input
                id="terms"
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[#c4c8bc] text-[#2b3e1d] focus:ring-[#2b3e1d] cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-[#44483f] cursor-pointer leading-normal font-medium">
                Saya setuju dengan{' '}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setErrorMsg('Syarat & Ketentuan BESTARI: Produk 100% Organik & Garansi Kualitas.');
                  }}
                  className="text-[#2b3e1d] font-bold underline hover:text-[#162809]"
                >
                  Syarat & Ketentuan
                </a>{' '}
                yang berlaku.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#2b3e1d] hover:bg-[#162809] text-white rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 mt-2 active:scale-98 disabled:opacity-70 shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>{loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}</span>
              {!loading && <span className="material-symbols-outlined text-base">arrow_forward</span>}
            </button>
          </form>

          {/* Footer Link inside Card */}
          <div className="text-center pt-6 border-t border-[#c4c8bc]/20 mt-6">
            <p className="text-xs text-[#44483f]">
              Sudah punya akun?{' '}
              <button
                type="button"
                onClick={onNavigateLogin}
                className="text-[#2b3e1d] font-bold hover:underline transition-all ml-1 cursor-pointer"
              >
                Masuk
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
