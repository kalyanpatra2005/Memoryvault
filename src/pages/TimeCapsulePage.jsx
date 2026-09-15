import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { safeFetchJson } from '../services/vaultEngine';
import { 
  Clock, Lock, Unlock, KeyRound, Sparkles, Calendar, Trash2, 
  Send, AlertCircle, CheckCircle, Hourglass 
} from 'lucide-react';

export default function TimeCapsulePage() {
  const { authFetch } = useAuth();
  const [capsules, setCapsules] = useState([]);
  const [loading, setLoading] = useState(true);

  // New capsule form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Active unsealed modal
  const [openedCapsule, setOpenedCapsule] = useState(null);

  // Live timer tick for countdowns
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    fetchCapsules();
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchCapsules = async () => {
    try {
      let serverCapsules = [];
      try {
        const res = await authFetch('/api/capsules');
        const data = await safeFetchJson(res);
        if (res.ok && data && data.capsules) {
          serverCapsules = data.capsules;
        }
      } catch (e) {}

      let localCapsules = [];
      try {
        const raw = localStorage.getItem('vault_storage_capsules');
        if (raw) localCapsules = JSON.parse(raw);
      } catch (e) {}

      const map = new Map();
      serverCapsules.forEach(c => map.set(String(c.id), c));
      localCapsules.forEach(c => {
        if (!map.has(String(c.id))) map.set(String(c.id), c);
      });

      setCapsules(Array.from(map.values()));
    } catch (err) {
      console.error('Failed to load capsules', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCapsule = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const targetDate = new Date(unlockDate);
    if (isNaN(targetDate.getTime()) || targetDate <= new Date()) {
      setErrorMsg('Please select a valid future date and time for the unlock.');
      return;
    }

    setCreating(true);
    let newCapsule = null;
    try {
      const res = await authFetch('/api/capsules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          message,
          unlock_date: targetDate.toISOString()
        })
      });

      const data = await safeFetchJson(res);
      if (res.ok && data && data.capsule) {
        newCapsule = data.capsule;
      }
    } catch (err) {}

    if (!newCapsule) {
      newCapsule = {
        id: Date.now(),
        title: title.trim(),
        message,
        unlock_date: targetDate.toISOString(),
        is_opened: 0,
        created_at: new Date().toISOString()
      };
      try {
        const raw = localStorage.getItem('vault_storage_capsules');
        const list = raw ? JSON.parse(raw) : [];
        list.unshift(newCapsule);
        localStorage.setItem('vault_storage_capsules', JSON.stringify(list));
      } catch (e) {}
    }

    setCapsules([newCapsule, ...capsules]);
    setTitle('');
    setMessage('');
    setUnlockDate('');
    setSuccessMsg('Your capsule has been sealed into the fabric of time.');
    setTimeout(() => setSuccessMsg(''), 4000);
    setCreating(false);
  };

  const handleOpenCapsule = async (id) => {
    try {
      let opened = null;
      try {
        const res = await authFetch(`/api/capsules/${id}/open`, { method: 'PUT' });
        const data = await safeFetchJson(res);
        if (res.ok && data && data.capsule) {
          opened = data.capsule;
        }
      } catch (e) {}

      if (!opened) {
        const found = capsules.find(c => String(c.id) === String(id));
        if (found) opened = { ...found, is_opened: 1 };
      }

      if (opened) {
        setCapsules(capsules.map(c => String(c.id) === String(id) ? opened : c));
        setOpenedCapsule(opened);
      }
    } catch (err) {
      console.error('Failed to open capsule', err);
    }
  };

  const handleDeleteCapsule = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Erase this time capsule from existence? This cannot be undone.')) {
      return;
    }

    try {
      await authFetch(`/api/capsules/${id}`, { method: 'DELETE' });
    } catch (err) {}

    try {
      const raw = localStorage.getItem('vault_storage_capsules');
      if (raw) {
        const list = JSON.parse(raw).filter(c => String(c.id) !== String(id));
        localStorage.setItem('vault_storage_capsules', JSON.stringify(list));
      }
    } catch (e) {}

    setCapsules(capsules.filter(c => String(c.id) !== String(id)));
    if (openedCapsule?.id === id) setOpenedCapsule(null);
  };

  const calculateCountdown = (targetDateStr) => {
    const diff = new Date(targetDateStr).getTime() - currentTime;
    if (diff <= 0) return { isReady: true, text: 'Ready to Unseal' };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return {
      isReady: false,
      days,
      hours,
      minutes,
      seconds,
      text: `${days}d ${hours}h ${minutes}m ${seconds}s`
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-950/70 border border-amber-800/40 text-amber-300 text-xs font-mono mb-3">
          <Hourglass className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>TIME LOCK MECHANISM</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-antique text-stone-100">
          Digital Time Capsules
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-stone-400 font-serif">
          Seal a message, prediction, or memories to be opened at a specific hour in the future. Once sealed, its content remains locked until the date arrives.
        </p>
      </div>

      {/* SEAL A NEW TIME CAPSULE FORM */}
      <div className="max-w-2xl mx-auto mb-14 p-6 sm:p-8 rounded-3xl bg-stone-900 border border-amber-900/40 shadow-2xl relative overflow-hidden">
        <div className="flex items-center space-x-3 mb-6 border-b border-stone-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-700/50 flex items-center justify-center text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-antique text-amber-100">Forge a Sealed Capsule</h2>
            <p className="text-xs text-stone-400">Cast words forward through the passage of time.</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleCreateCapsule} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Capsule Title / Dedication
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Letter to Myself on My 30th Birthday, or Thoughts on This Silent Night"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Future Unlock Date & Time
            </label>
            <input
              type="datetime-local"
              required
              value={unlockDate}
              onChange={(e) => setUnlockDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-stone-200 focus:outline-none focus:border-amber-500 [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Secret Message / Letter for the Future
            </label>
            <textarea
              rows={5}
              required
              placeholder="Write what you want your future self to remember. Where you are right now, what you fear, who you love, or the quiet hope you hold..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 bg-stone-950 border border-stone-800 rounded-xl text-sm text-stone-200 font-serif leading-relaxed placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-500 text-stone-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-950 transition border border-amber-400/40 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            <span>{creating ? 'Engraving Seal...' : 'Seal Capsule Until Future Date'}</span>
          </button>
        </form>
      </div>

      {/* CAPSULES LIST */}
      <div>
        <h2 className="text-2xl font-bold font-antique text-stone-200 mb-6 flex items-center space-x-2">
          <Clock className="w-5 h-5 text-amber-400" />
          <span>Your Vaulted Time Capsules</span>
        </h2>

        {loading ? (
          <div className="text-center py-12 text-stone-500 text-sm">
            Scanning time continuum...
          </div>
        ) : capsules.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-stone-900/30 border border-stone-800 text-stone-400">
            <Hourglass className="w-10 h-10 text-stone-600 mx-auto mb-3" />
            <h3 className="text-base font-antique font-bold text-stone-300">No capsules sealed yet</h3>
            <p className="text-xs text-stone-500 mt-1 font-serif">
              Craft your first time capsule above to send a secret letter to the days ahead.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capsules.map((capsule) => {
              const cd = calculateCountdown(capsule.unlock_date);
              const isReady = cd.isReady;
              const isOpened = Boolean(capsule.is_opened);

              return (
                <div
                  key={capsule.id}
                  className={`relative p-6 rounded-2xl border transition-all duration-300 shadow-xl flex flex-col justify-between ${
                    isOpened
                      ? 'bg-stone-900/90 border-amber-800/40 hover:border-amber-600/60'
                      : isReady
                      ? 'bg-gradient-to-b from-amber-950/40 to-stone-900 border-amber-500/80 shadow-amber-950/30 animate-pulse'
                      : 'bg-stone-900/80 border-stone-800 hover:border-amber-900/40'
                  }`}
                >
                  <div>
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-4">
                      {isOpened ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase bg-stone-950 text-amber-300 border border-stone-800 flex items-center space-x-1">
                          <Unlock className="w-3 h-3 text-emerald-400" />
                          <span>Unsealed Archive</span>
                        </span>
                      ) : isReady ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase bg-amber-900 text-amber-100 border border-amber-500 flex items-center space-x-1">
                          <Sparkles className="w-3 h-3 text-amber-200" />
                          <span>Ready to Open!</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase bg-stone-950 text-stone-400 border border-stone-800 flex items-center space-x-1">
                          <Lock className="w-3 h-3 text-amber-500" />
                          <span>Time Locked</span>
                        </span>
                      )}

                      <button
                        onClick={(e) => handleDeleteCapsule(capsule.id, e)}
                        title="Delete Capsule"
                        className="text-stone-500 hover:text-rose-400 p-1 rounded hover:bg-stone-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3 className="text-xl font-bold font-antique text-stone-100 mb-2">
                      {capsule.title}
                    </h3>

                    {/* Countdown or Status Display */}
                    {!isOpened && !isReady ? (
                      <div className="my-4 p-4 rounded-xl bg-stone-950 border border-stone-800/80 text-center">
                        <span className="text-[10px] uppercase tracking-wider text-amber-400 font-mono block mb-1">
                          Time Remaining
                        </span>
                        <div className="grid grid-cols-4 gap-2 text-stone-200 font-mono text-center">
                          <div className="bg-stone-900 p-1.5 rounded">
                            <span className="text-lg font-bold text-amber-200">{cd.days}</span>
                            <span className="block text-[9px] text-stone-400">DAYS</span>
                          </div>
                          <div className="bg-stone-900 p-1.5 rounded">
                            <span className="text-lg font-bold text-amber-200">{cd.hours}</span>
                            <span className="block text-[9px] text-stone-400">HRS</span>
                          </div>
                          <div className="bg-stone-900 p-1.5 rounded">
                            <span className="text-lg font-bold text-amber-200">{cd.minutes}</span>
                            <span className="block text-[9px] text-stone-400">MIN</span>
                          </div>
                          <div className="bg-stone-900 p-1.5 rounded">
                            <span className="text-lg font-bold text-amber-200">{cd.seconds}</span>
                            <span className="block text-[9px] text-stone-400">SEC</span>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Content Preview */}
                    <div className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800/60 text-xs font-serif italic text-stone-400 mb-4 line-clamp-3">
                      {capsule.message}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-stone-400">
                      Unlocks: {new Date(capsule.unlock_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </span>

                    {isOpened ? (
                      <button
                        onClick={() => setOpenedCapsule(capsule)}
                        className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-200 text-xs font-serif font-bold transition"
                      >
                        Read Letter
                      </button>
                    ) : isReady ? (
                      <button
                        onClick={() => handleOpenCapsule(capsule.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 text-xs font-bold shadow-md shadow-amber-950 flex items-center space-x-1.5 transition"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Break Seal!</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-amber-500/80 font-mono">
                        Guarded
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* UNSEALED READING MODAL */}
      {openedCapsule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="parchment-texture relative w-full max-w-xl rounded-2xl border-4 border-amber-900/80 p-8 sm:p-10 text-stone-950 shadow-2xl">
            <button
              onClick={() => setOpenedCapsule(null)}
              className="absolute top-4 right-4 text-amber-950/70 hover:text-amber-950 p-2 rounded-full hover:bg-amber-900/10 transition"
            >
              ✕
            </button>

            <div className="text-center mb-6 border-b border-amber-900/30 pb-4">
              <div className="inline-block p-2 rounded-full bg-red-950/20 text-red-900 mb-2">
                <Unlock className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-antique font-bold text-amber-950">
                {openedCapsule.title}
              </h2>
              <p className="text-xs font-serif italic text-amber-950/70 mt-1">
                Sealed into the past • Unlocked on {new Date(openedCapsule.unlock_date).toLocaleDateString(undefined, { dateStyle: 'full' })}
              </p>
            </div>

            <div className="text-base font-serif text-amber-950 leading-relaxed whitespace-pre-wrap selection:bg-amber-300">
              {openedCapsule.message}
            </div>

            <div className="mt-8 pt-4 border-t border-amber-900/30 flex items-center justify-between text-xs font-serif text-amber-950/80">
              <span>Time Capsule Archive</span>
              <button
                onClick={() => setOpenedCapsule(null)}
                className="px-4 py-2 bg-amber-950 text-amber-100 rounded-lg font-antique font-bold"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
