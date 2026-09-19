import React from 'react';

export default function BrandLogo({ size = 'md', showSubtitle = true, className = '' }) {
  const sizeMap = {
    sm: {
      mark: 'w-8 h-8',
      text: 'text-base',
      sub: 'text-[9px]'
    },
    md: {
      mark: 'w-10 h-10',
      text: 'text-lg',
      sub: 'text-[10px]'
    },
    lg: {
      mark: 'w-14 h-14',
      text: 'text-2xl',
      sub: 'text-xs'
    }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Visual Emblem: Chronometer Ring + Memory Spark */}
      <div className={`relative ${currentSize.mark} rounded-xl bg-gradient-to-br from-amber-500/20 via-stone-900 to-amber-950/60 p-[1px] border border-amber-500/30 shadow-lg shadow-amber-950/50 flex items-center justify-center group-hover:border-amber-400/70 transition-all duration-300`}>
        <div className="w-full h-full rounded-xl bg-stone-950/90 flex items-center justify-center relative overflow-hidden">
          <svg
            viewBox="0 0 40 40"
            fill="none"
            className="w-full h-full p-1 text-amber-400/80 transition-transform duration-700 group-hover:rotate-45"
          >
            <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
            <circle cx="20" cy="20" r="11" stroke="url(#goldGrad)" strokeWidth="1.5" />
            <line x1="20" y1="20" x2="20" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="20" y1="20" x2="25" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="20" cy="20" r="2.2" fill="#fbbf24" />
            <defs>
              <linearGradient id="goldGrad" x1="9" y1="9" x2="31" y2="31" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fbbf24" />
                <stop offset="0.5" stopColor="#d97706" />
                <stop offset="1" stopColor="#b45309" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 bg-amber-400/10 rounded-xl blur-[2px] pointer-events-none" />
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-sans tracking-tight font-bold ${currentSize.text} text-stone-100`}>
            Time<span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">Memory</span>
          </span>
          <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded font-mono font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/40">
            Vault
          </span>
        </div>
        {showSubtitle && (
          <span className={`mt-0.5 font-sans tracking-wider uppercase text-stone-400 ${currentSize.sub}`}>
            Timeline & Private Archive
          </span>
        )}
      </div>
    </div>
  );
}
