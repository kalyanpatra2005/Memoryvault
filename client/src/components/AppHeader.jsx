import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Search, Plus, User, LogOut, Settings as SettingsIcon, Shield, X, Heart } from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function AppHeader({ 
  onOpenActionSheet, 
  onOpenSearch, 
  title = 'TimeMemory',
  onNavigate 
}) {
  const { user, profile, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Friend';

  return (
    <header className="sticky top-0 z-30 bg-paper-100/90 dark:bg-paper-950/90 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800/80 px-4 sm:px-6 lg:px-8 py-3 transition-colors">
      <div className="flex items-center justify-between gap-4 max-w-5xl mx-auto">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="md:hidden cursor-pointer" onClick={() => onNavigate?.('/home')}>
            <BrandLogo size="sm" />
          </div>
          <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            {title}
          </h2>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Search Trigger */}
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search memories and diary"
            className="p-2 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 rounded-xl hover:bg-paper-200 dark:hover:bg-stone-800 transition"
          >
            <Search className="w-4 h-4 stroke-[2.2]" />
          </button>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 text-stone-500 hover:text-amber-700 dark:text-stone-400 dark:hover:text-amber-400 rounded-xl hover:bg-paper-200 dark:hover:bg-stone-800 transition"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-stone-600" />
            )}
          </button>

          {/* User Profile Avatar Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-paper-200 dark:hover:bg-stone-800 transition focus:outline-none"
              aria-label="Open personal profile menu"
            >
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-serif font-bold text-xs flex items-center justify-center border border-amber-300/60 shadow-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-paper-50 dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 py-1.5 z-50 text-stone-800 dark:text-stone-200 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2.5 border-b border-stone-200/70 dark:border-stone-800">
                  <p className="text-xs font-serif font-bold text-stone-900 dark:text-stone-100 truncate">{displayName}</p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">{user?.email}</p>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <Shield className="w-3 h-3" />
                    <span>Private Vault Active</span>
                  </div>
                </div>

                <div className="p-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onNavigate?.('/profile');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-800 rounded-lg transition text-left"
                  >
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    <span>Personal Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onNavigate?.('/favorites');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-800 rounded-lg transition text-left"
                  >
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>Favorites</span>
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onNavigate?.('/settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-800 rounded-lg transition text-left"
                  >
                    <SettingsIcon className="w-3.5 h-3.5 text-stone-400" />
                    <span>Settings</span>
                  </button>
                </div>

                <div className="p-1 border-t border-stone-200/70 dark:border-stone-800">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition font-medium text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
