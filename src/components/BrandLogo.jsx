import React from 'react';

export default function BrandLogo({ 
  size = 'md', 
  showTagline = false, 
  className = '',
  animateHand = false,
  textColor = '' 
}) {
  const sizeMap = {
    sm: {
      mark: 'w-8 h-8',
      icon: 'w-4 h-4',
      title: 'text-base',
      tagline: 'text-[10px]'
    },
    md: {
      mark: 'w-10 h-10',
      icon: 'w-5 h-5',
      title: 'text-lg',
      tagline: 'text-xs'
    },
    lg: {
      mark: 'w-16 h-16',
      icon: 'w-8 h-8',
      title: 'text-2xl sm:text-3xl',
      tagline: 'text-sm'
    },
    xl: {
      mark: 'w-24 h-24',
      icon: 'w-12 h-12',
      title: 'text-3xl sm:text-4xl',
      tagline: 'text-base'
    }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Clock + Open Book / Journal Emblem */}
      <div className={`relative ${currentSize.mark} rounded-2xl bg-gradient-to-tr from-stone-900 to-indigo-950 dark:from-stone-800 dark:to-indigo-900 text-amber-100 flex items-center justify-center shadow-md flex-shrink-0 border border-amber-500/20`}>
        <svg 
          viewBox="0 0 32 32" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={currentSize.icon}
        >
          {/* Clock Circle */}
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeOpacity="0.3" strokeDasharray="2 3" />
          <circle cx="16" cy="16" r="11" stroke="currentColor" strokeOpacity="0.8" />
          
          {/* Subtle Clock Hour Marks */}
          <line x1="16" y1="6" x2="16" y2="8" stroke="currentColor" strokeWidth="1.5" />
          <line x1="26" y1="16" x2="24" y2="16" stroke="currentColor" strokeWidth="1.5" />
          <line x1="16" y1="26" x2="16" y2="24" stroke="currentColor" strokeWidth="1.5" />
          <line x1="6" y1="16" x2="8" y2="16" stroke="currentColor" strokeWidth="1.5" />

          {/* Open Memory Book silhouette inside the clock */}
          <path 
            d="M10 20C12 18.5 14 18.5 16 19.5C18 18.5 20 18.5 22 20V12C20 10.5 18 10.5 16 11.5C14 10.5 12 10.5 10 12V20Z" 
            fill="currentColor" 
            fillOpacity="0.2"
            stroke="currentColor" 
            strokeWidth="1.5" 
          />
          <line x1="16" y1="11.5" x2="16" y2="19.5" stroke="currentColor" strokeWidth="1.5" />

          {/* Clock Hour Hand */}
          <line x1="16" y1="16" x2="16" y2="10" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />

          {/* Clock Minute Hand (rotates smoothly if animateHand is true) */}
          <g className={animateHand ? "origin-center animate-[spin_4s_linear_infinite]" : ""}>
            <line x1="16" y1="16" x2="21" y2="16" stroke="#fef3c7" strokeWidth="1.7" strokeLinecap="round" />
          </g>

          {/* Center Pivot */}
          <circle cx="16" cy="16" r="1.5" fill="#f59e0b" stroke="none" />
        </svg>
      </div>

      {/* Typography */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-serif tracking-tight ${currentSize.title} font-semibold ${textColor || 'text-stone-900 dark:text-stone-100'}`}>
            Time<span className="text-amber-700 dark:text-amber-400 font-normal">Memory</span>
          </span>
        </div>
        {showTagline && (
          <span className={`font-sans tracking-wide text-stone-500 dark:text-stone-400 mt-1 ${currentSize.tagline}`}>
            Your moments. Your story. Your memory.
          </span>
        )}
      </div>
    </div>
  );
}
