import React from 'react';
import BrandLogo from './BrandLogo';
import { useAuth } from '../context/AuthContext';
import { 
  Home, BookOpen, Image as ImageIcon, Hourglass, 
  GitCommit, Heart, Settings, LogOut, Plus, User 
} from 'lucide-react';

export default function AppSidebar({ currentPath, onNavigate, onOpenActionSheet }) {
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Home', path: '/home', icon: Home },
    { label: 'Digital Diary', path: '/diary', icon: BookOpen },
    { label: 'Memory Album', path: '/memories', icon: ImageIcon },
    { label: 'Time Capsules', path: '/capsules', icon: Hourglass },
    { label: 'Life Timeline', path: '/timeline', icon: GitCommit },
    { label: 'Favorites', path: '/favorites', icon: Heart },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const normalizedPath = currentPath === '/dashboard' ? '/home' : currentPath;
  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Friend';

  return (
    <aside className="w-64 bg-paper-50 dark:bg-paper-950 border-r border-stone-200/80 dark:border-stone-800/80 flex flex-col justify-between p-4 flex-shrink-0 min-h-screen">
      <div className="space-y-6">
        {/* Brand Header */}
        <div 
          onClick={() => onNavigate?.('/home')}
          className="cursor-pointer px-2 py-1"
        >
          <BrandLogo size="md" showTagline={true} />
        </div>

        {/* Primary Action Button */}
        <button
          onClick={onOpenActionSheet}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-white font-medium rounded-xl text-sm shadow-sm flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.99] transition focus:outline-none"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Moment</span>
        </button>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = normalizedPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => onNavigate?.(item.path)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-amber-100/70 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 font-semibold'
                    : 'text-stone-600 hover:bg-paper-200/60 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-900/60 dark:hover:text-stone-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-700 dark:text-amber-400' : 'text-stone-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Card */}
      <div className="pt-4 border-t border-stone-200/60 dark:border-stone-800/80 space-y-2">
        <div 
          onClick={() => onNavigate?.('/profile')}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-paper-200/50 dark:hover:bg-stone-900/50 cursor-pointer transition"
        >
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-xs border border-amber-300/40">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">{fullName}</p>
            <p className="text-[11px] text-stone-400 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-stone-500 hover:text-rose-600 hover:bg-rose-50 dark:text-stone-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/30 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Close Memory Book</span>
        </button>
      </div>
    </aside>
  );
}
