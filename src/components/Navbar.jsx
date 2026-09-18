import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, BookOpen, Film, Clock, User, LogOut, KeyRound } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenAuth, onGuestEnter }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-vault-950/90 backdrop-blur-md border-b border-amber-900/30 text-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo & Brand */}
        <div 
          onClick={() => setActiveTab(user ? 'dashboard' : 'landing')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 via-amber-700 to-amber-950 flex items-center justify-center shadow-lg shadow-amber-900/40 border border-amber-500/30 group-hover:border-amber-400/60 transition-all">
            <KeyRound className="w-5 h-5 text-amber-200 group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-cinzel tracking-wider text-lg font-bold bg-gradient-to-r from-amber-200 via-amber-100 to-stone-400 bg-clip-text text-transparent">
                MEMORY VAULT
              </span>
              <span className="text-[10px] uppercase tracking-widest bg-amber-950/80 text-amber-400 px-1.5 py-0.5 rounded border border-amber-800/60">
                100% Private
              </span>
            </div>
            <p className="text-[10px] text-stone-400 tracking-wider font-mono">TIME CAPSULE & ARCHIVE</p>
          </div>
        </div>

        {/* Navigation for authenticated user */}
        {user ? (
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-amber-950/60 text-amber-200 border border-amber-700/50' 
                  : 'text-stone-300 hover:text-amber-200 hover:bg-stone-900/50'
              }`}
            >
              Vault Hub
            </button>

            <button
              onClick={() => setActiveTab('diary')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center space-x-1.5 transition-all ${
                activeTab === 'diary' 
                  ? 'bg-amber-900/40 text-amber-100 border border-amber-600/60 shadow-inner' 
                  : 'text-stone-300 hover:text-amber-200 hover:bg-stone-900/50'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Tragic Diary</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            </button>

            <button
              onClick={() => setActiveTab('media')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center space-x-1.5 transition-all ${
                activeTab === 'media' 
                  ? 'bg-amber-950/60 text-amber-200 border border-amber-700/50' 
                  : 'text-stone-300 hover:text-amber-200 hover:bg-stone-900/50'
              }`}
            >
              <Film className="w-4 h-4 text-amber-400" />
              <span>Photos & Videos</span>
            </button>

            <button
              onClick={() => setActiveTab('capsules')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center space-x-1.5 transition-all ${
                activeTab === 'capsules' 
                  ? 'bg-amber-950/60 text-amber-200 border border-amber-700/50' 
                  : 'text-stone-300 hover:text-amber-200 hover:bg-stone-900/50'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Time Capsule</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'settings' 
                  ? 'bg-amber-950/60 text-amber-200 border border-amber-700/50' 
                  : 'text-stone-300 hover:text-amber-200 hover:bg-stone-900/50'
              }`}
            >
              Security
            </button>
          </nav>
        ) : null}

        {/* User Status / Auth Buttons */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-medium text-stone-200">{user?.name?.replace(/\.+$/, '')}</span>
                <span className="text-[10px] text-amber-400/80 flex items-center justify-end space-x-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 inline" />
                  <span>Permanent Storage</span>
                </span>
              </div>
              <button
                onClick={logout}
                title="Seal & Exit Vault"
                className="p-2 rounded-lg bg-stone-900/80 text-stone-400 hover:text-rose-300 hover:bg-stone-800/80 border border-stone-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={onGuestEnter}
                className="hidden sm:inline-flex px-3 py-1.5 rounded-lg text-xs text-stone-300 hover:text-amber-200 hover:bg-stone-900/80 border border-stone-800 transition-all font-medium items-center space-x-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Instant Vault</span>
              </button>
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-1.5 rounded-lg text-sm text-amber-200 hover:text-amber-100 hover:bg-stone-900/80 border border-amber-800/50 transition-all font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-4 py-1.5 rounded-lg text-sm bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-stone-900 font-semibold hover:brightness-110 shadow-md shadow-amber-950/30 transition-all border border-amber-500/40"
              >
                Create Vault
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Mobile Nav Bar */}
      {user && (
        <div className="md:hidden flex items-center justify-around border-t border-stone-800/60 bg-vault-950/95 py-2 px-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center text-xs py-1 px-2 rounded ${activeTab === 'dashboard' ? 'text-amber-300' : 'text-stone-400'}`}
          >
            <span>Hub</span>
          </button>
          <button
            onClick={() => setActiveTab('diary')}
            className={`flex flex-col items-center text-xs py-1 px-2 rounded ${activeTab === 'diary' ? 'text-amber-300 font-bold' : 'text-stone-400'}`}
          >
            <BookOpen className="w-4 h-4 mb-0.5" />
            <span>Diary</span>
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`flex flex-col items-center text-xs py-1 px-2 rounded ${activeTab === 'media' ? 'text-amber-300' : 'text-stone-400'}`}
          >
            <Film className="w-4 h-4 mb-0.5" />
            <span>Vault</span>
          </button>
          <button
            onClick={() => setActiveTab('capsules')}
            className={`flex flex-col items-center text-xs py-1 px-2 rounded ${activeTab === 'capsules' ? 'text-amber-300' : 'text-stone-400'}`}
          >
            <Clock className="w-4 h-4 mb-0.5" />
            <span>Capsule</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center text-xs py-1 px-2 rounded ${activeTab === 'settings' ? 'text-amber-300' : 'text-stone-400'}`}
          >
            <ShieldCheck className="w-4 h-4 mb-0.5" />
            <span>Security</span>
          </button>
        </div>
      )}
    </header>
  );
}
