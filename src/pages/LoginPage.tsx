import React, { useState } from 'react';
import { User } from '../types';
import { useApp } from '../context/AppContext';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onNavigateRegister: () => void;
  onNavigateHome: () => void;
  onNavigateForgot: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateRegister,
  onNavigateHome,
  onNavigateForgot,
}) => {
  const { t, login, currentUser } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await login({
        email,
        password,
        rememberMe,
      });

      // Login sukses — langsung pindah halaman
      if (res.success && res.user) {
        setSuccessMsg(res.message);
        onLoginSuccess(res.user);
      } else if (res.success && currentUser) {
        setSuccessMsg(res.message);
        onLoginSuccess(currentUser);
      } else {
        setErrorMsg(res.message || 'Gagal masuk. Periksa kembali data login Anda.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan pada sistem. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#F8FAF6] text-[#1F5132] font-['Plus_Jakarta_Sans']">
      {/* Left Column: Visual Storytelling Banner (Hidden on Mobile) */}
      <div
        className="hidden lg:flex lg:col-span-5 flex-col justify-end p-12 bg-cover bg-center relative overflow-hidden"
        style={{
          backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAMcn2APMEfhH2pPwdjiofzevuFQSUfE1GzUpDVCOaRDdTNVQuqTVJc3HjkxHjgakIQ_1uq9d4TUdcKegU3B04cDr9Mjjis_scQLe_pETtAfvQDWYJiiCrb2RL4iJnp7q7Fra1_gFPivtw6XB_06PlKuM2ITfUAMpJ7YaeJTm1Yd2eLR1kE0KEh5SqytKxI0JEwt2BOG1K2OyMB_9U1UNFbiLcKMaJxWCyENe7xX6OxuGYvMFF1ptY')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#1F5132]/95 via-[#1F5132]/75 to-[#162809]/60 z-10"></div>

        {/* Banner Copywriter */}
        <div className="relative z-20 text-white space-y-4 mb-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight drop-shadow-sm font-['Plus_Jakarta_Sans']">
            {t('Kemurnian Nutrisi Alami untuk Keluarga Anda', 'Natural Nutrition Purity for Your Family')}
          </h2>
          <p className="text-xs sm:text-sm text-white/85 leading-relaxed max-w-sm font-normal">
            {t(
              'Gabung bersama ekosistem hidup sehat Sorgum dan dapatkan kemudahan memesan olahan sorgum organik murni langsung dari petani lokal.',
              'Join the Sorgum healthy living ecosystem and enjoy the ease of ordering pure organic sorghum products directly from local farmers.'
            )}
          </p>
        </div>

        {/* Banner Footer */}
        <div className="relative z-20 text-[10px] text-white/60 tracking-wider font-medium">
          © 2026 BESTARI SORGUM E-Catalog. All rights reserved.
        </div>
      </div>

      {/* Right Column: Clean Form Container */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center py-12 px-4 sm:px-6 md:px-8 bg-[#F8FAF6]">
        <div className="w-full max-w-[460px] bg-white rounded-2xl p-8 border border-[#E2EFE0] shadow-md">
          
          {/* Back Button */}
          <button
            type="button"
            onClick={onNavigateHome}
            className="mb-8 inline-flex items-center gap-1.5 text-xs font-bold text-[#556353] hover:text-[#1F5132] transition-colors cursor-pointer group"
          >
            <span className="material-symbols-outlined text-base transition-transform group-hover:-translate-x-1">
              arrow_back
            </span>
            <span>Kembali ke Beranda</span>
          </button>

          {/* Form Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F5132] mb-1 font-['Plus_Jakarta_Sans'] tracking-tight">
              {t('Selamat Datang Kembali', 'Welcome Back')}
            </h1>
            <p className="text-xs sm:text-sm text-[#556353] font-medium">
              {t('Masuk untuk melanjutkan belanja sehat Anda', 'Sign in to continue your healthy shopping')}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3.5 bg-[#FFEBEE] text-[#D32F2F] text-xs font-semibold rounded-xl text-center border border-[#D32F2F]/20">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-3.5 bg-[#EAF6E8] text-[#1F5132] text-xs font-semibold rounded-xl text-center border border-[#3A8F4B]/30">
              {successMsg}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input 1: Email / WhatsApp */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#3B4839] ml-0.5" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#556353] text-lg select-none">
                  person
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('Masukkan Email Anda', 'Enter Your Email')}
                  required
                  className="w-full h-12 pl-12 pr-4 bg-[#F8FAF6] focus:bg-white border border-[#E2EFE0] rounded-xl text-xs sm:text-sm text-[#1F5132] placeholder-[#556353]/60 focus:outline-none focus:border-[#1F5132] focus:ring-1 focus:ring-[#1F5132] transition-all font-medium"
                />
              </div>
            </div>

            {/* Input 2: Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#3B4839] ml-0.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#556353] text-lg select-none">
                  lock
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('Masukkan Password Anda', 'Enter Your Password')}
                  required
                  autoComplete="current-password"
                  className="w-full h-12 pl-12 pr-12 bg-[#F8FAF6] focus:bg-white border border-[#E2EFE0] rounded-xl text-xs sm:text-sm text-[#1F5132] placeholder-[#556353]/60 focus:outline-none focus:border-[#1F5132] focus:ring-1 focus:ring-[#1F5132] transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#556353] hover:text-[#1F5132] transition-colors cursor-pointer flex items-center justify-center"
                  title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Extra Options Row: Ingat Saya & Lupa Password */}
            <div className="flex items-center justify-between pt-1 text-xs font-medium">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[#556353]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#E2EFE0] text-[#1F5132] focus:ring-[#1F5132] cursor-pointer"
                />
                <span>{t('Ingat Saya', 'Remember Me')}</span>
              </label>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateForgot();
                }}
                className="text-[#1F5132] font-bold hover:underline transition-all"
              >
                Lupa Password?
              </a>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#1F5132] hover:bg-[#163D24] text-white rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-md mt-4 disabled:opacity-70 cursor-pointer active:scale-98"
            >
              <span>{loading ? 'Memproses...' : 'Masuk'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
