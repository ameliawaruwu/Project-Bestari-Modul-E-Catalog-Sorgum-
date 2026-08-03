import React, { useState } from 'react';
import { User } from '../types';
import { useApp } from '../context/AppContext';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onNavigateRegister: () => void;
  onNavigateHome: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateRegister,
  onNavigateHome,
}) => {
  const { t, login } = useApp();
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

      if (res.success && res.user) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 300);
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
            {t('Kemurnian Nutrisi Alami untuk Keluarga Anda', 'Natural Nutrition Purity for Your Family')}
          </h2>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-sm">
            {t(
              'Gabung bersama ekosistem hidup sehat Bestari dan dapatkan kemudahan memesan olahan sorgum organik murni langsung dari petani lokal.',
              'Join the Bestari healthy living ecosystem and enjoy the ease of ordering pure organic sorghum products directly from local farmers.'
            )}
          </p>
        </div>

        {/* Banner Footer */}
        <div className="relative z-20 text-[10px] text-white/40 tracking-wider">
          © 2026 BESTARI SORGUM. ALL RIGHTS RESERVED.
        </div>
      </div>

      {/* Right Column: Clean Form Container */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center py-12 px-4 sm:px-6 md:px-8 bg-[#faf8f5]">
        <div className="w-full max-w-[460px] bg-white rounded-xl p-8 border border-[#c4c8bc]/50 shadow-2xs">
          
          {/* Back Button */}
          <button
            type="button"
            onClick={onNavigateHome}
            className="mb-8 inline-flex items-center gap-1.5 text-xs font-bold text-[#75786e] hover:text-[#162809] transition-colors cursor-pointer group"
          >
            <span className="material-symbols-outlined text-base transition-transform group-hover:-translate-x-1">
              arrow_back
            </span>
            <span>Kembali ke Beranda</span>
          </button>

          {/* Form Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#162809] mb-1">
              {t('Selamat Datang Kembali', 'Welcome Back')}
            </h1>
            <p className="text-xs sm:text-sm text-[#75786e] font-semibold">
              {t('Masuk untuk melanjutkan belanja sehat Anda', 'Sign in to continue your healthy shopping')}
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

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input 1: Email / WhatsApp */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#44483f] ml-0.5" htmlFor="email">
                {t('Email / No. WhatsApp', 'Email / WhatsApp No.')}
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#75786e] text-lg select-none">
                  person
                </span>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('Email atau Nomor WhatsApp', 'Email or WhatsApp Number')}
                  required
                  className="w-full h-12 pl-12 pr-4 bg-white border border-[#c4c8bc]/60 rounded-xl text-xs sm:text-sm text-[#1d1b17] placeholder-[#75786e]/60 focus:outline-none focus:border-[#2b3e1d] focus:ring-1 focus:ring-[#2b3e1d] transition-all font-medium"
                />
              </div>
            </div>

            {/* Input 2: Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#44483f] ml-0.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#75786e] text-lg select-none">
                  lock
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('Masukkan Password Anda', 'Enter Your Password')}
                  required
                  className="w-full h-12 pl-12 pr-12 bg-white border border-[#c4c8bc]/60 rounded-xl text-xs sm:text-sm text-[#1d1b17] placeholder-[#75786e]/60 focus:outline-none focus:border-[#2b3e1d] focus:ring-1 focus:ring-[#2b3e1d] transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#75786e] hover:text-[#2b3e1d] transition-colors cursor-pointer flex items-center justify-center"
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
              <label className="flex items-center gap-2 cursor-pointer select-none text-[#44483f]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#c4c8bc] text-[#2b3e1d] focus:ring-[#2b3e1d] cursor-pointer"
                />
                <span>{t('Ingat Saya', 'Remember Me')}</span>
              </label>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setErrorMsg('Instruksi pemulihan kata sandi telah dikirimkan.');
                }}
                className="text-[#2b3e1d] font-bold hover:underline transition-all"
              >
                Lupa Password?
              </a>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#2b3e1d] hover:bg-[#162809] text-white rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-2xs mt-4 disabled:opacity-70 cursor-pointer active:scale-98"
            >
              <span>{loading ? 'Memproses...' : 'Masuk'}</span>
              {!loading && <span className="material-symbols-outlined text-base">arrow_forward</span>}
            </button>
          </form>

          {/* Footer Note inside Card */}
          <div className="mt-8 pt-6 border-t border-[#c4c8bc]/20 text-center space-y-4">
            <p className="text-xs text-[#44483f]">
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={onNavigateRegister}
                className="text-[#2b3e1d] font-bold hover:underline ml-1 cursor-pointer"
              >
                Daftar Sekarang
              </button>
            </p>

            {/* Redirect Notice */}
            <p className="text-[10px] text-[#75786e]/80 leading-relaxed px-3 py-2 bg-[#faf8f5] rounded-xl border border-[#c4c8bc]/30">
              💡 <span className="font-semibold">Smart Redirect:</span> Sistem akan otomatis mengarahkan Anda ke dashboard admin atau beranda sesuai status akun.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
