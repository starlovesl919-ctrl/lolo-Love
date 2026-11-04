import React, { useEffect, useState } from 'react';

interface AppSplashScreenProps {
  onDismiss: () => void;
}

export const AppSplashScreen: React.FC<AppSplashScreenProps> = ({ onDismiss }) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(onDismiss, 350);
    }, 1400);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      onClick={() => {
        setFading(true);
        setTimeout(onDismiss, 200);
      }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#0B1121] px-6 py-12 transition-opacity duration-300 cursor-pointer ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Top Tag */}
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-[#7B9BE8] backdrop-blur-md">
        <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>الجمهورية العربية السورية | المنظومة المالية</span>
      </div>

      {/* Center Branding */}
      <div className="flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
        <div className="relative mb-5 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#4A90E2]/25 blur-3xl animate-pulse" />
          <img
            src="/assets/sham-cash-logo-transparent.png"
            alt="شعار شام كاش الرسمي - shamcash"
            className="relative h-32 sm:h-40 w-auto max-w-[240px] drop-shadow-[0_16px_36px_rgba(74,144,226,0.45)]"
          />
        </div>

        <p className="text-xs font-black tracking-widest text-[#4A90E2] uppercase">
          SHAMCASH FINANCIAL SYSTEM
        </p>
        <p className="mt-1.5 text-xs text-white/60">
          المنظومة المالية الإلكترونية الرسمية في الجمهورية العربية السورية
        </p>

        {/* Loading Progress Bar */}
        <div className="mt-7 w-48 overflow-hidden rounded-full bg-white/10 p-0.5">
          <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-blue-500 via-[#4A90E2] to-emerald-400 animate-[pulse_1s_infinite]" />
        </div>
      </div>

      {/* Bottom Legal / Version */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-bold text-white/80 shadow-inner">
          <span className="size-2 rounded-full bg-blue-400 animate-pulse" />
          <span>shamcash اخر تحديث 3.0.2</span>
        </div>
        <span className="text-[10px] text-white/30">
          انقر في أي مكان للمتابعة المباشرة
        </span>
      </div>
    </div>
  );
};
