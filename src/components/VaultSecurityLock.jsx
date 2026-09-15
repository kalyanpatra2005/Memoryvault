import { useState } from 'react';
import api from '../api';
import useAuthStore from '../store/authStore';
import { Lock, KeyRound, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

export default function VaultSecurityLock() {
  const { user, isVaultLocked, unlockVault, updateUser } = useAuthStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  // If vault is not in locked state, don't show overlay
  if (!isVaultLocked) return null;

  const handleDigitClick = (num) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleUnlock = async (e) => {
    if (e) e.preventDefault();
    if (!pin) return setError('Please enter your Vault PIN');

    setVerifying(true);
    setError('');
    try {
      if (user?.hasVaultPin) {
        // Verify with server
        await api.post('/auth/vault-pin/verify', { pin });
        unlockVault();
      } else {
        // If user hasn't set a pin yet, let them set it now or unlock
        await api.post('/auth/vault-pin/set', { pin });
        updateUser({ hasVaultPin: true });
        unlockVault();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid Security PIN. Access denied.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-fade-in">
      <div className="w-full max-w-sm bg-vault-surface border border-violet-500/30 rounded-3xl p-8 shadow-2xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-800 text-white flex items-center justify-center text-3xl mx-auto mb-4 shadow-xl shadow-violet-900/50 border border-violet-400/30">
          🔒
        </div>

        <h2 className="text-xl font-bold text-white mb-1">Vault High-Security Lockdown</h2>
        <p className="text-slate-400 text-xs mb-6">
          {user?.hasVaultPin
            ? 'Enter your confidential Vault Security PIN to decrypt session'
            : 'Create a 4 to 6 digit Master PIN to secure your vault'}
        </p>

        {/* PIN indicator circles */}
        <div className="flex justify-center gap-3 mb-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border transition-all ${
                pin.length > i
                  ? 'bg-violet-400 border-violet-400 scale-110 shadow-md shadow-violet-500/50'
                  : 'bg-white/5 border-white/20'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="text-rose-400 text-xs mb-4 flex items-center justify-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigitClick(num.toString())}
              className="w-16 h-16 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-violet-600 border border-white/10 text-white font-mono text-xl font-bold transition-all shadow-sm flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleBackspace}
            className="w-16 h-16 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 text-sm font-semibold transition-all flex items-center justify-center"
          >
            Del
          </button>
          <button
            type="button"
            onClick={() => handleDigitClick('0')}
            className="w-16 h-16 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xl font-bold transition-all flex items-center justify-center"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleUnlock}
            disabled={verifying || pin.length < 4}
            className="w-16 h-16 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 border border-violet-400 text-white text-sm font-bold transition-all flex items-center justify-center shadow-lg shadow-violet-900/40"
          >
            {verifying ? '…' : 'OK'}
          </button>
        </div>

        <p className="text-[11px] text-slate-500">
          High-Security Isolation • End-to-End Private Session
        </p>
      </div>
    </div>
  );
}
