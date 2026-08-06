import React, { useState } from 'react';
import { authApi } from '../api/authApi';
import { useApp } from '../context/AppContext';

interface ForgotPasswordPageProps {
  onBackToLogin: () => void;
  onNavigateHome: () => void;
  onNavigateRegister: () => void;
}

/**
 * Lupa Password — 2 step:
 *   1. Input email → sistem kirim OTP 6 digit ke WhatsApp user
 *   2. Input OTP + password baru → reset password
 * Kode OTP berlaku 5 menit (diatur backend).
 */
export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onBackToLogin,
  onNavigateHome,
  onNavigateRegister,
}) => {
  const { t } = useApp();

  // Step 1: email
  const [email, setEmail] = useState('');
  // Step 2: otp + password baru
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      if (res.success) {
        setSuccessMsg(res.message);
        setStep(2);
      } else {
        setErrorMsg(res.message);
      }
    } catch {
      setErrorMsg('Terjadi kesalahan pada sistem. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setErrorMsg('Kode OTP harus 6 digit angka.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Password baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.resetPassword(email.trim(), otp, newPassword);
      if (res.success) {
        setSuccessMsg(res.message);
        // Redirect ke login setelah 1.5 detik
        setTimeout(() => onBackToLogin(), 1500);
      } else {
        setErrorMsg(res.message);
      }
    } catch {
      setErrorMsg('Terjadi kesalahan pada sistem. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full h-12 pl-12 pr-4 bg-white border border-[#c4c8bc]/60 rounded-xl text-xs sm:text-sm text-[#1d1b17] placeholder-[#75786e]/60 focus:outline-none focus:border-[#2b3e1d] focus:ring-1 focus:ring-[#2b3e1d] transition-all font-medium';

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#faf8f5] text-[#1d1b17] font-['Plus_Jakarta_Sans']">
      {/* Left Column: Visual Banner */}
      <div
        className="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 bg-cover bg-center relative overflow-hidden"
        style={{
          backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAMcn2APMEfhH2pPwdjiofzevuFQSUfE1GzUpDVCOaRDdTNVQuqTVJc3HjkxHjgakIQ_1uq9d4TUdcKegU3B04cDr9Mjjis_scQLe_pETtAfvQDWYJiiCrb2RL4iJnp7q7Fra1_gFPivtw6XB_06PlKuM2ITfUAMpJ7YaeJTm1Yd2eLR1kE0KEh5SqytKxI0JEwt2BOG1K2OyMB_9U1UNFbiLcKMaJxWCyENe7xX6OxuGYvMFF1ptY')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#162809]/90 via-[#162809]/60 to-black/35 z-10"></div>

        <div className="relative z-20 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#fade88] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            eco
          </span>
          <span className="font-['Playfair_Display'] text-lg font-black tracking-wider text-white">SORGUM</span>
        </div>

        <div className="relative z-20 text-white space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold leading-tight drop-shadow-md">
            {t('Kemurnian Nutrisi Alami untuk Keluarga Anda', 'Natural Nutrition Purity for Your Family')}
          </h2>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-sm">
            {t(
              'Gabung bersama ekosistem hidup sehat Sorgum dan dapatkan kemudahan memesan olahan sorgum organik murni langsung dari petani lokal.',
              'Join the Sorgum healthy living ecosystem and enjoy the ease of ordering pure organic sorghum products directly from local farmers.',
            )}
          </p>
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="lg:col-span-7 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Back to Home */}
          <button
            onClick={onNavigateHome}
            className="group mb-6 inline-flex items-center gap-2 text-xs font-bold text-[#44483f] hover:text-[#2b3e1d] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base transition-transform group-hover:-translate-x-1">arrow_back</span>
            <span>Kembali ke Beranda</span>
          </button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#162809] mb-1">
              {step === 1
                ? t('Lupa Password', 'Forgot Password')
                : t('Atur Password Baru', 'Set New Password')}
            </h1>
            <p className="text-xs sm:text-sm text-[#75786e] font-semibold">
              {step === 1
                ? t(
                    'Masukkan email terdaftar, kami kirim kode OTP ke WhatsApp Anda',
                    'Enter your registered email, we will send an OTP code to your WhatsApp',
                  )
                : t(
                    'Masukkan kode OTP dari WhatsApp dan password baru Anda',
                    'Enter the OTP code from WhatsApp and your new password',
                  )}
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

          {step === 1 ? (
            /* ===== STEP 1: Email ===== */
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#44483f] ml-0.5" htmlFor="fp-email">
                  Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#75786e] text-lg select-none">
                    person
                  </span>
                  <input
                    id="fp-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('Email terdaftar Anda', 'Your registered email')}
                    required
                    className={inputCls}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#2b3e1d] hover:bg-[#162809] text-white rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-2xs mt-4 disabled:opacity-70 cursor-pointer active:scale-98"
              >
                <span>{loading ? 'Mengirim...' : 'Kirim Kode OTP'}</span>
                {!loading && <span className="material-symbols-outlined text-base">send</span>}
              </button>
            </form>
          ) : (
            /* ===== STEP 2: OTP + Password Baru ===== */
            <form onSubmit={handleReset} className="space-y-5">
              {/* OTP */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#44483f] ml-0.5" htmlFor="fp-otp">
                  Kode OTP
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#75786e] text-lg select-none">
                    pin
                  </span>
                  <input
                    id="fp-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    required
                    className={inputCls}
                  />
                </div>
                <p className="text-[10px] text-[#75786e] ml-0.5">
                  Kode berlaku 5 menit. Tidak menerima?{' '}
                  <button
                    type="button"
                    onClick={() => { setStep(1); setOtp(''); setSuccessMsg(''); }}
                    className="text-[#2b3e1d] font-bold hover:underline cursor-pointer"
                  >
                    Kirim ulang
                  </button>
                </p>
              </div>

              {/* Password Baru */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#44483f] ml-0.5" htmlFor="fp-newpass">
                  Password Baru
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#75786e] text-lg select-none">
                    lock
                  </span>
                  <input
                    id="fp-newpass"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('Minimal 6 karakter', 'Minimum 6 characters')}
                    required
                    className={inputCls}
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

              {/* Konfirmasi Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#44483f] ml-0.5" htmlFor="fp-confirm">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#75786e] text-lg select-none">
                    lock
                  </span>
                  <input
                    id="fp-confirm"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('Ulangi password baru', 'Repeat new password')}
                    required
                    className={inputCls}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#2b3e1d] hover:bg-[#162809] text-white rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-2xs mt-4 disabled:opacity-70 cursor-pointer active:scale-98"
              >
                <span>{loading ? 'Menyimpan...' : 'Simpan Password Baru'}</span>
                {!loading && <span className="material-symbols-outlined text-base">check</span>}
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#c4c8bc]/20 text-center space-y-4">
            <p className="text-xs text-[#44483f]">
              {t('Belum punya akun?', 'Dont have an account?')}{' '}
              <button
                onClick={onNavigateRegister}
                className="text-[#2b3e1d] font-bold hover:underline transition-all cursor-pointer"
              >
                {t('Daftar Sekarang', 'Register Now')}
              </button>
            </p>
            <button
              onClick={onBackToLogin}
              className="text-xs text-[#75786e] font-semibold hover:text-[#2b3e1d] transition-all cursor-pointer"
            >
              ← Kembali ke Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
