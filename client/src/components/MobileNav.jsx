import React from 'react';
import { LayoutDashboard, Layers, Plus, GitCommit, Settings, Heart } from 'lucide-react';

export default function MobileNav({ currentPath, onNavigate, onOpenAddModal }) {
  const items = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Memories', path: '/memories', icon: Layers },
    { label: 'Add', isAction: true, icon: Plus },
    { label: 'Timeline', path: '/timeline', icon: GitCommit },
    { label: 'Favorites', path: '/favorites', icon: Heart },
  ];

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1 flex items-center justify-around shadow-lg"
    >
      {items.map((item, idx) => {
        const Icon = item.icon;
        const isActive = currentPath === item.path;

        if (item.isAction) {
          return (
            <button
              key={idx}
              type="button"
              onClick={onOpenAddModal}
              aria-label="Add Memory"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition -mt-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
          );
        }

        return (
          <button
            key={item.path}
            type="button"
            onClick={() => onNavigate?.(item.path)}
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center p-1 rounded-xl transition ${
              isActive 
                ? 'text-indigo-600 dark:text-indigo-400 font-bold' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
