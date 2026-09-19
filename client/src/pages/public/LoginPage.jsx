import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';

export default function LoginPage({ onNavigate }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
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

  return (
    <div className="min-h-screen bg-paper-100 dark:bg-paper-950 flex flex-col justify-between transition-colors safe-area-inset">
      {/* Top Header Bar for Mobile */}
      <div className="w-full max-w-md mx-auto px-5 pt-6 sm:pt-10 flex items-center justify-between">
        <button
          onClick={() => onNavigate?.('/')}
          className="min-h-[44px] min-w-[44px] -ml-2 inline-flex items-center justify-center gap-1.5 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition rounded-full hover:bg-stone-200/50 dark:hover:bg-stone-800/50"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-serif italic text-stone-400">TimeMemory</span>
      </div>

      {/* Main Content: Mobile-First Layout */}
      <div className="w-full max-w-md mx-auto px-5 sm:px-8 py-4 flex-1 flex flex-col justify-center">
        {/* Brand & Heading */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <BrandLogo size="md" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Welcome Back
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            Sign in to open your memory book
          </p>
        </div>

        {/* Form Container (Clean edge-to-edge on mobile, framed on tablet/desktop) */}
        <div className="sm:bg-paper-50 sm:dark:bg-stone-900 sm:p-8 sm:rounded-3xl sm:shadow-lg sm:border sm:border-stone-200/90 sm:dark:border-stone-800">
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 mb-5 text-xs sm:text-sm bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-900/60 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1.5 font-sans">
                Email
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3.5 text-base bg-white dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 rounded-2xl text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-600 transition shadow-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 font-sans">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate?.('/forgot-password')}
                  className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline py-1"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3.5 text-base bg-white dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 rounded-2xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-600 transition shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="min-h-[44px] min-w-[44px] absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-xl"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer py-1 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-800 focus:ring-amber-500 border-stone-300 dark:border-stone-700"
                />
                <span className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                  Remember me on this device
                </span>
              </label>
            </div>

            {/* Big Mobile Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[50px] py-3.5 px-6 bg-gradient-to-r from-amber-800 to-amber-700 hover:from-amber-900 hover:to-amber-800 active:scale-[0.99] text-white font-semibold rounded-2xl text-base shadow-md transition flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              <span>Sign In &rarr;</span>
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Switch to Register (Mobile Friendly fixed/centered) */}
      <div className="w-full max-w-md mx-auto px-5 py-6 text-center text-xs sm:text-sm text-stone-500 dark:text-stone-400">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={() => onNavigate?.('/register')}
          className="font-bold text-amber-800 dark:text-amber-400 hover:underline py-1 px-1.5"
        >
          Create one now
        </button>
      </div>
    </div>
  );
}
