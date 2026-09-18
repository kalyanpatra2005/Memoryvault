import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { vaultEngine } from '../services/vaultEngine';
import { X, Smartphone, Laptop, Download, Upload, Copy, Check, ShieldCheck, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

export default function SyncModal({ isOpen, onClose, initialTab = 'send', onSyncSuccess }) {
  const { user, token, login } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [syncCode, setSyncCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [statusMsg, setStatusMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleGeneratePackage = async () => {
    setLoading(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const pkg = await vaultEngine.exportVaultPackage(token, user?.id || 'guest');
      const jsonStr = JSON.stringify(pkg);
      const code = btoa(unescape(encodeURIComponent(jsonStr)));
      setSyncCode(code);
      setStatusMsg(`Vault ready! Exported ${pkg.items.length} photo(s)/video(s) and ${pkg.diaries.length} diary entry(ies).`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to generate vault sync package.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const pkg = await vaultEngine.exportVaultPackage(token, user?.id || 'guest');
      const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MemoryVault_Backup_${user?.name?.replace(/\s+/g, '_') || 'Keeper'}_${new Date().toISOString().slice(0,10)}.vault`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMsg('Backup downloaded! Send this file to your laptop (via WhatsApp, Email, Drive, or Bluetooth) and import it.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to download vault file.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!syncCode) return;
    navigator.clipboard.writeText(syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const text = event.target.result;
        const pkg = JSON.parse(text);
        const result = await vaultEngine.importVaultPackage(pkg);
        
        login(result.token, result.user);
        setStatusMsg(`✓ Success! Vault restored on this laptop. Welcome, ${result.user.name}! ${result.itemCount} photos and ${result.diaryCount} diaries imported.`);
        if (onSyncSuccess) onSyncSuccess(result);
        setTimeout(() => {
          onClose();
        }, 1500);
      } catch (err) {
        setErrorMsg('Invalid vault file: ' + (err.message || 'Could not parse data.'));
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleImportCode = async () => {
    if (!inputCode.trim()) {
      setErrorMsg('Please paste the Vault Sync Code from your other device.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const decoded = decodeURIComponent(escape(atob(inputCode.trim())));
      const pkg = JSON.parse(decoded);
      const result = await vaultEngine.importVaultPackage(pkg);

      login(result.token, result.user);
      setStatusMsg(`✓ Success! Welcome, ${result.user.name}! ${result.itemCount} photos/videos and ${result.diaryCount} diaries synchronized.`);
      if (onSyncSuccess) onSyncSuccess(result);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMsg('Invalid Sync Code. Please ensure the full code was copied.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-stone-900 border border-amber-800/40 rounded-2xl shadow-2xl p-6 text-stone-100 my-8">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-100 p-1.5 rounded-lg hover:bg-stone-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-950 border border-amber-500/40 mb-2 shadow-lg">
            <div className="flex items-center space-x-1">
              <Smartphone className="w-4 h-4 text-amber-200" />
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '8s' }} />
              <Laptop className="w-4 h-4 text-amber-200" />
            </div>
          </div>
          <h2 className="text-xl font-bold font-antique text-amber-100">
            Mobile ↔ Laptop Vault Sync
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Safely transfer your photos, diaries, and login account between devices.
          </p>
        </div>

        <div className="flex rounded-lg bg-stone-950 p-1 mb-5 border border-stone-800 text-xs">
          <button
            type="button"
            onClick={() => { setTab('send'); setErrorMsg(null); setStatusMsg(null); }}
            className={`flex-1 py-2 font-medium rounded-md transition-all flex items-center justify-center space-x-1.5 ${
              tab === 'send'
                ? 'bg-amber-900/60 text-amber-200 border border-amber-700/50'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Send from Mobile</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('receive'); setErrorMsg(null); setStatusMsg(null); }}
            className={`flex-1 py-2 font-medium rounded-md transition-all flex items-center justify-center space-x-1.5 ${
              tab === 'receive'
                ? 'bg-amber-900/60 text-amber-200 border border-amber-700/50'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Receive on Laptop</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('lan'); setErrorMsg(null); setStatusMsg(null); }}
            className={`flex-1 py-2 font-medium rounded-md transition-all flex items-center justify-center space-x-1.5 ${
              tab === 'lan'
                ? 'bg-amber-900/60 text-amber-200 border border-amber-700/50'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Direct Wi-Fi</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {statusMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 text-xs flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{statusMsg}</span>
          </div>
        )}

        {tab === 'send' && (
          <div className="space-y-4 text-xs text-stone-300">
            <p className="text-stone-400">
              Run this on the device that contains your memories (e.g. your phone). This bundles your account credentials, uploaded photos, and diary entries into a portable file.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleDownloadFile}
                disabled={loading}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-stone-950 font-bold flex flex-col items-center justify-center space-y-1 hover:brightness-110 shadow-lg border border-amber-400/40 transition"
              >
                <Download className="w-5 h-5 text-stone-950" />
                <span className="text-xs">Download Vault File (.vault)</span>
                <span className="text-[10px] font-normal text-stone-900/80">Best for photos & videos</span>
              </button>

              <button
                onClick={handleGeneratePackage}
                disabled={loading}
                className="py-3 px-4 rounded-xl bg-stone-950 hover:bg-stone-800 text-amber-200 font-semibold flex flex-col items-center justify-center space-y-1 border border-stone-700 transition"
              >
                <Copy className="w-5 h-5 text-amber-400" />
                <span className="text-xs">Generate Text Sync Code</span>
                <span className="text-[10px] font-normal text-stone-400">Copy & paste code</span>
              </button>
            </div>

            {syncCode && (
              <div className="mt-3 p-3 bg-stone-950 rounded-xl border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-300">Your Vault Sync Code:</span>
                  <button
                    onClick={handleCopyCode}
                    className="px-2.5 py-1 bg-amber-900/40 hover:bg-amber-800/60 border border-amber-700/50 rounded text-amber-200 text-xs flex items-center space-x-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  value={syncCode}
                  rows={3}
                  className="w-full p-2 bg-stone-900 rounded border border-stone-800 text-[10px] font-mono text-stone-400 focus:outline-none select-all"
                />
                <p className="text-[10px] text-stone-400 italic">
                  Tip: Copy this code and paste it on your laptop under "Receive on Laptop".
                </p>
              </div>
            )}
          </div>
        )}

        {tab === 'receive' && (
          <div className="space-y-4 text-xs text-stone-300">
            <p className="text-stone-400">
              Run this on the new device (e.g. your laptop). Choose either method below to instantly unlock your account and load all your photos.
            </p>

            <div className="p-4 bg-stone-950 rounded-xl border border-amber-900/30 text-center space-y-2">
              <Upload className="w-6 h-6 text-amber-400 mx-auto" />
              <div className="font-semibold text-stone-200">Method 1: Load Vault Backup File</div>
              <p className="text-[11px] text-stone-400">
                Select the <code className="text-amber-300">.vault</code> file downloaded from your mobile phone.
              </p>
              <label className="inline-block mt-2 px-4 py-2 rounded-lg bg-amber-900/40 hover:bg-amber-800/60 border border-amber-700/50 text-amber-200 font-semibold cursor-pointer transition">
                <span>Browse .vault File</span>
                <input
                  type="file"
                  accept=".vault,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="p-4 bg-stone-950 rounded-xl border border-stone-800 space-y-2">
              <div className="font-semibold text-stone-200">Method 2: Paste Sync Code</div>
              <textarea
                placeholder="Paste the Vault Sync Code generated on your mobile phone..."
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                rows={3}
                className="w-full p-2.5 bg-stone-900 rounded-lg border border-stone-700 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500 font-mono"
              />
              <button
                onClick={handleImportCode}
                disabled={loading || !inputCode.trim()}
                className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold text-xs shadow-md border border-amber-400/40 disabled:opacity-50 transition"
              >
                {loading ? 'Restoring Vault...' : 'Import & Open Vault on Laptop'}
              </button>
            </div>
          </div>
        )}

        {tab === 'lan' && (
          <div className="space-y-3.5 text-xs text-stone-300">
            <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-800/40 space-y-2">
              <div className="flex items-center space-x-2 text-amber-300 font-semibold">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Local Server Direct Link (No Cloud Needed)</span>
              </div>
              <p className="text-[11px] text-stone-300">
                If your laptop is running <code className="bg-stone-900 px-1 py-0.5 rounded text-amber-200">start.bat</code>:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-stone-400">
                <li>Make sure both mobile and laptop are on the same Wi-Fi.</li>
                <li>Find your laptop's local IP address (e.g. in Command Prompt run <code className="text-stone-300 font-mono">ipconfig</code>, usually <code className="text-amber-300 font-mono">192.168.1.X</code>).</li>
                <li>On your mobile phone browser, open: <code className="text-amber-200 font-mono">http://&lt;your-laptop-ip&gt;:5173</code></li>
                <li>Any photo you upload on your phone will immediately be saved directly into your laptop's server hard drive!</li>
              </ol>
            </div>
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-500">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 inline" />
            <span>Strict End-to-End Privacy</span>
          </span>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-amber-300 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
