import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, User, Eye, EyeOff, AlertCircle, Loader2, X, ArrowLeft } from 'lucide-react';

export default function LoginPage({ onNavigate, initialMode = null }) {
  const { login, register } = useAuth();

  // Mode: null (matches the exact screenshot front page), 'login' (slide-up form), 'register'
  const [activeSheet, setActiveSheet] = useState(initialMode);

  React.useEffect(() => {
    setActiveSheet(initialMode);
  }, [initialMode]);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Register form state
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login({ email: email.trim(), password });
      onNavigate?.('/home');
    } catch (err) {
      setError(err.message || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!regEmail.trim() || !regPassword) {
      setError('Please enter both email and password.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register({ fullName: fullName.trim(), email: regEmail.trim(), password: regPassword });
      onNavigate?.('/home');
    } catch (err) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0c0a] flex items-center justify-center p-0 sm:p-4 selection:bg-[#c5a872]/30 selection:text-[#f3ece0]">
      {/* Exact Mobile Frame Container - Edge-to-edge on mobile, sleek frame on desktop */}
      <div className="w-full max-w-[430px] min-h-[100dvh] sm:min-h-[840px] bg-[#141210] rounded-none sm:rounded-[2.5rem] border-0 sm:border border-[#2a241e] shadow-2xl p-5 sm:p-7 flex flex-col justify-between relative overflow-hidden">
        
        {/* Subtle Warm Amber Glow Behind Header */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-36 bg-[#c5a872]/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. TOP HEADER BAR */}
        <div className="flex items-center justify-between z-10 pt-1">
          <div className="flex items-center gap-3">
            {/* Vintage Golden Vault Emblem Button */}
            <div className="w-11 h-11 rounded-xl bg-[#c5a872] flex items-center justify-center text-[#141210] shadow-md flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M8 8L16 16M16 8L8 16" />
                <circle cx="12" cy="12" r="1.8" fill="currentColor" />
              </svg>
            </div>

            {/* Title: MEMORY VAULT */}
            <span className="font-serif font-black tracking-wider text-base sm:text-lg text-[#d8c5a4] uppercase">
              Memory Vault
            </span>
          </div>

          {/* Pill Badge: Free forever */}
          <span className="text-[11px] font-serif text-[#a69d8f] bg-[#221f1b] border border-[#38322a] px-3.5 py-1 rounded-full shadow-sm">
            Free forever
          </span>
        </div>

        {/* 2. CENTER CONTENT */}
        <div className="space-y-4 my-auto py-4 z-10 text-center">
          {/* Eyebrow Sub-heading */}
          <p className="text-[11px] sm:text-xs font-serif font-bold tracking-[0.2em] text-[#c5a872] uppercase">
            Welcome to your digital archive
          </p>

          {/* Main Title */}
          <h1 className="font-serif text-3xl sm:text-[34px] font-bold text-[#f3ece0] tracking-tight leading-[1.18] max-w-xs mx-auto">
            Every memory deserves a place.
          </h1>

          {/* Tagline Subtitle */}
          <p className="font-serif text-xs sm:text-sm text-[#b2a99b] max-w-xs sm:max-w-sm mx-auto leading-relaxed">
            Preserve the past. Write your story. Unlock the future.
          </p>

          {/* Photograph Artwork: Framed Family Photos, Warm Glowing Candles, Keepsake Box & Journal */}
          <div className="mt-4 relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[#2e2821] shadow-2xl bg-[#1c1815] aspect-[570/305]">
            <img 
              src="/images/memory_shrine.png" 
              alt="Every memory deserves a place"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to user uploaded reference design if needed
                e.target.src = '/images/user_reference_design.png';
              }}
            />
            {/* Subtle warm vignette on edges */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#141210]/60 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* 3. BOTTOM ACTIONS & FOOTER */}
        <div className="space-y-4 z-10 pb-1">
          {/* Action Buttons: Login & Register */}
          <div className="grid grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => {
                setError('');
                setActiveSheet('login');
              }}
              className="w-full min-h-[48px] py-3 px-4 bg-[#c5a872] hover:bg-[#d4b983] text-[#141210] font-serif font-bold text-base rounded-2xl shadow-lg hover:brightness-105 active:scale-[0.98] transition text-center flex items-center justify-center"
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => {
                setError('');
                setActiveSheet('register');
              }}
              className="w-full min-h-[48px] py-3 px-4 bg-transparent border border-[#c5a872]/60 hover:border-[#c5a872] text-[#f3ece0] hover:bg-white/5 font-serif font-bold text-base rounded-2xl transition active:scale-[0.98] text-center flex items-center justify-center"
            >
              Register
            </button>
          </div>

          {/* Footer Tagline */}
          <p className="text-[11px] font-serif text-[#7d7467] text-center tracking-wider pt-1">
            Your memories. Your privacy. Your vault.
          </p>
        </div>

        {/* 4. SLIDE-UP LOGIN SHEET */}
        {activeSheet === 'login' && (
          <div className="absolute inset-0 z-50 bg-[#141210]/95 backdrop-blur-md rounded-[2rem] sm:rounded-[2.5rem] p-6 flex flex-col justify-between animate-in fade-in slide-in-from-bottom-8 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#2a241e]">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg text-[#f3ece0]">Sign In</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveSheet(null)}
                className="p-2 text-[#a69d8f] hover:text-[#f3ece0] rounded-xl hover:bg-[#221f1b] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-auto py-4 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-xs bg-rose-950/50 text-rose-300 rounded-xl border border-rose-900/60">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-serif font-bold tracking-wider text-[#d8c5a4] uppercase mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8a8072] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-3.5 py-3 text-base bg-[#1f1b17] border border-[#383129] rounded-xl text-[#f3ece0] placeholder-[#73695c] focus:outline-none focus:ring-2 focus:ring-[#c5a872]/40 focus:border-[#c5a872]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-serif font-bold tracking-wider text-[#d8c5a4] uppercase">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => onNavigate?.('/forgot-password')}
                      className="text-xs font-serif text-[#c5a872] hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#8a8072] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-3 text-base bg-[#1f1b17] border border-[#383129] rounded-xl text-[#f3ece0] placeholder-[#73695c] focus:outline-none focus:ring-2 focus:ring-[#c5a872]/40 focus:border-[#c5a872]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="min-h-[44px] min-w-[44px] absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#8a8072] hover:text-[#f3ece0]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    id="sheet-remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#c5a872] focus:ring-[#c5a872] border-[#383129] bg-[#1f1b17]"
                  />
                  <label htmlFor="sheet-remember" className="ml-2 text-xs font-serif text-[#b2a99b] cursor-pointer">
                    Remember me on this device
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[50px] py-3.5 px-4 bg-[#c5a872] hover:bg-[#d4b983] text-[#141210] font-serif font-bold text-base rounded-xl shadow-lg transition flex items-center justify-center gap-2 mt-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Enter Vault &rarr;</span>
                </button>
              </form>
            </div>

            <div className="pt-3 border-t border-[#2a241e] text-center text-xs font-serif text-[#b2a99b]">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setActiveSheet('register');
                }}
                className="font-bold text-[#c5a872] hover:underline ml-1"
              >
                Register
              </button>
            </div>
          </div>
        )}

        {/* 5. SLIDE-UP REGISTER SHEET */}
        {activeSheet === 'register' && (
          <div className="absolute inset-0 z-50 bg-[#141210]/95 backdrop-blur-md rounded-[2rem] sm:rounded-[2.5rem] p-6 flex flex-col justify-between animate-in fade-in slide-in-from-bottom-8 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#2a241e]">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg text-[#f3ece0]">Create Vault Account</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveSheet(null)}
                className="p-2 text-[#a69d8f] hover:text-[#f3ece0] rounded-xl hover:bg-[#221f1b] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-auto py-3 space-y-3">
              {error && (
                <div className="flex items-center gap-2 p-3 text-xs bg-rose-950/50 text-rose-300 rounded-xl border border-rose-900/60">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-serif font-bold tracking-wider text-[#d8c5a4] uppercase mb-1">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#8a8072] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full pl-10 pr-3.5 py-2.5 text-base bg-[#1f1b17] border border-[#383129] rounded-xl text-[#f3ece0] placeholder-[#73695c] focus:outline-none focus:ring-2 focus:ring-[#c5a872]/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-serif font-bold tracking-wider text-[#d8c5a4] uppercase mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8a8072] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      inputMode="email"
                      autoCapitalize="none"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 text-base bg-[#1f1b17] border border-[#383129] rounded-xl text-[#f3ece0] placeholder-[#73695c] focus:outline-none focus:ring-2 focus:ring-[#c5a872]/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-serif font-bold tracking-wider text-[#d8c5a4] uppercase mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#8a8072] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-11 py-2.5 text-base bg-[#1f1b17] border border-[#383129] rounded-xl text-[#f3ece0] placeholder-[#73695c] focus:outline-none focus:ring-2 focus:ring-[#c5a872]/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="min-h-[44px] min-w-[44px] absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#8a8072] hover:text-[#f3ece0]"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-serif font-bold tracking-wider text-[#d8c5a4] uppercase mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#8a8072] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full pl-10 pr-3.5 py-2.5 text-base bg-[#1f1b17] border border-[#383129] rounded-xl text-[#f3ece0] placeholder-[#73695c] focus:outline-none focus:ring-2 focus:ring-[#c5a872]/40"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[50px] py-3.5 px-4 bg-[#c5a872] hover:bg-[#d4b983] text-[#141210] font-serif font-bold text-base rounded-xl shadow-lg transition flex items-center justify-center gap-2 mt-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Create Account</span>
                </button>
              </form>
            </div>

            <div className="pt-3 border-t border-[#2a241e] text-center text-xs font-serif text-[#b2a99b]">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setActiveSheet('login');
                }}
                className="font-bold text-[#c5a872] hover:underline ml-1"
              >
                Sign In
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
