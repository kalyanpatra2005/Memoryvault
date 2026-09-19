import React from 'react';
import { Home, BookOpen, Plus, Image as ImageIcon, Hourglass } from 'lucide-react';

export default function MobileNav({ currentPath, onNavigate, onOpenActionSheet }) {
  const items = [
    { label: 'Home', path: '/home', icon: Home },
    { label: 'Diary', path: '/diary', icon: BookOpen },
    { label: 'Create', isAction: true, icon: Plus },
    { label: 'Memories', path: '/memories', icon: ImageIcon },
    { label: 'Capsules', path: '/capsules', icon: Hourglass },
  ];

  const normalizedPath = currentPath === '/dashboard' ? '/home' : currentPath;

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-paper-50/95 dark:bg-paper-950/95 backdrop-blur-md border-t border-stone-200/80 dark:border-stone-800/80 px-2 py-1.5 flex items-center justify-around shadow-lg pb-safe"
    >
      {items.map((item, idx) => {
        const Icon = item.icon;
        const isActive = normalizedPath === item.path;

        if (item.isAction) {
          return (
            <button
              key={idx}
              type="button"
              onClick={onOpenActionSheet}
              aria-label="Create new memory, diary entry, or capsule"
              className="min-h-[48px] min-w-[48px] flex items-center justify-center p-3 rounded-full bg-gradient-to-tr from-amber-700 to-amber-600 dark:from-amber-600 dark:to-amber-500 text-white shadow-lg hover:brightness-110 active:scale-95 transition -mt-5 border-2 border-paper-100 dark:border-paper-950 focus:outline-none"
            >
              <Plus className="w-6 h-6 stroke-[2.8]" />
            </button>
          );
        }

        return (
          <button
            key={item.path}
            type="button"
            onClick={() => onNavigate?.(item.path)}
            className={`min-h-[44px] min-w-[50px] flex flex-col items-center justify-center p-1 rounded-xl transition ${
              isActive 
                ? 'text-amber-800 dark:text-amber-400 font-bold scale-105' 
                : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5 stroke-[2.2]" />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
