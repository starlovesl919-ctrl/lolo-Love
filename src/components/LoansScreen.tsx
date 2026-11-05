import React, { useState, useRef } from 'react';
import {
  Coins,
  CheckCircle2,
  Send,
  Calculator,
  Calendar,
  DollarSign,
  User,
  Phone,
  Mail,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Percent,
  Check,
  Building,
  CreditCard,
  UploadCloud,
  Trash2,
  Eye,
  X,
  AlertCircle,
  CheckCircle,
  FileText,
  RotateCcw
} from 'lucide-react';
import { LoanApplication } from '../types';
import { saveLoanApplication, logUserActivity, isStarloveBlocked } from '../utils/accountStorage';
import { useLanguage } from '../context/LanguageContext';

interface LoansScreenProps {
  onBackToHome: () => void;
  defaultEmail?: string;
  defaultFullName?: string;
  defaultPhone?: string;
}

const PRESET_AMOUNTS = [
  5000000,
  10000000,
  15000000,
  25000000,
  50000000,
];

const PRESET_DURATIONS = [6, 12, 18, 24, 36, 48];

const SYRIAN_BANKS = [
  'المصرف التجاري السوري',
  'المصرف العقاري السوري',
  'مصرف التوفير',
  'مصرف التسليف الشعبي',
  'المصرف الزراعي التعاوني',
  'المصرف الصناعي',
  'بنك بيمو السعودي الفرنسي (BBSF)',
  'بنك البركة سورية',
  'بنك الشام',
  'بنك سورية الدولي الإسلامي (SIIB)',
  'بنك قطر الوطني - سورية (QNB)',
  'بنك فرنسبنك سورية',
  'بنك الأردن سورية',
  'المصرف الدولي للتجارة والتمويل (IBTF)',
  'بنك الشرق',
  'بنك بيبلوس سورية',
  'بنك الائتمان الأهلي',
  'مصرف سورية والمهجر',
  'بنك آخر (يرجى كتابة الاسم)'
];

// Helper to safely compress uploaded bank card images to dataURL
function compressCardImage(file: File, callback: (dataUrl: string, name: string) => void) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const rawUrl = e.target?.result as string;
    const img = new Image();
    img.onload = () => {
      const maxDim = 1200;
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', 0.82), file.name);
      } else {
        callback(rawUrl, file.name);
      }
    };
    img.onerror = () => {
      callback(rawUrl, file.name);
    };
    img.src = rawUrl;
  };
  reader.readAsDataURL(file);
}

export const LoansScreen: React.FC<LoansScreenProps> = ({
  onBackToHome,
  defaultEmail = '',
  defaultFullName = '',
  defaultPhone = '',
}) => {
  const { t, isRTL } = useLanguage();

  const rawFullName = defaultFullName || localStorage.getItem('sc_contact_name') || '';
  const [fullName, setFullName] = useState(isStarloveBlocked(rawFullName) ? '' : rawFullName);
  const [phone, setPhone] = useState(defaultPhone || localStorage.getItem('sc_contact_phone') || '+963 ');
  const rawEmail = defaultEmail || localStorage.getItem('sc_waiting_email') || '';
  const [email, setEmail] = useState(isStarloveBlocked(rawEmail) ? '' : rawEmail);
  const [governorate, setGovernorate] = useState(localStorage.getItem('sc_contact_governorate') || 'دمشق');

  const [loanAmount, setLoanAmount] = useState<number>(10000000);
  const [loanDurationMonths, setLoanDurationMonths] = useState<number>(12);
  const [loanReason, setLoanReason] = useState<string>('تمويل مشروع تجاري وتوسعة نشاط قائم');
  const [monthlyIncome, setMonthlyIncome] = useState<string>('2,500,000 ل.س');
  const [guarantorInfo, setGuarantorInfo] = useState<string>('سجل تجاري / كفيل معتمد');

  // Bank Account & Bank Card on both sides state
  const [hasBankAccount, setHasBankAccount] = useState<boolean>(true);
  const [bankName, setBankName] = useState<string>('المصرف التجاري السوري');
  const [customBankName, setCustomBankName] = useState<string>('');
  const [bankCardFrontUrl, setBankCardFrontUrl] = useState<string>('');
  const [bankCardFrontName, setBankCardFrontName] = useState<string>('');
  const [bankCardBackUrl, setBankCardBackUrl] = useState<string>('');
  const [bankCardBackName, setBankCardBackName] = useState<string>('');

  const [isProcessingFront, setIsProcessingFront] = useState<boolean>(false);
  const [isProcessingBack, setIsProcessingBack] = useState<boolean>(false);
  const [enlargedCard, setEnlargedCard] = useState<{ url: string; title: string } | null>(null);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState('');
  const [submittedLoanData, setSubmittedLoanData] = useState<LoanApplication | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Loan Calculation (Approx 10% annual flat interest / administrative fee)
  const annualInterestRate = 0.10;
  const totalInterest = loanAmount * annualInterestRate * (loanDurationMonths / 12);
  const totalRepayment = loanAmount + totalInterest;
  const estimatedMonthlyInstallment = Math.round(totalRepayment / loanDurationMonths);

  const handleFrontUpload = (file: File) => {
    setIsProcessingFront(true);
    compressCardImage(file, (dataUrl, name) => {
      setBankCardFrontUrl(dataUrl);
      setBankCardFrontName(name);
      setIsProcessingFront(false);
      if (formError && formError.includes('الوجه الأمامي')) {
        setFormError(null);
      }
    });
  };

  const handleBackUpload = (file: File) => {
    setIsProcessingBack(true);
    compressCardImage(file, (dataUrl, name) => {
      setBankCardBackUrl(dataUrl);
      setBankCardBackName(name);
      setIsProcessingBack(false);
      if (formError && formError.includes('الوجه الخلفي')) {
        setFormError(null);
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim() || !phone.trim() || !loanReason.trim()) {
      setFormError(isRTL ? 'يرجى إكمال جميع الحقول الإلزامية وتوضيح سبب طلب القرض' : 'Please complete all required fields and state loan purpose');
      return;
    }

    let effectiveBankName: string | undefined = undefined;
    if (hasBankAccount) {
      if (bankName.includes('أخرى') || bankName === 'other') {
        if (!customBankName.trim()) {
          setFormError(isRTL ? 'يرجى كتابة اسم البنك الذي لديك حساب لديه' : 'Please specify your bank name');
          return;
        }
        effectiveBankName = customBankName.trim();
      } else {
        effectiveBankName = bankName;
      }

      if (!bankCardFrontUrl && !bankCardBackUrl) {
        setFormError(isRTL ? 'يرجى إرفاق صورة لبطاقة البنك على الوجهين (الوجه الأمامي والوجه الخلفي) لتسهيل تحويل التمويل' : 'Please upload photos of your bank card on both sides (front and back)');
        return;
      }

      if (!bankCardFrontUrl) {
        setFormError(isRTL ? 'يرجى إرفاق صورة الوجه الأمامي لبطاقة البنك' : 'Please upload the front side of your bank card');
        return;
      }

      if (!bankCardBackUrl) {
        setFormError(isRTL ? 'يرجى إرفاق صورة الوجه الخلفي لبطاقة البنك' : 'Please upload the back side of your bank card');
        return;
      }
    }

    const generatedId = 'LOAN-' + Math.floor(1000 + Math.random() * 9000);
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newLoan: LoanApplication = {
      id: generatedId,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: (email.trim() || 'user@shamcash.sy').toLowerCase(),
      governorate,
      loanAmount,
      loanDurationMonths,
      loanReason: loanReason.trim(),
      monthlyIncome: monthlyIncome.trim(),
      guarantorInfo: guarantorInfo.trim(),
      estimatedMonthlyInstallment,
      hasBankAccount,
      bankName: effectiveBankName,
      bankCardFrontUrl: hasBankAccount ? bankCardFrontUrl : undefined,
      bankCardFrontName: hasBankAccount ? (bankCardFrontName || 'bank_card_front.jpg') : undefined,
      bankCardBackUrl: hasBankAccount ? bankCardBackUrl : undefined,
      bankCardBackName: hasBankAccount ? (bankCardBackName || 'bank_card_back.jpg') : undefined,
      status: 'under_review',
      submittedAt: formattedDate,
    };

    saveLoanApplication(newLoan);
    logUserActivity(
      'تقديم طلب قرض وتسهيلات مالية',
      `تم استلام طلب قرض بقيمة (${loanAmount.toLocaleString()} ل.س) ومدة (${loanDurationMonths} شهراً) للمقترض (${fullName.trim()}) برقم (${generatedId}) ${hasBankAccount ? `مع حساب بنكي لدى (${effectiveBankName}) وبطاقة بنكية على الوجهين` : 'بدون حساب بنكي'}`,
      email.trim(),
      fullName.trim()
    );

    setSubmittedId(generatedId);
    setSubmittedLoanData(newLoan);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className={`font-sans text-white/90 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="mx-auto max-w-lg py-8 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="size-8" />
          </div>

          <h2 className="mt-4 text-2xl font-bold text-white">
            {t.loanSuccessTitle}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-white/60 leading-6">
            {t.loanSuccessDesc}
          </p>

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 text-center space-y-4">
            <div>
              <span className="text-[11px] text-white/50 block">رقم طلب القرض المسجل لدى الإدارة</span>
              <span className="font-mono text-2xl font-bold text-amber-300 mt-1 block" dir="ltr">
                {submittedId}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/10 pt-3 text-white/80">
              <div className="rounded-xl bg-white/5 p-2">
                <span className="text-white/40 block text-[10px]">قيمة القرض</span>
                <span className="font-bold text-emerald-400 text-sm">{loanAmount.toLocaleString()} {t.currencySyp}</span>
              </div>
              <div className="rounded-xl bg-white/5 p-2">
                <span className="text-white/40 block text-[10px]">القسط الشهري التقديري</span>
                <span className="font-bold text-[#7B9BE8] text-sm">{estimatedMonthlyInstallment.toLocaleString()} {t.currencySyp}</span>
              </div>
            </div>

            {/* Bank Account Registered Status */}
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3.5 text-xs text-right space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white/60">الحساب البنكي:</span>
                {submittedLoanData?.hasBankAccount ? (
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="size-3.5" />
                    <span>يوجد حساب لدى ({submittedLoanData.bankName})</span>
                  </span>
                ) : (
                  <span className="text-white/50">لا يوجد حساب بنكي (صرف نقدي)</span>
                )}
              </div>

              {submittedLoanData?.hasBankAccount && (
                <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[11px]">
                  <span className="text-white/50">بطاقة البنك المرفوعة:</span>
                  <span className="text-white/90 font-medium">
                    الوجه الأمامي: {submittedLoanData.bankCardFrontName || 'مرفق'} • الوجه الخلفي: {submittedLoanData.bankCardBackName || 'مرفق'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsSubmitted(false);
                setBankCardFrontUrl('');
                setBankCardFrontName('');
                setBankCardBackUrl('');
                setBankCardBackName('');
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition cursor-pointer"
            >
              {isRTL ? 'تقديم طلب تمويل آخر' : 'Submit Another Request'}
            </button>
            <button
              type="button"
              onClick={onBackToHome}
              className="rounded-xl bg-gradient-to-r from-[#4A90E2] to-[#357ABD] px-5 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 transition cursor-pointer"
            >
              {t.btnReturnHome}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`font-sans text-white/90 ${isRTL ? 'text-right' : 'text-left'}`}>
      {/* Header */}
      <div className="text-center border-b border-white/10 pb-5">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-[11px] font-bold text-emerald-300">
          <Coins className="size-3.5 text-emerald-400" />
          {t.loansTitle}
        </span>
        <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
          {t.loansTitle}
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-xs sm:text-sm text-white/60">
          {t.loansSubtitle}
        </p>
      </div>

      {/* Live Calculator Card */}
      <div className="mt-5 rounded-3xl border border-[#4A90E2]/30 bg-gradient-to-b from-[#132240] to-[#0D182E] p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-[#4A90E2]/20 text-[#4A90E2]">
              <Calculator className="size-4" />
            </span>
            <h2 className="text-sm sm:text-base font-bold text-white">
              {t.loanCalculatorTitle}
            </h2>
          </div>
          <span className="text-[11px] text-[#7B9BE8] font-bold">
            شام كاش للتمويل الميسر
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
            <span className="text-[10px] text-white/50 block">{t.loanAmountLabel}</span>
            <span className="font-mono text-base sm:text-lg font-bold text-emerald-400 mt-1 block">
              {loanAmount.toLocaleString()} {t.currencySyp}
            </span>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
            <span className="text-[10px] text-white/50 block">{t.loanDurationLabel}</span>
            <span className="font-mono text-base sm:text-lg font-bold text-white mt-1 block">
              {loanDurationMonths} {t.monthsSuffix}
            </span>
          </div>

          <div className="rounded-2xl border border-[#4A90E2]/40 bg-[#4A90E2]/15 p-3">
            <span className="text-[10px] text-[#7B9BE8] font-bold block">{t.estimatedInstallmentLabel}</span>
            <span className="font-mono text-base sm:text-lg font-bold text-white mt-1 block">
              {estimatedMonthlyInstallment.toLocaleString()} {t.currencySyp}
            </span>
          </div>
        </div>
      </div>

      {/* Loan Application Form */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {formError && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/15 p-4 text-xs text-rose-200 flex items-start gap-2.5">
            <AlertCircle className="size-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">{formError}</span>
          </div>
        )}

        {/* 1. Loan Amount Selection */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-white">
              {t.loanAmountLabel} (قيمة القرض) *
            </label>
            <span className="font-mono text-sm font-bold text-emerald-400">
              {loanAmount.toLocaleString()} {t.currencySyp}
            </span>
          </div>

          {/* Quick preset buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
            {PRESET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setLoanAmount(amt)}
                className={`rounded-xl border py-1.5 text-xs font-mono font-bold transition cursor-pointer ${
                  loanAmount === amt
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {(amt / 1000000).toFixed(0)} مليون
              </button>
            ))}
          </div>

          {/* Slider */}
          <input
            type="range"
            min={2000000}
            max={75000000}
            step={1000000}
            value={loanAmount}
            onChange={(e) => setLoanAmount(Number(e.target.value))}
            className="w-full accent-emerald-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-white/40 mt-1 font-mono">
            <span>2,000,000 ل.س</span>
            <span>75,000,000 ل.س</span>
          </div>
        </div>

        {/* 2. Loan Duration Selection */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
          <label className="block text-xs font-bold text-white mb-2">
            {t.loanDurationLabel} (مدة القرض) *
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {PRESET_DURATIONS.map((dur) => (
              <button
                key={dur}
                type="button"
                onClick={() => setLoanDurationMonths(dur)}
                className={`rounded-xl border py-2 text-xs font-bold transition cursor-pointer ${
                  loanDurationMonths === dur
                    ? 'border-[#4A90E2] bg-[#4A90E2]/25 text-[#7B9BE8]'
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {dur} {t.monthsSuffix}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Reason for Loan (سبب القرض) */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
          <label className="block text-xs font-bold text-white mb-2">
            {t.loanReasonLabel} (سبب القرض والغاية من التمويل) *
          </label>
          <textarea
            required
            rows={3}
            value={loanReason}
            onChange={(e) => setLoanReason(e.target.value)}
            placeholder={isRTL ? 'وضح بالتفصيل سبب طلب القرض (مثل: شراء بضاعة، تأسيس مشروع، دفع تكاليف، صيانة عقار)...' : 'State the detailed purpose of the loan (e.g. business expansion, equipment purchase, emergency funds)...'}
            className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-xs sm:text-sm text-white placeholder-white/30 focus:border-[#4A90E2] focus:outline-none leading-6"
          />
        </div>

        {/* 4. Bank Account & Bank Card on Both Sides (طلب المستخدم: هل لديك حساب بنكي • اسم البنك • صورة لبطاقة البنك على الوجهين) */}
        <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CreditCard className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">
                  معلومات الحساب والبطاقة المصرفية للعميل
                </h3>
                <span className="text-[11px] text-white/50">
                  لتسهيل صرف وتسييل مبالغ القرض مباشرة إلى حسابك المصرفي
                </span>
              </div>
            </div>
            <span className="self-start sm:self-auto rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
              قسم التحويل المالي
            </span>
          </div>

          {/* هل لديك حساب بنكي؟ */}
          <div>
            <label className="block text-xs font-bold text-white mb-2">
              هل لديك حساب بنكي؟ *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setHasBankAccount(true)}
                className={`flex items-center justify-between rounded-2xl border p-3.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
                  hasBankAccount
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200 shadow-md shadow-emerald-500/15'
                    : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`flex size-6 items-center justify-center rounded-full ${hasBankAccount ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-white/10 text-white/40'}`}>
                    <Check className="size-3.5 stroke-[3]" />
                  </div>
                  <span>نعم، لدي حساب بنكي</span>
                </div>
                <Building className={`size-4 ${hasBankAccount ? 'text-emerald-400' : 'text-white/30'}`} />
              </button>

              <button
                type="button"
                onClick={() => setHasBankAccount(false)}
                className={`flex items-center justify-between rounded-2xl border p-3.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
                  !hasBankAccount
                    ? 'border-blue-500 bg-blue-500/20 text-blue-200 shadow-md shadow-blue-500/15'
                    : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`flex size-6 items-center justify-center rounded-full ${!hasBankAccount ? 'bg-blue-500 text-white font-bold' : 'bg-white/10 text-white/40'}`}>
                    <X className="size-3.5 stroke-[3]" />
                  </div>
                  <span>لا، ليس لدي حساب بنكي</span>
                </div>
                <Coins className={`size-4 ${!hasBankAccount ? 'text-blue-400' : 'text-white/30'}`} />
              </button>
            </div>
            <p className="mt-2 text-[11px] text-white/50 leading-relaxed">
              {hasBankAccount
                ? 'وجود حساب بنكي يمنح طلبك أولوية في المعالجة وتحويل التمويل المعتمد لحسابك فوراً.'
                : 'في حال عدم امتلاك حساب بنكي، يمكن استلام التمويل نقداً عبر فروع شام كاش أو شبكة المراكز المعتمدة.'}
            </p>
          </div>

          {/* Conditional: اسم البنك + صورة لبطاقة البنك على الوجهين */}
          {hasBankAccount && (
            <div className="space-y-4 pt-3 border-t border-white/10 animate-in fade-in duration-300">
              {/* 1. اسم البنك */}
              <div>
                <label className="block text-xs font-bold text-white mb-1.5">
                  اسم البنك *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="relative">
                    <Building className={`pointer-events-none absolute top-1/2 ${isRTL ? 'right-3' : 'left-3'} size-4 -translate-y-1/2 text-white/40`} />
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className={`w-full rounded-xl border border-white/10 bg-[#0F172A] py-2.5 ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'} text-xs sm:text-sm text-white focus:border-[#4A90E2] cursor-pointer`}
                    >
                      {SYRIAN_BANKS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  {(bankName.includes('أخرى') || bankName === 'other') && (
                    <input
                      type="text"
                      required
                      value={customBankName}
                      onChange={(e) => setCustomBankName(e.target.value)}
                      placeholder="اكتب اسم البنك بالكامل..."
                      className="w-full rounded-xl border border-emerald-500/50 bg-white/5 px-3 py-2.5 text-xs sm:text-sm text-white focus:border-emerald-400 outline-none"
                    />
                  )}
                </div>
              </div>

              {/* 2. صورة لبطاقة البنك على الوجهين */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-white">
                    صورة لبطاقة البنك على الوجهين *
                  </label>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    مطلوب الوجه الأمامي والوجه الخلفي للبطاقة
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Card Front: الوجه الأمامي للبطاقة */}
                  <div className="rounded-2xl border border-white/10 bg-[#0B1220]/80 p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="size-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white">الوجه الأمامي للبطاقة</span>
                      </div>
                      {bankCardFrontUrl ? (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                          <CheckCircle className="size-3" />
                          <span>تم الإرفاق</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-300 font-medium">مطلوب</span>
                      )}
                    </div>

                    {bankCardFrontUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 bg-black/40 group">
                        <img
                          src={bankCardFrontUrl}
                          alt="الوجه الأمامي لبطاقة البنك"
                          className="h-36 w-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2.5 flex flex-col justify-between">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEnlargedCard({ url: bankCardFrontUrl, title: 'الوجه الأمامي لبطاقة البنك' })}
                              className="rounded-lg bg-black/60 p-1.5 text-white hover:bg-black/90 transition cursor-pointer"
                              title="تكبير ومعاينة"
                            >
                              <Eye className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setBankCardFrontUrl('');
                                setBankCardFrontName('');
                                if (frontInputRef.current) frontInputRef.current.value = '';
                              }}
                              className="rounded-lg bg-rose-500/80 p-1.5 text-white hover:bg-rose-600 transition cursor-pointer"
                              title="حذف الصورة"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                          <div>
                            <span className="font-mono text-[10px] text-emerald-300 truncate block">
                              {bankCardFrontName || 'front_card.jpg'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => frontInputRef.current?.click()}
                        className="rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] hover:bg-white/[0.05] hover:border-emerald-500/50 p-5 text-center transition cursor-pointer flex flex-col items-center justify-center min-h-[140px]"
                      >
                        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-2">
                          <UploadCloud className="size-5" />
                        </div>
                        <span className="text-xs font-bold text-white block">
                          رفع الوجه الأمامي للبطاقة
                        </span>
                        <span className="text-[10px] text-white/50 mt-1 block">
                          اضغط لاختيار صورة أو التقاطها عبر الكاميرا
                        </span>
                      </div>
                    )}

                    <input
                      ref={frontInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFrontUpload(file);
                      }}
                      className="hidden"
                    />

                    {bankCardFrontUrl && (
                      <button
                        type="button"
                        onClick={() => frontInputRef.current?.click()}
                        className="mt-2.5 inline-flex items-center justify-center gap-1.5 text-[11px] text-white/60 hover:text-white transition cursor-pointer"
                      >
                        <RotateCcw className="size-3" />
                        <span>تغيير صورة الوجه الأمامي</span>
                      </button>
                    )}
                  </div>

                  {/* Card Back: الوجه الخلفي للبطاقة */}
                  <div className="rounded-2xl border border-white/10 bg-[#0B1220]/80 p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="size-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white">الوجه الخلفي للبطاقة</span>
                      </div>
                      {bankCardBackUrl ? (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                          <CheckCircle className="size-3" />
                          <span>تم الإرفاق</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-300 font-medium">مطلوب</span>
                      )}
                    </div>

                    {bankCardBackUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 bg-black/40 group">
                        <img
                          src={bankCardBackUrl}
                          alt="الوجه الخلفي لبطاقة البنك"
                          className="h-36 w-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2.5 flex flex-col justify-between">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEnlargedCard({ url: bankCardBackUrl, title: 'الوجه الخلفي لبطاقة البنك' })}
                              className="rounded-lg bg-black/60 p-1.5 text-white hover:bg-black/90 transition cursor-pointer"
                              title="تكبير ومعاينة"
                            >
                              <Eye className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setBankCardBackUrl('');
                                setBankCardBackName('');
                                if (backInputRef.current) backInputRef.current.value = '';
                              }}
                              className="rounded-lg bg-rose-500/80 p-1.5 text-white hover:bg-rose-600 transition cursor-pointer"
                              title="حذف الصورة"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                          <div>
                            <span className="font-mono text-[10px] text-emerald-300 truncate block">
                              {bankCardBackName || 'back_card.jpg'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => backInputRef.current?.click()}
                        className="rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] hover:bg-white/[0.05] hover:border-emerald-500/50 p-5 text-center transition cursor-pointer flex flex-col items-center justify-center min-h-[140px]"
                      >
                        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-2">
                          <UploadCloud className="size-5" />
                        </div>
                        <span className="text-xs font-bold text-white block">
                          رفع الوجه الخلفي للبطاقة
                        </span>
                        <span className="text-[10px] text-white/50 mt-1 block">
                          شريط التوقيع والبيانات المصرفية الخلفية
                        </span>
                      </div>
                    )}

                    <input
                      ref={backInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleBackUpload(file);
                      }}
                      className="hidden"
                    />

                    {bankCardBackUrl && (
                      <button
                        type="button"
                        onClick={() => backInputRef.current?.click()}
                        className="mt-2.5 inline-flex items-center justify-center gap-1.5 text-[11px] text-white/60 hover:text-white transition cursor-pointer"
                      >
                        <RotateCcw className="size-3" />
                        <span>تغيير صورة الوجه الخلفي</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. Applicant Personal & Financial Info */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 space-y-4">
          <h3 className="text-xs font-bold text-white border-b border-white/10 pb-2">
            بيانات صاحب الطلب المالية والضمانات
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5">
                {t.applicantFullName} *
              </label>
              <div className="relative">
                <User className={`pointer-events-none absolute top-1/2 ${isRTL ? 'right-3' : 'left-3'} size-4 -translate-y-1/2 text-white/40`} />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="الاسم الثلاثي"
                  className={`w-full rounded-xl border border-white/10 bg-white/5 py-2.5 ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'} text-xs sm:text-sm text-white focus:border-[#4A90E2] focus:outline-none`}
                />
              </div>
            </div>

            {/* Mobile Phone */}
            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5">
                {t.phoneLabel} *
              </label>
              <div className="relative">
                <Phone className={`pointer-events-none absolute top-1/2 ${isRTL ? 'right-3' : 'left-3'} size-4 -translate-y-1/2 text-white/40`} />
                <input
                  type="tel"
                  dir="ltr"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+963 944 000 000"
                  className={`w-full rounded-xl border border-white/10 bg-white/5 py-2.5 ${isRTL ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'} text-xs sm:text-sm text-white focus:border-[#4A90E2] focus:outline-none font-mono`}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5">
                {t.emailLabel}
              </label>
              <input
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-[#4A90E2] font-mono"
              />
            </div>

            {/* Governorate */}
            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5">
                {t.applicantGovernorate} *
              </label>
              <select
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2 text-xs text-white focus:border-[#4A90E2] cursor-pointer"
              >
                {Object.keys(t.governorates).map((gov) => (
                  <option key={gov} value={gov}>
                    {t.governorates[gov] || gov}
                  </option>
                ))}
              </select>
            </div>

            {/* Monthly Income */}
            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5">
                {t.monthlyIncomeLabel}
              </label>
              <input
                type="text"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="مثال: 2,500,000 ل.س"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-[#4A90E2]"
              />
            </div>
          </div>

          {/* Guarantor Info */}
          <div>
            <label className="block text-xs font-bold text-white/80 mb-1.5">
              {t.guarantorLabel} (الضمانة أو الكفيل)
            </label>
            <input
              type="text"
              value={guarantorInfo}
              onChange={(e) => setGuarantorInfo(e.target.value)}
              placeholder="مثال: موظف حكومي معتمد / سجل تجاري / رهن عقار أو سيارة"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-[#4A90E2]"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            id="btn-submit-loan-application"
            className="w-full inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-[0.98] transition cursor-pointer"
          >
            <Send className="size-4" />
            <span>{t.btnSubmitLoan}</span>
          </button>
        </div>
      </form>

      {/* Enlarged Card Preview Modal */}
      {enlargedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#0F172A] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <CreditCard className="size-4 text-emerald-400" />
                <span>{enlargedCard.title}</span>
              </span>
              <button
                type="button"
                onClick={() => setEnlargedCard(null)}
                className="p-1.5 text-white/60 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-4 flex items-center justify-center max-h-[70vh] overflow-hidden rounded-2xl bg-black/50 border border-white/5">
              <img
                src={enlargedCard.url}
                alt={enlargedCard.title}
                className="max-h-[65vh] w-auto max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Back button */}
      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs sm:text-sm font-bold text-white/80 hover:bg-white/10 hover:text-white transition cursor-pointer"
        >
          {isRTL ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          <span>{t.btnReturnHome}</span>
        </button>
      </div>
    </div>
  );
};
