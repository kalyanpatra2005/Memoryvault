import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { vaultEngine } from '../services/vaultEngine';
import { X, Lock, Mail, Phone, Calendar, User, ShieldCheck, Eye, EyeOff, KeyRound, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onSuccess }) {
  const { login } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login', 'register', or 'reset'

  // Login form state (email or phone + password)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state (name, email, phone, dob, password, confirm password)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Reset password form state (identifier, dob, newPassword, confirmNewPassword)
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetDob, setResetDob] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Handle Login (Email or Phone + Password)
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await vaultEngine.login({
        identifier: loginIdentifier.trim(),
        password: loginPassword
      });

      login(data.token, data.user);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to unlock vault.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (regPassword !== regConfirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const data = await vaultEngine.register({
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        dob: regDob,
        password: regPassword,
        confirmPassword: regConfirmPassword
      });

      setSuccessMsg('Vault created! Signing you in...');
      setTimeout(() => {
        login(data.token, data.user);
        if (onSuccess) onSuccess();
        onClose();
      }, 600);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Reset with DOB
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (resetNewPassword !== resetConfirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (resetNewPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const data = await vaultEngine.resetPassword({
        identifier: resetIdentifier.trim(),
        dob: resetDob,
        newPassword: resetNewPassword
      });

      setSuccessMsg('Password reset! Unlocking your vault...');
      setTimeout(() => {
        login(data.token, data.user);
        if (onSuccess) onSuccess();
        onClose();
      }, 700);
    } catch (err) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestEntry = () => {
    const session = vaultEngine.createGuestSession();
    login(session.token, session.user);
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-md bg-stone-900 border border-amber-800/40 rounded-2xl shadow-2xl p-6 sm:p-8 text-stone-100 my-8"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 30px rgba(180, 83, 9, 0.15)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-100 p-1.5 rounded-lg hover:bg-stone-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Vault Emblem */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-950 border border-amber-500/40 mb-3 shadow-lg shadow-amber-950">
            <KeyRound className="w-6 h-6 text-amber-200" />
          </div>
          <h2 className="text-2xl font-bold font-antique text-amber-100 tracking-wide">
            {mode === 'login' && 'Unlock Your Vault'}
            {mode === 'register' && 'Create Your Free Vault'}
            {mode === 'reset' && 'Reset Master Password'}
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            {mode === 'login' && 'Enter your email or phone and password to open your vault'}
            {mode === 'register' && '100% free, private, and preserved for life'}
            {mode === 'reset' && 'Verify your identity with Date of Birth to set a new password'}
          </p>
        </div>

        {/* Tab Switcher */}
        {mode !== 'reset' && (
          <div className="flex rounded-lg bg-stone-950 p-1 mb-6 border border-stone-800">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === 'login'
                  ? 'bg-amber-900/60 text-amber-200 border border-amber-700/50 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === 'register'
                  ? 'bg-amber-900/60 text-amber-200 border border-amber-700/50 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              New Register
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs space-y-2">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            {error.toLowerCase().includes('already exists') && (
              <div className="pt-1 border-t border-rose-900/50 flex items-center space-x-3 text-xs">
                <button
                  type="button"
                  onClick={() => { 
                    setMode('login'); 
                    setLoginIdentifier(regEmail || regPhone);
                    setError(''); 
                  }}
                  className="text-amber-300 hover:underline font-semibold"
                >
                  Sign In Now →
                </button>
                <button
                  type="button"
                  onClick={() => { 
                    setMode('reset'); 
                    setResetIdentifier(regEmail || regPhone);
                    setError(''); 
                  }}
                  className="text-stone-300 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            )}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 text-xs flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. SIGN IN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Email Address or Phone Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. name@email.com or 9876543210"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-stone-950/90 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-stone-300">
                  Master Password
                </label>
                <button
                  type="button"
                  onClick={() => { 
                    setMode('reset'); 
                    setResetIdentifier(loginIdentifier);
                    setError(''); 
                  }}
                  className="text-[11px] text-amber-400/90 hover:text-amber-200 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-stone-950/90 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-stone-500 hover:text-stone-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-stone-950 font-bold rounded-lg text-sm shadow-lg shadow-amber-950 transition-all border border-amber-400/40 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Unlocking Vault...' : 'Enter Secret Vault'}
            </button>
          </form>
        )}

        {/* 2. REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Kalyan Patra"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-stone-950/90 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                <User className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="name@email.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-9 pr-2 py-2 bg-stone-950/90 border border-stone-700 rounded-lg text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                  <Mail className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="+91 9876543210"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full pl-9 pr-2 py-2 bg-stone-950/90 border border-stone-700 rounded-lg text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                  <Phone className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Date of Birth (Used for account recovery)
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={regDob}
                  onChange={(e) => setRegDob(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-stone-950/90 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 [color-scheme:dark]"
                />
                <Calendar className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Master Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min. 6 chars"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-9 pr-2 py-2 bg-stone-950/90 border border-stone-700 rounded-lg text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                  <Lock className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Repeat password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-2 py-2 bg-stone-950/90 border border-stone-700 rounded-lg text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                  <Lock className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between">
              <label className="flex items-center space-x-2 text-xs text-stone-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  className="rounded border-stone-700 bg-stone-950 text-amber-500 focus:ring-amber-500"
                />
                <span>Show passwords</span>
              </label>
            </div>

            <div className="p-2.5 bg-amber-950/40 rounded-lg border border-amber-800/40 flex items-start space-x-2 text-[11px] text-amber-200/90">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>100% Free & Private:</strong> Permanent storage with no fees or subscription. Only you can view your memories.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-stone-950 font-bold rounded-lg text-sm shadow-lg shadow-amber-950 transition-all border border-amber-400/40 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Creating Vault...' : 'Seal & Create Permanent Vault'}
            </button>
          </form>
        )}

        {/* 3. RESET PASSWORD FORM */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Your Registered Email or Phone Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. name@email.com or 9876543210"
                  value={resetIdentifier}
                  onChange={(e) => setResetIdentifier(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-stone-950/90 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Security Verification: Date of Birth
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={resetDob}
                  onChange={(e) => setResetDob(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-stone-950/90 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 [color-scheme:dark]"
                />
                <Calendar className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                New Master Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Min. 6 characters"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-stone-950/90 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Confirm New Master Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Repeat new password"
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-stone-950/90 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between">
              <label className="flex items-center space-x-2 text-xs text-stone-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  className="rounded border-stone-700 bg-stone-950 text-amber-500 focus:ring-amber-500"
                />
                <span>Show password</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-emerald-600 via-emerald-700 to-amber-700 hover:from-emerald-500 hover:to-amber-600 text-stone-950 font-bold rounded-lg text-sm shadow-lg shadow-amber-950 transition-all border border-emerald-400/40 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Resetting Password...' : 'Reset Password & Unlock Vault'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className="text-xs text-stone-400 hover:text-amber-300 transition underline"
              >
                ← Return to Sign In
              </button>
            </div>
          </form>
        )}

        {/* Switch mode footer */}
        {mode !== 'reset' && (
          <div className="text-center mt-5 text-xs text-stone-400">
            {mode === 'login' ? (
              <p>
                Don't have a vault yet?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(''); }}
                  className="text-amber-400 hover:underline font-semibold"
                >
                  Register free here
                </button>
              </p>
            ) : (
              <p>
                Already hold an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-amber-400 hover:underline font-semibold"
                >
                  Sign in with credentials
                </button>
              </p>
            )}
          </div>
        )}

        {/* Instant Guest Access */}
        <div className="mt-4 pt-3 border-t border-stone-800/80 text-center">
          <button
            type="button"
            onClick={handleGuestEntry}
            className="inline-flex items-center space-x-1.5 text-xs text-stone-400 hover:text-amber-300 transition py-1.5 px-3 rounded-lg hover:bg-stone-800/60 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant Guest Access (No sign up needed)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
