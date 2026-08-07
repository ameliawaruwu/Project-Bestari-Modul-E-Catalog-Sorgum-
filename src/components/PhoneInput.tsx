import React from 'react';

interface PhoneInputProps {
  value: string;
  onChange: (digits: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Input nomor WhatsApp dengan prefix "+62" permanen.
 * - value: nomor lokal TANPA prefix (mis. "81234567890") — bukan "+62..." / "0812...".
 * - onChange(digits): selalu kirim digit bersih tanpa leading 0 / prefix.
 *   Kalau user paste "081234567890" → otomatis jadi "81234567890".
 * Konsisten untuk semua form (register, lupa password, profil, alamat, checkout).
 */
export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  placeholder = '812-3456-7890',
  className = '',
  id,
  name,
  required,
  disabled,
}) => {
  const handleChange = (raw: string) => {
    // Ambil digit saja, buang spasi/tanda baca
    let digits = raw.replace(/\D/g, '');
    // Kalau user ketik/paste 0 di awal (0812...) → buang 0, jadi 812...
    if (digits.startsWith('0')) digits = digits.slice(1);
    // Kalau user paste 62 di awal (62812...) → buang 62 (prefix sudah ditampilkan)
    if (digits.startsWith('62') && digits.length > 10) digits = digits.slice(2);
    // Max 13 digit (812 + 11 digit)
    onChange(digits.slice(0, 13));
  };

  return (
    <div className="flex items-stretch w-full">
      <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-[#E0E0E0] bg-[#E8F5E9] text-[#1B5E20] font-bold text-sm shrink-0">
        +62
      </span>
      <input
        type="tel"
        id={id}
        name={name}
        inputMode="numeric"
        required={required}
        disabled={disabled}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-r-xl border border-[#E0E0E0] bg-[#F7F8F6] focus:bg-[#FFFFFF] focus:ring-1 focus:ring-[#2E7D32] focus:outline-none text-xs sm:text-sm text-[#1B5E20] placeholder-[#555555]/60 font-medium ${className}`}
      />
    </div>
  );
};
