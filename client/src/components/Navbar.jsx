import React from 'react';
import { ShieldCheck, Feather, Image, Video, Lock, User, LogOut, Heart } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, user, onLogout, onOpenAuth }) {
  return (
    <header className="sticky top-0 z-40 bg-[#0c0f17]/90 backdrop-blur-md border-b border-amber-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div 
            onClick={() => setActiveTab('vault')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 via-amber-700/30 to-amber-900/40 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-950/40 group-hover:border-amber-400 transition-all">
              <Lock className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-lg font-cinzel font-bold tracking-wider text-amber-100 flex items-center gap-1.5">
                MEMORY VAULT
              </span>
              <p className="text-[10px] uppercase tracking-widest text-amber-400/70 font-mono -mt-1">
                Private Time Capsule &amp; Diary
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          {user ? (
            <nav className="hidden md:flex items-center gap-1 bg-[#141923] p-1 rounded-xl border border-slate-800/80">
              <button
                onClick={() => setActiveTab('vault')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'vault'
                    ? 'bg-gradient-to-r from-amber-600/30 to-amber-700/20 text-amber-200 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Image className="w-4 h-4 text-amber-400" />
                <span>Memory Vault</span>
              </button>

              <button
                onClick={() => setActiveTab('diary')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'diary'
                    ? 'bg-gradient-to-r from-rose-950/60 via-amber-950/40 to-rose-900/40 text-amber-200 border border-rose-800/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Feather className="w-4 h-4 text-rose-400 animate-pulse" />
                <span className="font-serif italic font-semibold">Tragic Diary</span>
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'profile'
                    ? 'bg-gradient-to-r from-amber-600/30 to-amber-700/20 text-amber-200 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Security &amp; Profile</span>
              </button>
            </nav>
          ) : null}

          {/* Right Action Area */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-semibold text-amber-100">{user.name}</div>
                  <div className="text-[10px] text-emerald-400 flex items-center justify-end gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Strict Private Vault Active
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="Secure Logout"
                  className="p-2 rounded-lg bg-slate-800/60 hover:bg-red-950/40 text-slate-400 hover:text-red-300 border border-slate-700/60 hover:border-red-800/50 transition-all flex items-center gap-1.5 text-xs font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-sm shadow-lg shadow-amber-900/30 hover:shadow-amber-500/20 transition-all flex items-center gap-2 font-cinzel tracking-wider"
              >
                <Lock className="w-4 h-4" />
                <span>Enter Vault</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Tab bar */}
        {user && (
          <div className="flex md:hidden border-t border-slate-800 py-2 gap-1 justify-around text-xs">
            <button
              onClick={() => setActiveTab('vault')}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg ${
                activeTab === 'vault' ? 'text-amber-300 bg-amber-950/40' : 'text-slate-400'
              }`}
            >
              <Image className="w-4 h-4" />
              <span>Vault</span>
            </button>
            <button
              onClick={() => setActiveTab('diary')}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg ${
                activeTab === 'diary' ? 'text-rose-300 bg-rose-950/40' : 'text-slate-400'
              }`}
            >
              <Feather className="w-4 h-4" />
              <span>Tragic Diary</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg ${
                activeTab === 'profile' ? 'text-emerald-300 bg-emerald-950/40' : 'text-slate-400'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Security</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
