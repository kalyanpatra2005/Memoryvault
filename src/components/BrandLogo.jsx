import React from 'react';

export default function BrandLogo({ 
  size = 'md', 
  showTagline = false, 
  className = '',
  textColor = '' 
}) {
  const sizeMap = {
    sm: {
      mark: 'w-7 h-7',
      icon: 'w-4 h-4',
      title: 'text-base',
      tagline: 'text-[10px]'
    },
    md: {
      mark: 'w-9 h-9',
      icon: 'w-5 h-5',
      title: 'text-lg',
      tagline: 'text-xs'
    },
    lg: {
      mark: 'w-12 h-12',
      icon: 'w-6 h-6',
      title: 'text-2xl',
      tagline: 'text-sm'
    }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Professional Icon: Chronometer + Memory Node */}
      <div className={`relative ${currentSize.mark} rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm flex-shrink-0 transition-transform hover:scale-105`}>
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={currentSize.icon}
        >
          {/* Clock Circle */}
          <circle cx="12" cy="12" r="9" />
          {/* Clock Hands indicating a moment */}
          <polyline points="12 7 12 12 15 15" />
          {/* Memory Moment Node on rim */}
          <circle cx="18" cy="6" r="1.5" fill="#f59e0b" stroke="#f59e0b" />
        </svg>
      </div>

      {/* Typography */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-sans font-bold tracking-tight ${currentSize.title} ${textColor || 'text-slate-900 dark:text-white'}`}>
            Time<span className="text-indigo-600 dark:text-indigo-400">Memory</span>
          </span>
        </div>
        {showTagline && (
          <span className={`font-sans text-slate-500 dark:text-slate-400 mt-0.5 ${currentSize.tagline}`}>
            Your moments. Your story. Your memory.
          </span>
        )}
      </div>
    </div>
  );
}
