import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import VaultView from './components/VaultView';
import TragicDiaryView from './components/TragicDiaryView';
import ProfileView from './components/ProfileView';
import { 
  Lock, Feather, Image as ImageIcon, Video, ShieldCheck, 
  Sparkles, Calendar, HeartCrack, ChevronRight, CheckCircle2 
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState('vault'); // 'vault', 'diary', 'profile'
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check saved session on initial load
  useEffect(() => {
    const savedToken = localStorage.getItem('vault_token');
    const savedUser = localStorage.getItem('vault_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('vault_token');
        localStorage.removeItem('vault_user');
      }
    }
    setLoading(false);
  }, []);

  const handleAuthSuccess = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setIsAuthOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('vault_token');
    localStorage.removeItem('vault_user');
    setUser(null);
    setToken(null);
    setActiveTab('vault');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0d13] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-cinzel text-amber-100 text-sm mt-4 tracking-widest">OPENING MEMORY VAULT...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0d13] text-[#e2e8f0]">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {user ? (
          /* ================= LOGGED IN VIEWS ================= */
          <div>
            {activeTab === 'vault' && <VaultView token={token} user={user} />}
            {activeTab === 'diary' && <TragicDiaryView token={token} user={user} />}
            {activeTab === 'profile' && <ProfileView token={token} user={user} onLogout={handleLogout} />}
          </div>
        ) : (
          /* ================= START PAGE / LANDING PORTAL ================= */
          <div className="relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-amber-600/15 via-rose-900/15 to-transparent rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 text-center relative z-10">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-8 shadow-inner">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Free • Strict 256-Bit Private Isolation • Lifetime Storage</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-cinzel font-black tracking-tight text-amber-100 leading-tight">
                THE TIME CAPSULE <br />
                <span className="bg-gradient-to-r from-amber-400 via-rose-300 to-amber-200 bg-clip-text text-transparent">
                  &amp; TRAGIC DIARY VAULT
                </span>
              </h1>

              <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-3xl mx-auto font-serif leading-relaxed italic">
                A sanctuary to seal your most cherished photographs, unforgettable videos, and heart-wrenching personal diary confessions. Completely private to your eyes alone, preserved forever without subscription.
              </p>

              {/* Call to Action Buttons */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-cinzel font-bold text-base tracking-wider shadow-xl shadow-amber-950/60 hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2 group"
                >
                  <Lock className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  <span>Enter or Register Your Vault</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left">
                {/* Feature 1: The Tragic Diary */}
                <div 
                  onClick={() => setIsAuthOpen(true)}
                  className="p-6 rounded-2xl bg-[#141824] border border-rose-950/80 hover:border-rose-700/60 transition-all shadow-xl group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-rose-950/80 border border-rose-800/40 flex items-center justify-center text-rose-300 mb-4 group-hover:scale-110 transition-transform">
                    <Feather className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-cinzel font-bold text-amber-100 text-lg">Old Tragic Beautiful Diary</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold uppercase">
                      Special
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-2 font-serif leading-relaxed">
                    Write personal memoirs onto aged antique parchment or candlelight noir with atmospheric rain sounds and melancholic mood tags.
                  </p>
                </div>

                {/* Feature 2: Photo & Video Vault */}
                <div 
                  onClick={() => setIsAuthOpen(true)}
                  className="p-6 rounded-2xl bg-[#141824] border border-slate-800 hover:border-amber-500/50 transition-all shadow-xl group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <h3 className="font-cinzel font-bold text-amber-100 text-lg">Photos &amp; Video Capsules</h3>
                  <p className="text-sm text-slate-400 mt-2 font-serif leading-relaxed">
                    Upload full-resolution photos and video clips with dates and tags. Optionally seal them as future time capsules for anniversaries.
                  </p>
                </div>

                {/* Feature 3: Strict Security & Forever Permanent */}
                <div 
                  onClick={() => setIsAuthOpen(true)}
                  className="p-6 rounded-2xl bg-[#141824] border border-slate-800 hover:border-emerald-500/50 transition-all shadow-xl group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="font-cinzel font-bold text-amber-100 text-lg">Strict Privacy &amp; Permanent</h3>
                  <p className="text-sm text-slate-400 mt-2 font-serif leading-relaxed">
                    No one else can ever see your photos or notes. Unless you choose to delete them, everything stays permanently preserved.
                  </p>
                </div>
              </div>

              {/* Security and Free Pledge Banner */}
              <div className="mt-16 p-6 rounded-2xl bg-[#0f131c] border border-amber-900/30 flex flex-wrap items-center justify-around gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Name, Phone, Email &amp; DOB Registration</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Zero Subscriptions &amp; 100% Free Forever</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Strict Owner-Only Media Streaming</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Permanent Local SQLite Database</span>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#090b10] py-6 text-center text-xs text-slate-500 font-serif">
        <p>© Kalyan 2026 The Memory Vault &amp; Tragic Diary • Built for permanent, sacred personal preservation.</p>
      </footer>

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
