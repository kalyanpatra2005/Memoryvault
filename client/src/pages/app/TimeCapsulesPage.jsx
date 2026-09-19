import React, { useState, useEffect } from 'react';
import { memoryService } from '../../services/memoryService';
import { 
  Hourglass, Lock, Unlock, Plus, Calendar, 
  Trash2, Sparkles, MessageSquare, Image as ImageIcon, X 
} from 'lucide-react';
import Button from '../../components/ui/Button';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';

export default function TimeCapsulesPage({ onOpenCreateCapsule }) {
  const [capsules, setCapsules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCapsule, setSelectedCapsule] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    loadCapsules();
  }, []);

  const loadCapsules = async () => {
    setLoading(true);
    try {
      const data = await memoryService.getTimeCapsules();
      setCapsules(data);
    } catch (err) {
      console.error('Failed to load time capsules', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await memoryService.deleteTimeCapsule(deleteConfirmId);
      setDeleteConfirmId(null);
      if (selectedCapsule?.id === deleteConfirmId) setSelectedCapsule(null);
      loadCapsules();
    } catch (err) {
      console.error('Failed to delete capsule', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              Time Capsules
            </h1>
            <Hourglass className="w-5 h-5 text-amber-700 dark:text-amber-400" />
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-serif italic">
            Messages and moments sealed away until the future arrives.
          </p>
        </div>

        <Button 
          onClick={onOpenCreateCapsule}
          className="bg-amber-800 hover:bg-amber-900 text-white flex items-center gap-1.5 text-xs font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Seal New Capsule</span>
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-44 bg-stone-200/50 dark:bg-stone-800/50 rounded-2xl animate-pulse" />
          <div className="h-44 bg-stone-200/50 dark:bg-stone-800/50 rounded-2xl animate-pulse" />
        </div>
      ) : capsules.length === 0 ? (
        <div className="paper-card p-12 text-center border-dashed border-2 border-stone-300 dark:border-stone-700">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 flex items-center justify-center mb-3">
            <Hourglass className="w-7 h-7" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
            No active time capsules
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
            Seal a future promise, next year's birthday, graduation goal, or a letter to your future self.
          </p>
          <button
            onClick={onOpenCreateCapsule}
            className="mt-5 px-4 py-2.5 rounded-xl bg-amber-800 text-white text-xs font-semibold shadow hover:brightness-110 transition"
          >
            Create Your First Capsule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {capsules.map((capsule) => (
            <CapsuleCard
              key={capsule.id}
              capsule={capsule}
              onClick={() => setSelectedCapsule(capsule)}
              onDelete={() => setDeleteConfirmId(capsule.id)}
            />
          ))}
        </div>
      )}

      {/* Capsule Details / Reveal Modal */}
      {selectedCapsule && (
        <CapsuleDetailModal
          capsule={selectedCapsule}
          onClose={() => setSelectedCapsule(null)}
          onDelete={() => setDeleteConfirmId(selectedCapsule.id)}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Delete this Time Capsule?"
        message="This will permanently delete this time capsule, its future countdown, and any attached photos or messages."
        confirmText="Delete Capsule"
        type="danger"
      />
    </div>
  );
}

function CapsuleCard({ capsule, onClick, onDelete }) {
  const [timeLeft, setTimeLeft] = useState(() => calculateDiff(capsule.target_date));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateDiff(capsule.target_date));
    }, 1000);
    return () => clearInterval(timer);
  }, [capsule.target_date]);

  const isUnlocked = timeLeft.total <= 0;

  return (
    <div 
      onClick={onClick}
      className={`rounded-2xl p-5 border transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden ${
        isUnlocked 
          ? 'bg-gradient-to-tr from-amber-50 to-emerald-50 dark:from-stone-900 dark:to-emerald-950/40 border-emerald-300 dark:border-emerald-800' 
          : 'bg-paper-50 dark:bg-stone-900 border-stone-200/90 dark:border-stone-800 hover:border-amber-400/60'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
          isUnlocked 
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
            : 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
        }`}>
          {isUnlocked ? <Unlock className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-amber-600" />}
          <span>{isUnlocked ? 'Unlocked' : 'Sealed Capsule'}</span>
        </span>

        <span className="text-[11px] text-stone-400 font-serif">
          {new Date(capsule.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition truncate">
        {capsule.title}
      </h3>

      {isUnlocked ? (
        <div className="mt-4 p-3 bg-white/70 dark:bg-stone-800/70 rounded-xl border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>The date has arrived! Click to open message.</span>
        </div>
      ) : (
        /* Real-Time Countdown Box */
        <div className="mt-4 grid grid-cols-4 gap-1.5 text-center">
          <div className="p-2 bg-stone-100 dark:bg-stone-800/80 rounded-xl">
            <span className="font-mono text-base sm:text-lg font-bold text-stone-800 dark:text-stone-200 block leading-tight">
              {timeLeft.days}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-stone-400">Days</span>
          </div>
          <div className="p-2 bg-stone-100 dark:bg-stone-800/80 rounded-xl">
            <span className="font-mono text-base sm:text-lg font-bold text-stone-800 dark:text-stone-200 block leading-tight">
              {timeLeft.hours}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-stone-400">Hours</span>
          </div>
          <div className="p-2 bg-stone-100 dark:bg-stone-800/80 rounded-xl">
            <span className="font-mono text-base sm:text-lg font-bold text-stone-800 dark:text-stone-200 block leading-tight">
              {timeLeft.minutes}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-stone-400">Mins</span>
          </div>
          <div className="p-2 bg-stone-100 dark:bg-stone-800/80 rounded-xl">
            <span className="font-mono text-base sm:text-lg font-bold text-amber-700 dark:text-amber-400 block leading-tight">
              {timeLeft.seconds}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-stone-400">Secs</span>
          </div>
        </div>
      )}
    </div>
  );
}

function CapsuleDetailModal({ capsule, onClose, onDelete }) {
  const isUnlocked = new Date(capsule.target_date).getTime() <= Date.now();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-paper-50 dark:bg-paper-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-6 pb-4 border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hourglass className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
              {capsule.title}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onDelete}
              className="p-1.5 text-stone-400 hover:text-rose-500 rounded-lg transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {capsule.imageUrl && (
          <div className="max-h-56 overflow-hidden bg-stone-100 dark:bg-stone-950 flex items-center justify-center border-b border-stone-200 dark:border-stone-800">
            <img src={capsule.imageUrl} alt={capsule.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-stone-500 font-serif">
            <span>Destination: {new Date(capsule.target_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span className={isUnlocked ? 'text-emerald-600 font-semibold' : 'text-amber-700 font-semibold'}>
              {isUnlocked ? '🎉 Time Reached' : '⏳ Sealed in Time'}
            </span>
          </div>

          {isUnlocked ? (
            <div className="p-4 bg-white dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-2">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider font-sans">
                Saved Message
              </span>
              <p className="font-serif text-sm text-stone-800 dark:text-stone-200 whitespace-pre-wrap leading-relaxed">
                {capsule.message || 'No message recorded for this capsule.'}
              </p>
            </div>
          ) : (
            <div className="p-6 text-center bg-stone-100/60 dark:bg-stone-800/40 rounded-2xl border border-stone-200/80 dark:border-stone-800 space-y-2">
              <Lock className="w-8 h-8 mx-auto text-amber-700/60 dark:text-amber-400/60" />
              <h4 className="font-serif text-sm font-semibold text-stone-900 dark:text-stone-100">
                This capsule is sealed until {new Date(capsule.target_date).toLocaleDateString()}
              </h4>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                The stored message and contents will be unlocked automatically on the destination day.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 bg-paper-100/80 dark:bg-stone-950/60 border-t border-stone-200/80 dark:border-stone-800 text-right">
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

function calculateDiff(targetDate) {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) {
    return { total: 0, days: '00', hours: '00', minutes: '00', seconds: '00' };
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return {
    total: diff,
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  };
}
