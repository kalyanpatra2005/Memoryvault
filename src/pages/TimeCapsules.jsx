import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { 
  ArrowLeft, Clock, Lock, Unlock, Plus, Calendar, 
  Trash2, Edit3, Share2, Sparkles, Check, AlertCircle, ShieldAlert
} from 'lucide-react';

export default function TimeCapsules() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const screenParam = searchParams.get('screen');
  const [capsules, setCapsules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'create'
  const [selectedCapsule, setSelectedCapsule] = useState(null); // Screen 16 detail view

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [category, setCategory] = useState('Future Self');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadCapsules = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/capsules');
      setCapsules(data);
      if (screenParam === '16' && data.length > 0) {
        setSelectedCapsule(data[0]);
      }
    } catch (err) {
      console.error('Failed to load capsules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCapsules();
  }, []);

  useEffect(() => {
    if (screenParam === '15') {
      setSelectedCapsule(null);
      setActiveTab('list');
    } else if (screenParam === '16' && capsules.length > 0) {
      setSelectedCapsule(capsules[0]);
    }
  }, [screenParam, capsules]);

  // Compute countdown units
  const getCountdownParts = (unlockDateStr) => {
    const diff = new Date(unlockDateStr) - new Date();
    if (diff <= 0) return { years: 0, months: 0, days: 0, hours: 0, isUnlocked: true };

    const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    const years = Math.floor(totalDays / 365);
    const remainingDaysAfterYears = totalDays % 365;
    const months = Math.floor(remainingDaysAfterYears / 30);
    const days = remainingDaysAfterYears % 30;
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return { years, months, days, hours, isUnlocked: false };
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || !unlockDate) {
      setError('Please provide a title, message, and target unlock date.');
      return;
    }

    setCreating(true);
    setError('');
    try {
      await api.post('/capsules', {
        title,
        message,
        unlock_date: unlockDate,
      });

      setSuccess('Capsule sealed into the vault!');
      setTitle('');
      setMessage('');
      setUnlockDate('');
      await loadCapsules();
      setTimeout(() => {
        setSuccess('');
        setActiveTab('list');
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to seal capsule');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to unseal and delete this time capsule?')) return;
    try {
      await api.delete(`/capsules/${id}`);
      setSelectedCapsule(null);
      loadCapsules();
    } catch (err) {
      console.error('Failed to delete capsule:', err);
    }
  };

  // =========================================================================
  // SCREEN 16: TIME CAPSULE DETAIL VIEW (Wax-Sealed Letter & 4-Block Countdown)
  // =========================================================================
  if (selectedCapsule) {
    const countdown = getCountdownParts(selectedCapsule.unlock_date);
    const unlockFormatted = new Date(selectedCapsule.unlock_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <div className="p-4 sm:p-5 animate-fade-in space-y-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setSelectedCapsule(null)}
            className="w-9 h-9 rounded-full bg-[#1e1a15] border border-[#31291e] flex items-center justify-center text-[#cda869] active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-base font-serif font-bold text-[#f4ede2]">
            Time Capsule
          </h2>
          <button
            onClick={() => alert('Sharing sealed capsule token with trusted circle.')}
            className="w-9 h-9 rounded-full bg-[#1e1a15] border border-[#31291e] flex items-center justify-center text-[#baa995] hover:text-[#cda869]"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Wax-Sealed Envelope Image (Extracted from Screen 16) */}
        <div className="w-full h-44 rounded-3xl overflow-hidden border border-[#362b1f] relative shadow-2xl">
          <img
            src="/images/capsule_wax_letter.jpg"
            alt="Wax Sealed Capsule"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-4 flex flex-col justify-end">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#cda869]/20 border border-[#cda869]/40 text-[#f5d99b] text-[10px] font-serif uppercase tracking-wider w-fit mb-1">
              <Lock className="w-3 h-3" />
              <span>{countdown.isUnlocked ? 'UNLOCKED' : 'SEALED VAULT'}</span>
            </span>
            <h3 className="text-lg font-serif font-bold text-[#f7f0e4]">
              {selectedCapsule.title}
            </h3>
            <p className="text-[11px] font-serif text-[#baa995]">
              Locked until: {unlockFormatted}
            </p>
          </div>
        </div>

        {/* 4-Block Countdown Timer (Exact Screen 16 Layout) */}
        <div className="bg-[#191511] border border-[#2d241a] rounded-3xl p-4 shadow-lg">
          <p className="text-[10px] font-serif font-bold uppercase tracking-widest text-[#cda869] text-center mb-3">
            {countdown.isUnlocked ? 'Vault Opened' : 'Time Remaining to Unlock'}
          </p>

          <div className="grid grid-cols-4 gap-2 text-center">
            {/* Years */}
            <div className="bg-[#120f0c] border border-[#2b2217] rounded-2xl p-2.5 flex flex-col items-center">
              <span className="text-xl font-serif font-bold text-[#cda869]">
                {String(countdown.years).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-serif uppercase tracking-wider text-[#8a7a66] mt-0.5">
                Years
              </span>
            </div>

            {/* Months */}
            <div className="bg-[#120f0c] border border-[#2b2217] rounded-2xl p-2.5 flex flex-col items-center">
              <span className="text-xl font-serif font-bold text-[#cda869]">
                {String(countdown.months).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-serif uppercase tracking-wider text-[#8a7a66] mt-0.5">
                Months
              </span>
            </div>

            {/* Days */}
            <div className="bg-[#120f0c] border border-[#2b2217] rounded-2xl p-2.5 flex flex-col items-center">
              <span className="text-xl font-serif font-bold text-[#cda869]">
                {String(countdown.days).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-serif uppercase tracking-wider text-[#8a7a66] mt-0.5">
                Days
              </span>
            </div>

            {/* Hours */}
            <div className="bg-[#120f0c] border border-[#2b2217] rounded-2xl p-2.5 flex flex-col items-center">
              <span className="text-xl font-serif font-bold text-[#cda869]">
                {String(countdown.hours).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-serif uppercase tracking-wider text-[#8a7a66] mt-0.5">
                Hours
              </span>
            </div>
          </div>

          {/* Sealed Progress Bar */}
          <div className="mt-4 pt-3 border-t border-[#261f16]">
            <div className="flex items-center justify-between text-[11px] font-serif text-[#baa995] mb-1.5">
              <span>Sealing Progress</span>
              <span className="text-[#cda869] font-bold">
                {countdown.isUnlocked ? '100% (Complete)' : '32% Sealed'}
              </span>
            </div>
            <div className="w-full h-2 bg-[#120f0c] rounded-full overflow-hidden border border-[#2d241a]">
              <div 
                className="h-full bg-gradient-to-r from-[#8f7446] to-[#cda869] rounded-full transition-all duration-500" 
                style={{ width: countdown.isUnlocked ? '100%' : '32%' }}
              />
            </div>
          </div>
        </div>

        {/* Sealed Content Notice or Unlocked Message */}
        <div className="bg-[#1b1713] border border-[#2d241a] rounded-3xl p-4">
          <h4 className="text-xs font-serif font-bold text-[#f5ede0] mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#cda869]" />
            <span>Capsule Contents</span>
          </h4>
          
          {countdown.isUnlocked ? (
            <div className="mt-2 text-xs font-serif text-[#ded1be] whitespace-pre-wrap leading-relaxed bg-[#120f0c] p-3 rounded-2xl border border-[#2e261d]">
              {selectedCapsule.message}
            </div>
          ) : (
            <div className="text-[11px] font-serif text-[#9e8f7c] leading-relaxed mt-1">
              This capsule is sealed with a digital wax seal. It contains your private letter and memories that cannot be unsealed or read until the countdown finishes on {unlockFormatted}.
            </div>
          )}
        </div>

        {/* Action Buttons (Screen 16 bottom actions) */}
        <div className="flex gap-2.5 pt-2">
          <button
            onClick={() => alert('Capsule lock cannot be modified without cryptographic override.')}
            className="flex-1 py-3 px-4 rounded-2xl border border-[#3d3223] hover:border-[#cda869] text-[#e8ded1] font-serif text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5 bg-[#17130f]"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#cda869]" />
            <span>Edit Capsule</span>
          </button>
          <button
            onClick={() => handleDelete(selectedCapsule.id)}
            className="py-3 px-4 rounded-2xl border border-red-900/40 hover:bg-red-950/30 text-red-400 font-serif text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5 bg-[#17130f]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 15: TIME CAPSULES LIST & CREATE
  // =========================================================================
  return (
    <div className="p-4 sm:p-5 animate-fade-in space-y-4">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => navigate('/dashboard')}
          className="w-9 h-9 rounded-full bg-[#1e1a15] border border-[#31291e] flex items-center justify-center text-[#cda869] active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-base font-serif font-bold text-[#f4ede2]">
          Time Capsule
        </h2>
        <div className="w-9" /> {/* Spacer */}
      </div>

      {/* Segmented Control Tabs (Screen 15) */}
      <div className="flex bg-[#16130f] border border-[#2b2319] p-1 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-2 text-xs font-serif font-semibold rounded-xl transition-all ${
            activeTab === 'list'
              ? 'bg-[#cda869] text-[#14110e] shadow-md'
              : 'text-[#8f7e6b] hover:text-[#e8ded1]'
          }`}
        >
          My Capsules ({capsules.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-2 text-xs font-serif font-semibold rounded-xl transition-all ${
            activeTab === 'create'
              ? 'bg-[#cda869] text-[#14110e] shadow-md'
              : 'text-[#8f7e6b] hover:text-[#e8ded1]'
          }`}
        >
          + Create Capsule
        </button>
      </div>

      {/* TAB 1: CAPSULES LIST (Screen 15 Cards) */}
      {activeTab === 'list' && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-16">
              <span className="text-3xl animate-pulse">⏳</span>
              <p className="text-xs font-serif text-[#baa995] mt-2">Opening temporal archives…</p>
            </div>
          ) : capsules.length === 0 ? (
            <div className="bg-[#1b1713] border border-[#2d241a] rounded-3xl p-8 text-center">
              <span className="text-4xl mb-3 block">🕰️</span>
              <h3 className="text-sm font-serif font-bold text-[#f5ede0] mb-1">
                No Time Capsules Sealed Yet
              </h3>
              <p className="text-[11px] font-serif text-[#9e8f7c] mb-4">
                Leave a message for your future self, choose an unlock date, and seal it with digital wax.
              </p>
              <button
                onClick={() => setActiveTab('create')}
                className="py-2.5 px-5 rounded-2xl bg-[#cda869] hover:bg-[#bfa058] text-[#14110e] font-serif font-bold text-xs shadow-md transition-all active:scale-95"
              >
                + Seal First Capsule
              </button>
            </div>
          ) : (
            capsules.map((c) => {
              const countdown = getCountdownParts(c.unlock_date);
              const createdDate = new Date(c.created_at || Date.now()).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCapsule(c)}
                  className="bg-[#1b1713] border border-[#2d241a] hover:border-[#cda869]/50 rounded-3xl p-4 cursor-pointer transition-all active:scale-[0.99] shadow-md relative overflow-hidden group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Wax/Lock Icon */}
                      <div className="w-10 h-10 rounded-2xl bg-[#cda869]/10 border border-[#cda869]/30 flex items-center justify-center text-[#cda869] shrink-0 mt-0.5">
                        {countdown.isUnlocked ? (
                          <Unlock className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Lock className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-serif font-bold text-[#f5ede0] group-hover:text-[#cda869] transition-colors leading-tight">
                          {c.title}
                        </h4>
                        <p className="text-[10px] font-serif text-[#8f7e6b] mt-0.5">
                          Created {createdDate}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-serif uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#120f0c] border border-[#2f251a] text-[#cda869]">
                      {countdown.isUnlocked ? 'Unlocked' : 'Locked'}
                    </span>
                  </div>

                  {/* Countdown pill banner */}
                  <div className="mt-3 pt-2.5 border-t border-[#261f16] flex items-center justify-between text-[11px] font-serif">
                    <span className="text-[#baa995] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#cda869]" />
                      {countdown.isUnlocked ? (
                        <span className="text-emerald-400 font-bold">Unlocked & Ready to read</span>
                      ) : (
                        <span>
                          Unlock in: <b className="text-[#cda869] font-medium">{countdown.years > 0 ? `${countdown.years}y ` : ''}{countdown.months}m {countdown.days}d</b>
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] font-serif text-[#cda869] group-hover:translate-x-1 transition-transform">
                      View →
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-[#120f0c] rounded-full overflow-hidden mt-2 border border-[#292015]">
                    <div 
                      className="h-full bg-[#cda869] rounded-full" 
                      style={{ width: countdown.isUnlocked ? '100%' : '35%' }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: CREATE CAPSULE (Form with Date Picker) */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-2xl text-xs text-red-300 font-serif flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-2xl text-xs text-emerald-300 font-serif flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Capsule Title */}
          <div>
            <label className="block text-xs font-serif font-medium text-[#cda869] mb-1.5">
              Capsule Title
            </label>
            <input
              type="text"
              placeholder="e.g. Letter to Future Self, Wedding 10th Anniversary"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-[#17130f] border border-[#2f251a] focus:border-[#cda869] rounded-2xl text-xs font-serif text-[#f5ede0] outline-none transition-all placeholder-[#726453]"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-serif font-medium text-[#cda869] mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Future Self', 'Love & Family', 'Life Milestone'].map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-2 text-[10px] font-serif rounded-xl border text-center transition-all ${
                    category === cat
                      ? 'bg-[#cda869]/15 border-[#cda869] text-[#f5d99b] font-bold'
                      : 'bg-[#17130f] border-[#292016] text-[#8a7a67]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Unlock Date */}
          <div>
            <label className="block text-xs font-serif font-medium text-[#cda869] mb-1.5">
              Unlock Date & Time
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={unlockDate}
                onChange={(e) => setUnlockDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-3 bg-[#17130f] border border-[#2f251a] focus:border-[#cda869] rounded-2xl text-xs font-serif text-[#f5ede0] outline-none transition-all"
                required
              />
            </div>
            <p className="text-[10px] font-serif text-[#8f7e6b] mt-1">
              Capsule remains cryptographically sealed until this moment arrives.
            </p>
          </div>

          {/* Message / Letter */}
          <div>
            <label className="block text-xs font-serif font-medium text-[#cda869] mb-1.5">
              Secret Letter / Message
            </label>
            <textarea
              rows={5}
              placeholder="What do you want to tell yourself when this capsule unlocks years from now? Your secrets are safe."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 bg-[#17130f] border border-[#2f251a] focus:border-[#cda869] rounded-2xl text-xs font-serif text-[#f5ede0] outline-none transition-all placeholder-[#726453] resize-none"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={creating}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#cda869] to-[#9c7d48] hover:from-[#d8b577] text-[#14110e] font-serif font-bold text-xs shadow-lg transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>{creating ? 'Sealing into Vault…' : 'Seal Capsule Forever'}</span>
          </button>
        </form>
      )}
    </div>
  );
}
