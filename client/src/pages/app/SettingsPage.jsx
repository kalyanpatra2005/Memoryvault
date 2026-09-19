import React, { useState, useEffect } from 'react';
import { useAuth, DEFAULT_USER_SETTINGS } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../services/supabaseClient';
import { memoryService } from '../../services/memoryService';
import { 
  Sun, Moon, Monitor, Lock, Download, Trash2, 
  ShieldAlert, CheckCircle2, AlertCircle, Loader2,
  Type, LayoutGrid, List, Clock, Tag, Volume2, Save,
  Sparkles, Check
} from 'lucide-react';
import Button from '../../components/ui/Button';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';

export default function SettingsPage() {
  const { user, settings, updateSettings } = useAuth();
  const { theme, setTheme } = useTheme();

  // Local form state initialized from persistent user settings
  const [currentSettings, setCurrentSettings] = useState({
    ...DEFAULT_USER_SETTINGS,
    ...(settings || {})
  });

  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Export state
  const [exporting, setExporting] = useState(false);

  // Danger zone state
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeLoading, setPurgeLoading] = useState(false);

  // Sync state when settings change from auth context
  useEffect(() => {
    if (settings) {
      setCurrentSettings((prev) => ({
        ...prev,
        ...settings,
      }));
    }
  }, [settings]);

  // Handle setting updates with auto-save to cloud
  const handleSettingChange = async (key, value) => {
    const updated = {
      ...currentSettings,
      [key]: value,
    };
    setCurrentSettings(updated);

    if (key === 'theme') {
      setTheme(value);
    }

    try {
      setSavingSettings(true);
      await updateSettings({ [key]: value });
      setSaveSuccessMessage('Saved permanently to your vault in the cloud');
      setTimeout(() => setSaveSuccessMessage(''), 3500);
    } catch (err) {
      console.error('Failed to auto-save setting:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleExplicitSave = async () => {
    setSavingSettings(true);
    try {
      await updateSettings(currentSettings);
      setSaveSuccessMessage('All settings saved permanently. They will be restored whenever you log in.');
      setTimeout(() => setSaveSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const memories = await memoryService.getMemories();
      const exportBlob = new Blob([JSON.stringify(memories, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(exportBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TimeMemory_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error', err);
    } finally {
      setExporting(false);
    }
  };

  const handlePurgeAllMemories = async () => {
    setPurgeLoading(true);
    try {
      const memories = await memoryService.getMemories();
      for (const m of memories) {
        await memoryService.deleteMemory(m.id);
      }
      setShowPurgeModal(false);
      window.location.reload();
    } catch (err) {
      console.error('Failed to purge memories', err);
    } finally {
      setPurgeLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900 dark:text-[#f3ece0] tracking-tight">
            Vault Settings
          </h1>
          <p className="text-xs font-serif text-stone-500 dark:text-[#a69d8f] mt-1">
            Custom preferences saved permanently to your personal account across all devices.
          </p>
        </div>

        {/* Cloud Sync Status Indicator */}
        <div className="flex items-center gap-2">
          {savingSettings ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-serif bg-amber-500/10 text-amber-600 dark:text-[#c5a872] border border-amber-500/20">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving to cloud...</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-serif bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Check className="w-3.5 h-3.5" />
              <span>Cloud Synced</span>
            </span>
          )}
        </div>
      </div>

      {/* Persistent Save Notification */}
      {saveSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-serif flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
          <span className="font-medium">{saveSuccessMessage}</span>
        </div>
      )}

      {/* 1. Interface Theme */}
      <div className="bg-white dark:bg-[#141210] p-6 rounded-2xl border border-stone-200 dark:border-[#2a241e] shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-serif font-bold text-stone-900 dark:text-[#f3ece0]">
            Interface Theme
          </h2>
          <p className="text-xs font-serif text-stone-500 dark:text-[#a69d8f] mt-0.5">
            Your theme choice is stored in your personal cloud account and restored on every login.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleSettingChange('theme', 'dark')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition cursor-pointer ${
              currentSettings.theme === 'dark'
                ? 'border-[#c5a872] bg-[#c5a872]/15 text-[#f3ece0] font-bold shadow-sm'
                : 'border-stone-200 dark:border-[#2a241e] text-stone-600 dark:text-[#a69d8f] hover:border-stone-400 dark:hover:border-[#3d342a]'
            }`}
          >
            <Moon className="w-5 h-5 text-[#c5a872]" />
            <span className="text-xs font-serif">Dark Vault</span>
          </button>

          <button
            type="button"
            onClick={() => handleSettingChange('theme', 'light')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition cursor-pointer ${
              currentSettings.theme === 'light'
                ? 'border-[#c5a872] bg-[#c5a872]/15 text-stone-900 dark:text-[#f3ece0] font-bold shadow-sm'
                : 'border-stone-200 dark:border-[#2a241e] text-stone-600 dark:text-[#a69d8f] hover:border-stone-400 dark:hover:border-[#3d342a]'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-serif">Warm Paper</span>
          </button>

          <button
            type="button"
            onClick={() => handleSettingChange('theme', 'system')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition cursor-pointer ${
              currentSettings.theme === 'system'
                ? 'border-[#c5a872] bg-[#c5a872]/15 text-stone-900 dark:text-[#f3ece0] font-bold shadow-sm'
                : 'border-stone-200 dark:border-[#2a241e] text-stone-600 dark:text-[#a69d8f] hover:border-stone-400 dark:hover:border-[#3d342a]'
            }`}
          >
            <Monitor className="w-5 h-5 text-stone-400" />
            <span className="text-xs font-serif">Device Auto</span>
          </button>
        </div>
      </div>

      {/* 2. Memoir Typography Style */}
      <div className="bg-white dark:bg-[#141210] p-6 rounded-2xl border border-stone-200 dark:border-[#2a241e] shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-serif font-bold text-stone-900 dark:text-[#f3ece0] flex items-center gap-2">
            <Type className="w-4 h-4 text-[#c5a872]" />
            <span>Diary & Story Typography</span>
          </h2>
          <p className="text-xs font-serif text-stone-500 dark:text-[#a69d8f] mt-0.5">
            Choose the typeface used for your personal reflections, letters, and memory narratives.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleSettingChange('fontStyle', 'serif')}
            className={`p-4 rounded-xl border flex flex-col items-start gap-1 transition cursor-pointer ${
              currentSettings.fontStyle === 'serif'
                ? 'border-[#c5a872] bg-[#c5a872]/15 text-[#f3ece0] font-bold shadow-sm'
                : 'border-stone-200 dark:border-[#2a241e] text-stone-600 dark:text-[#a69d8f] hover:border-[#3d342a]'
            }`}
          >
            <span className="text-lg font-serif font-bold">Classic Serif</span>
            <span className="text-[11px] font-serif text-stone-500 dark:text-[#8a8072]">Playfair / Lora book aesthetic</span>
          </button>

          <button
            type="button"
            onClick={() => handleSettingChange('fontStyle', 'handwriting')}
            className={`p-4 rounded-xl border flex flex-col items-start gap-1 transition cursor-pointer ${
              currentSettings.fontStyle === 'handwriting'
                ? 'border-[#c5a872] bg-[#c5a872]/15 text-[#f3ece0] font-bold shadow-sm'
                : 'border-stone-200 dark:border-[#2a241e] text-stone-600 dark:text-[#a69d8f] hover:border-[#3d342a]'
            }`}
          >
            <span className="text-lg font-sans italic font-bold">Handwritten</span>
            <span className="text-[11px] font-serif text-stone-500 dark:text-[#8a8072]">Personal diary cursive style</span>
          </button>

          <button
            type="button"
            onClick={() => handleSettingChange('fontStyle', 'sans')}
            className={`p-4 rounded-xl border flex flex-col items-start gap-1 transition cursor-pointer ${
              currentSettings.fontStyle === 'sans'
                ? 'border-[#c5a872] bg-[#c5a872]/15 text-[#f3ece0] font-bold shadow-sm'
                : 'border-stone-200 dark:border-[#2a241e] text-stone-600 dark:text-[#a69d8f] hover:border-[#3d342a]'
            }`}
          >
            <span className="text-lg font-sans font-bold">Modern Clean</span>
            <span className="text-[11px] font-serif text-stone-500 dark:text-[#8a8072]">Crisp minimalist typography</span>
          </button>
        </div>
      </div>

      {/* 3. Memory Layout & Defaults */}
      <div className="bg-white dark:bg-[#141210] p-6 rounded-2xl border border-stone-200 dark:border-[#2a241e] shadow-sm space-y-5">
        <div>
          <h2 className="text-base font-serif font-bold text-stone-900 dark:text-[#f3ece0]">
            Viewing & Memory Preferences
          </h2>
          <p className="text-xs font-serif text-stone-500 dark:text-[#a69d8f] mt-0.5">
            Set your default layout and preferred category when opening the memory gallery.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Default Layout */}
          <div>
            <label className="block text-xs font-serif font-bold text-stone-700 dark:text-[#d8c5a4] uppercase tracking-wider mb-2">
              Default Album Layout
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSettingChange('memoryView', 'grid')}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-serif transition cursor-pointer ${
                  currentSettings.memoryView === 'grid'
                    ? 'border-[#c5a872] bg-[#c5a872]/20 text-[#f3ece0] font-bold'
                    : 'border-stone-200 dark:border-[#2a241e] text-stone-600 dark:text-[#a69d8f]'
                }`}
              >
                <LayoutGrid className="w-4 h-4 text-[#c5a872]" />
                <span>Photo Grid</span>
              </button>

              <button
                type="button"
                onClick={() => handleSettingChange('memoryView', 'list')}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-serif transition cursor-pointer ${
                  currentSettings.memoryView === 'list'
                    ? 'border-[#c5a872] bg-[#c5a872]/20 text-[#f3ece0] font-bold'
                    : 'border-stone-200 dark:border-[#2a241e] text-stone-600 dark:text-[#a69d8f]'
                }`}
              >
                <List className="w-4 h-4 text-[#c5a872]" />
                <span>Timeline List</span>
              </button>
            </div>
          </div>

          {/* Default Category */}
          <div>
            <label className="block text-xs font-serif font-bold text-stone-700 dark:text-[#d8c5a4] uppercase tracking-wider mb-2">
              Default Memory Category
            </label>
            <select
              value={currentSettings.defaultCategory || 'Personal'}
              onChange={(e) => handleSettingChange('defaultCategory', e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-serif bg-stone-50 dark:bg-[#1f1b17] border border-stone-200 dark:border-[#383129] rounded-xl text-stone-900 dark:text-[#f3ece0] focus:outline-none focus:ring-2 focus:ring-[#c5a872]/40"
            >
              <option value="Personal">Personal</option>
              <option value="Family">Family</option>
              <option value="Travel">Travel</option>
              <option value="Love">Love & Romance</option>
              <option value="Milestones">Milestones & Goals</option>
            </select>
          </div>
        </div>

        {/* Auto-lock Timer */}
        <div className="pt-3 border-t border-stone-100 dark:border-[#2a241e] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="text-xs font-serif font-bold text-stone-900 dark:text-[#f3ece0] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#c5a872]" />
              <span>Vault Auto-Lock Inactivity Timer</span>
            </span>
            <p className="text-[11px] font-serif text-stone-500 dark:text-[#8a8072]">
              Automatically lock the memory vault after a period of idle inactivity.
            </p>
          </div>

          <select
            value={currentSettings.autoLock || 'never'}
            onChange={(e) => handleSettingChange('autoLock', e.target.value)}
            className="px-3 py-2 text-xs font-serif bg-stone-50 dark:bg-[#1f1b17] border border-stone-200 dark:border-[#383129] rounded-xl text-stone-900 dark:text-[#f3ece0] focus:outline-none focus:ring-2 focus:ring-[#c5a872]/40"
          >
            <option value="never">Never (Stay open)</option>
            <option value="15m">15 minutes</option>
            <option value="30m">30 minutes</option>
            <option value="1h">1 hour</option>
          </select>
        </div>
      </div>

      {/* Explicit Save Action Bar */}
      <div className="p-4 rounded-2xl bg-[#c5a872]/10 border border-[#c5a872]/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-serif text-stone-800 dark:text-[#f3ece0]">
          <Sparkles className="w-4 h-4 text-[#c5a872] flex-shrink-0" />
          <span>All changes above are saved permanently to your account in the cloud.</span>
        </div>
        <button
          type="button"
          onClick={handleExplicitSave}
          disabled={savingSettings}
          className="px-5 py-2.5 bg-[#c5a872] hover:bg-[#d4b983] text-[#141210] font-serif font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          {savingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>Save Preferences</span>
        </button>
      </div>

      {/* 4. Security: Change Password */}
      <div className="bg-white dark:bg-[#141210] p-6 rounded-2xl border border-stone-200 dark:border-[#2a241e] shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-serif font-bold text-stone-900 dark:text-[#f3ece0] flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#c5a872]" />
            <span>Change Account Password</span>
          </h2>
          <p className="text-xs font-serif text-stone-500 dark:text-[#a69d8f] mt-0.5">
            Keep your private vault secure by using a strong, unique password.
          </p>
        </div>

        {passwordError && (
          <div className="flex items-center gap-2 p-3 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900/60">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        {passwordSuccess && (
          <div className="flex items-center gap-2 p-3 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-900/60">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Your password has been changed successfully!</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <label className="block text-xs font-serif font-semibold text-stone-700 dark:text-[#d8c5a4] mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3.5 py-2 text-sm bg-stone-50 dark:bg-[#1f1b17] border border-stone-200 dark:border-[#383129] rounded-xl text-stone-900 dark:text-[#f3ece0] focus:outline-none focus:ring-2 focus:ring-[#c5a872]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-serif font-semibold text-stone-700 dark:text-[#d8c5a4] mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              className="w-full px-3.5 py-2 text-sm bg-stone-50 dark:bg-[#1f1b17] border border-stone-200 dark:border-[#383129] rounded-xl text-stone-900 dark:text-[#f3ece0] focus:outline-none focus:ring-2 focus:ring-[#c5a872]/30"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={passwordLoading}
              className="flex items-center gap-2"
            >
              {passwordLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Update Password</span>
            </Button>
          </div>
        </form>
      </div>

      {/* 5. Data Export */}
      <div className="bg-white dark:bg-[#141210] p-6 rounded-2xl border border-stone-200 dark:border-[#2a241e] shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-serif font-bold text-stone-900 dark:text-[#f3ece0] flex items-center gap-2">
            <Download className="w-4 h-4 text-[#c5a872]" />
            <span>Export Vault Data</span>
          </h2>
          <p className="text-xs font-serif text-stone-500 dark:text-[#a69d8f] mt-0.5">
            Download an offline JSON backup of all your memories, stories, and metadata.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={handleExportData}
          disabled={exporting}
          className="flex items-center gap-2"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-[#c5a872]" />}
          <span>Export All Data</span>
        </Button>
      </div>

      {/* 6. Danger Zone */}
      <div className="bg-rose-50/50 dark:bg-rose-950/20 p-6 rounded-2xl border border-rose-200/80 dark:border-rose-900/60 space-y-4">
        <div>
          <h2 className="text-base font-serif font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>Danger Zone</span>
          </h2>
          <p className="text-xs font-serif text-stone-600 dark:text-rose-300/70 mt-0.5">
            Irreversible actions regarding your account and memories.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 border-t border-rose-200/60 dark:border-rose-900/40">
          <div>
            <h3 className="text-xs font-serif font-bold text-stone-900 dark:text-[#f3ece0]">
              Clear All Vault Memories
            </h3>
            <p className="text-[11px] font-serif text-stone-500 dark:text-[#a69d8f]">
              Permanently delete all memories and photos while keeping your user account active.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowPurgeModal(true)}
            className="px-4 py-2 text-xs font-serif font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition cursor-pointer"
          >
            Delete All Memories
          </button>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showPurgeModal}
        onClose={() => setShowPurgeModal(false)}
        onConfirm={handlePurgeAllMemories}
        title="Permanently Delete All Memories?"
        message="This action will permanently delete every single story, photograph, and milestone from your vault. This action CANNOT be reversed."
        confirmText="Yes, Permanently Purge"
        type="danger"
      />
    </div>
  );
}
