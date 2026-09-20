import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Calendar, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';
import Button from '../../components/ui/Button';

export default function ForgotPasswordPage({ onNavigate }) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide your account email.');
      return;
    }
    if (!newPassword) {
      setError('Please enter your new password.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-type your new password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await resetPassword({
        email: email.trim(),
        dob: dob || null,
        newPassword
      });
      setSuccess(true);
      setTimeout(() => {
        onNavigate?.('/home');
      }, 1600);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <button
          onClick={() => onNavigate?.('/login')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-6 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </button>

        <div className="flex items-center justify-center gap-2 mb-2">
          <BrandLogo size={28} />
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100">TimeMemory</span>
        </div>

        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Reset your password
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
          Enter your account details and security verification to set a new password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-5 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900/60">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Password Reset Successfully!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Your new password has been set and your vault is unlocked. Redirecting to your memory book...
              </p>
              <Button
                variant="primary"
                onClick={() => onNavigate?.('/home')}
                className="w-full mt-4"
              >
                Go to Vault
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Date of Birth (Security Verification) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Date of Birth <span className="text-slate-400 font-normal">(Security Verification)</span>
                  </label>
                </div>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  If you entered your Date of Birth when registering, provide it to verify ownership.
                </p>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-10 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type your new password"
                    className="w-full pl-9 pr-10 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 shadow-sm mt-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Reset Password & Unlock Vault</span>
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
