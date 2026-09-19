import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';
import { 
  LayoutDashboard, GitCommit, Film, BookOpen, Clock, 
  Plus, LogOut, ShieldCheck, User, Menu, X, Sparkles 
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onOpenAuth, 
  onGuestEnter,
  onOpenAddMemory 
}) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'timeline', label: 'Timeline', icon: GitCommit },
    { id: 'media', label: 'Photos & Videos', icon: Film },
    { id: 'diary', label: 'Secret Diary', icon: BookOpen },
    { id: 'capsules', label: 'Time Capsules', icon: Clock },
  ];

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-stone-950/85 backdrop-blur-xl border-b border-white/5 text-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          
          {/* Brand Emblem */}
          <div 
            onClick={() => setActiveTab(user ? 'dashboard' : 'landing')}
            className="cursor-pointer group py-1"
          >
            <BrandLogo size="md" />
          </div>

          {/* Center Navigation for authenticated users */}
          {user ? (
            <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 p-1 rounded-2xl bg-stone-900/60 border border-white/5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-950/40'
                        : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-stone-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          ) : null}

          {/* Right Action Area */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* + Add Memory Primary Button */}
                <button
                  onClick={onOpenAddMemory}
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:brightness-110 text-stone-950 font-bold text-xs shadow-md shadow-amber-950/40 border border-amber-400/40 transition hover:scale-[1.02]"
                >
                  <Plus className="w-4 h-4 text-stone-950" />
                  <span>Add Memory</span>
                </button>

                {/* User Profile Pill & Logout */}
                <div className="flex items-center gap-2.5 pl-2">
                  <div className="hidden lg:flex flex-col text-right">
                    <span className="text-xs font-bold text-stone-200">
                      {user?.name ? user.name.replace(/\.+$/, '') : 'Keeper'}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center justify-end gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Cloud Synced</span>
                    </span>
                  </div>

                  <button
                    onClick={logout}
                    title="Sign Out of TimeMemory"
                    className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-rose-400 hover:border-rose-900/50 transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={onGuestEnter}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs text-stone-300 hover:text-amber-200 bg-stone-900/60 hover:bg-stone-900 border border-stone-800 font-medium transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Instant Demo</span>
                </button>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-200 hover:text-amber-300 bg-stone-900/80 hover:bg-stone-800 border border-stone-700/80 transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:brightness-110 text-stone-950 shadow-md shadow-amber-950/40 border border-amber-400/40 transition"
                >
                  Create Archive
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Fixed for authentic mobile app feel) */}
      {user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-stone-950/95 backdrop-blur-2xl border-t border-stone-800/80 px-2 py-1.5 flex items-center justify-around shadow-2xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center p-1 rounded-xl transition ${
                  isActive ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-amber-400' : 'text-stone-400'}`} />
                <span className="text-[10px] tracking-tight">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}

          {/* Quick Floating Add button in mobile nav */}
          <button
            onClick={onOpenAddMemory}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-stone-950 shadow-lg shadow-amber-500/20"
            title="Add Memory"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      )}
    </>
  );
}
