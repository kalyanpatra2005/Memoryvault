import React, { useEffect, useState } from 'react';
import BrandLogo from './BrandLogo';

export default function SplashScreen({ onFinish }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Show splash for 1.4 seconds then fade out
    const timer = setTimeout(() => {
      setFading(true);
    }, 1200);

    const finishTimer = setTimeout(() => {
      onFinish?.();
    }, 1600);

    return () => {
      clearTimeout(timer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#faf8f5] dark:bg-[#121214] text-stone-900 dark:text-stone-100 transition-opacity duration-500 ease-out ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center space-y-5 animate-in fade-in zoom-in-95 duration-700">
        <BrandLogo size="lg" animateHand={true} showTagline={false} />
        
        <p className="font-serif italic text-sm text-stone-500 dark:text-stone-400 tracking-wide">
          Opening your personal memory book...
        </p>

        <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-600/40 to-transparent rounded-full animate-pulse" />
      </div>
    </div>
  );
}
