import React from 'react';

interface BrandLogoProps {
  compact?: boolean;
  lightText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const LOGO_SRC = '/assets/aistudio/Sentinel_GuardOps_Security_Logo_b23e1fe6.png';

export function BrandLogo({ compact = false, lightText = true, size = 'md' }: BrandLogoProps) {
  if (compact) {
    const boxSize =
      size === 'lg' ? 'w-12 h-12 rounded-2xl' : size === 'sm' ? 'w-8 h-8 rounded-lg' : 'w-9 h-9 rounded-xl';
    const imgSize =
      size === 'lg'
        ? 'w-[148px] h-[74px] -translate-x-[0px] -translate-y-[9px]'
        : size === 'sm'
          ? 'w-[100px] h-[50px] -translate-x-[0px] -translate-y-[6px]'
          : 'w-[112px] h-[56px] -translate-x-[0px] -translate-y-[7px]';

    return (
      <div
        className={`relative overflow-hidden shrink-0 select-none bg-white ${boxSize} ${
          lightText
            ? 'shadow-xs ring-1 ring-white/20'
            : 'border border-slate-200/90 dark:border-white/15 shadow-xs'
        }`}
        aria-label="Sentinel GuardOps"
      >
        <img
          src={LOGO_SRC}
          alt="Sentinel GuardOps"
          className={`absolute top-0 left-0 max-w-none pointer-events-none select-none ${imgSize}`}
        />
      </div>
    );
  }

  const sizeClass =
    size === 'lg'
      ? 'w-[210px] h-[66px] rounded-2xl px-2.5'
      : size === 'sm'
        ? 'w-[126px] h-[40px] rounded-lg px-1.5'
        : 'w-[154px] h-[48px] rounded-xl px-2';

  const surfaceClass = lightText
    ? 'bg-white shadow-xs ring-1 ring-white/15'
    : 'bg-white dark:bg-white border border-slate-200/80 dark:border-white/15 shadow-2xs';

  return (
    <div
      className={`inline-flex items-center justify-center overflow-hidden shrink-0 select-none ${sizeClass} ${surfaceClass}`}
    >
      <img
        src={LOGO_SRC}
        alt="Sentinel GuardOps — Security Operations Platform by Samley Technologies"
        className="w-[103%] max-w-none h-auto -translate-y-[3.9%] pointer-events-none select-none"
      />
    </div>
  );
}
