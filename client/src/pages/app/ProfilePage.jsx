import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { memoryService } from '../../services/memoryService';
import { User, Mail, Shield, Calendar, Layers, Heart, Image as ImageIcon, CheckCircle2, Loader2, Save } from 'lucide-react';
import Button from '../../components/ui/Button';

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ totalMemories: 0, mediaCount: 0, favoritesCount: 0 });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
    } else if (user) {
      setFullName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
    }

    memoryService.getStatistics().then(setStats).catch(console.error);
  }, [user, profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateProfile({ fullName: fullName.trim() });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const displayName = fullName || user?.email?.split('@')[0] || 'User';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Your Profile
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your personal vault identity and view account metrics.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
          {displayName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {displayName}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>RLS Verified</span>
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{user?.email}</span>
          </p>

          <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>Vault active since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '2026'}</span>
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
          <Layers className="w-4 h-4 mx-auto text-indigo-500 mb-1" />
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{stats.totalMemories}</span>
          <p className="text-[11px] text-slate-400">Memories</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
          <ImageIcon className="w-4 h-4 mx-auto text-violet-500 mb-1" />
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{stats.mediaCount}</span>
          <p className="text-[11px] text-slate-400">Media</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
          <Heart className="w-4 h-4 mx-auto text-rose-500 mb-1" />
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{stats.favoritesCount}</span>
          <p className="text-[11px] text-slate-400">Favorites</p>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
          Personal Information
        </h3>

        {error && (
          <div className="p-3 mb-4 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        {savedSuccess && (
          <div className="flex items-center gap-2 p-3 mb-4 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
            <span>Profile information updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Account Email
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-500 cursor-not-allowed"
            />
            <p className="text-[11px] text-slate-400 mt-1">To change your email, contact system security.</p>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Changes</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
