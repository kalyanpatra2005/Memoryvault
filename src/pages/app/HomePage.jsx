import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { memoryService } from '../../services/memoryService';
import { 
  BookOpen, Plus, Heart, MapPin, Calendar, 
  Hourglass, ArrowRight, Sparkles, Clock, ChevronRight
} from 'lucide-react';
import MemoryCard from '../../components/MemoryCard';
import Skeleton from '../../components/ui/Skeleton';

export default function HomePage({ 
  onNavigate, 
  onOpenAddModal, 
  onOpenActionSheet,
  onSelectMemory,
  onOpenDiary 
}) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todayDiary, setTodayDiary] = useState(null);
  const [recentMemories, setRecentMemories] = useState([]);
  const [nextCapsule, setNextCapsule] = useState(null);
  const [timelineSnippet, setTimelineSnippet] = useState([]);

  const todayDateStr = new Date().toISOString().split('T')[0];
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const dayNumber = new Date().getDate();
  const monthName = new Date().toLocaleDateString('en-US', { month: 'long' });
  const yearNumber = new Date().getFullYear();

  const firstName = (profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Friend').split(' ')[0];

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    setLoading(true);
    try {
      const [diaries, memories, capsules, timeline] = await Promise.all([
        memoryService.getDiaryEntries(),
        memoryService.getMemories(),
        memoryService.getTimeCapsules(),
        memoryService.getUnifiedTimeline()
      ]);

      // Check if today has an entry
      const entryForToday = diaries.find(d => (d.entry_date || '').startsWith(todayDateStr));
      setTodayDiary(entryForToday || null);

      setRecentMemories(memories.slice(0, 4));

      // Find next pending capsule (locked with future target_date)
      const now = Date.now();
      const futureCapsules = capsules.filter(c => new Date(c.target_date).getTime() > now);
      setNextCapsule(futureCapsules[0] || capsules[0] || null);

      setTimelineSnippet(timeline.slice(0, 3));
    } catch (err) {
      console.error('Failed to load home data', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
      {/* 1. TOP GREETING & DATE (Personal Memory Book feel) */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => onNavigate?.('/profile')}
            className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-700 to-amber-500 text-white font-serif font-bold text-lg flex items-center justify-center shadow cursor-pointer border-2 border-paper-100 dark:border-paper-900"
          >
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="text-[11px] font-sans font-semibold tracking-wider uppercase text-amber-800 dark:text-amber-400">
              {dayName}
            </span>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 leading-tight">
              Hello, {firstName}
            </h1>
          </div>
        </div>

        {/* Big Visual Date Badge */}
        <div className="text-right flex items-center gap-2.5 bg-paper-50 dark:bg-stone-900 px-3.5 py-1.5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <span className="font-serif text-3xl font-extrabold text-amber-800 dark:text-amber-400 leading-none">
            {dayNumber}
          </span>
          <div className="text-left text-[11px] font-sans leading-tight text-stone-500 dark:text-stone-400 font-medium">
            <div>{monthName}</div>
            <div>{yearNumber}</div>
          </div>
        </div>
      </div>

      {/* 2. TODAY: DIGITAL DIARY SECTION */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
              Today
            </span>
            <span className="h-1 w-1 rounded-full bg-amber-600" />
            <span className="text-xs text-stone-500 font-serif italic">Your daily page</span>
          </div>
          <button 
            onClick={() => onNavigate?.('/diary')}
            className="text-xs text-stone-500 hover:text-amber-800 dark:hover:text-amber-400 transition font-medium"
          >
            Diary archive &rarr;
          </button>
        </div>

        {todayDiary ? (
          /* Today has an entry already */
          <div 
            onClick={() => onNavigate?.('/diary')}
            className="paper-card notebook-ruled p-5 sm:p-6 cursor-pointer group hover:border-amber-400/50"
          >
            <div className="flex items-center justify-between text-xs text-stone-500 mb-2 font-serif">
              <span className="italic">Dear Diary,</span>
              <span className="font-sans text-[11px] text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                Written Today
              </span>
            </div>

            {todayDiary.title && (
              <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 mb-1">
                {todayDiary.title}
              </h3>
            )}

            <p className="font-serif text-sm text-stone-700 dark:text-stone-300 line-clamp-3 leading-relaxed">
              {todayDiary.content}
            </p>

            {todayDiary.media && todayDiary.media.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {todayDiary.media.map((m, idx) => (
                  <img 
                    key={idx} 
                    src={m.url} 
                    alt="Diary media" 
                    className="w-16 h-16 rounded-xl object-cover border border-stone-200 dark:border-stone-700 flex-shrink-0"
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Today is waiting to be written */
          <div 
            onClick={() => onNavigate?.('/diary')}
            className="paper-card notebook-ruled p-6 cursor-pointer group hover:border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <span className="font-serif italic text-xs text-stone-500">
                {dayName}, {dayNumber} {monthName}
              </span>
              <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition">
                Today is waiting to be written.
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Save a thought, a feeling, or what happened today in your memory book.
              </p>
            </div>

            <button 
              type="button"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-800 dark:bg-amber-600 text-white font-medium text-xs shadow-sm hover:brightness-110 active:scale-95 transition self-start sm:self-auto flex-shrink-0"
            >
              <BookOpen className="w-4 h-4" />
              <span>Write Today</span>
            </button>
          </div>
        )}
      </section>

      {/* 3. RECENT: LARGE MEMORY CARDS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
              Recent Moments
            </span>
            <span className="h-1 w-1 rounded-full bg-amber-600" />
            <span className="text-xs text-stone-500 font-serif italic">Photos & stories</span>
          </div>
          <button 
            onClick={() => onNavigate?.('/memories')}
            className="text-xs text-stone-500 hover:text-amber-800 dark:hover:text-amber-400 transition font-medium"
          >
            All memories ({recentMemories.length}) &rarr;
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton variant="card" className="h-64" />
            <Skeleton variant="card" className="h-64" />
          </div>
        ) : recentMemories.length === 0 ? (
          <div 
            onClick={() => onOpenAddModal?.()}
            className="paper-card p-8 text-center border-dashed border-2 border-stone-300 dark:border-stone-700 cursor-pointer hover:border-amber-500/60 transition group"
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h3 className="font-serif text-base font-semibold text-stone-900 dark:text-stone-100">
              Your memory album is empty
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
              Add your favorite photographs, travels, and milestone memories to fill your digital album.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentMemories.map(m => (
              <MemoryCard 
                key={m.id}
                memory={m}
                onClick={() => onSelectMemory?.(m)}
                onFavoriteToggle={async () => {
                  await memoryService.toggleFavorite(m.id, !m.is_favorite);
                  loadHomeData();
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. NEXT: TIME CAPSULE COUNTDOWN */}
      {nextCapsule && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Next Milestone
              </span>
              <span className="h-1 w-1 rounded-full bg-emerald-600" />
              <span className="text-xs text-stone-500 font-serif italic">Time Capsule</span>
            </div>
            <button 
              onClick={() => onNavigate?.('/capsules')}
              className="text-xs text-stone-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition font-medium"
            >
              All capsules &rarr;
            </button>
          </div>

          <CapsuleCountdownCard 
            capsule={nextCapsule}
            onClick={() => onNavigate?.('/capsules')}
          />
        </section>
      )}

      {/* 5. TIMELINE SNIPPET */}
      {timelineSnippet.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                Life Timeline
              </span>
              <span className="h-1 w-1 rounded-full bg-stone-400" />
              <span className="text-xs text-stone-500 font-serif italic">Recent moments</span>
            </div>
            <button 
              onClick={() => onNavigate?.('/timeline')}
              className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition font-medium"
            >
              Open timeline &rarr;
            </button>
          </div>

          <div className="paper-card p-4 sm:p-5 divide-y divide-stone-100 dark:divide-stone-800">
            {timelineSnippet.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => {
                  if (item.timelineType === 'diary') onNavigate?.('/diary');
                  else if (item.timelineType === 'capsule') onNavigate?.('/capsules');
                  else onSelectMemory?.(item);
                }}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 cursor-pointer hover:bg-stone-50/60 dark:hover:bg-stone-800/40 rounded-xl px-2 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-paper-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center text-xs flex-shrink-0">
                    {item.timelineType === 'diary' && <BookOpen className="w-4 h-4 text-amber-700 dark:text-amber-400" />}
                    {item.timelineType === 'memory' && <Heart className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                    {item.timelineType === 'capsule' && <Hourglass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                      {item.title || 'Untitled note'}
                    </p>
                    <p className="text-[11px] text-stone-400">
                      {new Date(item.timelineDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// Live Countdown Card for Time Capsule
function CapsuleCountdownCard({ capsule, onClick }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(capsule.target_date));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(capsule.target_date));
    }, 1000);
    return () => clearInterval(timer);
  }, [capsule.target_date]);

  const isReached = timeLeft.total <= 0;

  return (
    <div 
      onClick={onClick}
      className="relative rounded-2xl bg-gradient-to-tr from-stone-900 via-stone-800 to-indigo-950 text-white p-5 sm:p-6 shadow-md cursor-pointer hover:shadow-lg transition group overflow-hidden border border-amber-500/20"
    >
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold tracking-wider uppercase mb-2 border border-amber-500/30">
            <Hourglass className="w-3 h-3 text-amber-400" />
            <span>{isReached ? 'Moment Arrived' : 'Time Capsule Waiting'}</span>
          </div>

          <h3 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-stone-100 group-hover:text-amber-300 transition">
            {capsule.title}
          </h3>

          <p className="text-xs text-stone-400 mt-0.5">
            Destination: {new Date(capsule.target_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Real-time countdown numbers */}
        {!isReached ? (
          <div className="flex items-center gap-2 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-2.5 py-1.5 min-w-[50px] border border-white/10">
              <span className="font-mono text-lg sm:text-xl font-bold text-amber-300 block leading-none">
                {timeLeft.days}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-stone-400">Days</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-2 py-1.5 min-w-[42px] border border-white/10">
              <span className="font-mono text-lg sm:text-xl font-bold text-stone-200 block leading-none">
                {timeLeft.hours}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-stone-400">Hrs</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-2 py-1.5 min-w-[42px] border border-white/10">
              <span className="font-mono text-lg sm:text-xl font-bold text-stone-200 block leading-none">
                {timeLeft.minutes}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-stone-400">Min</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-2 py-1.5 min-w-[42px] border border-white/10">
              <span className="font-mono text-lg sm:text-xl font-bold text-stone-300 block leading-none">
                {timeLeft.seconds}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-stone-400">Sec</span>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl px-4 py-2 text-emerald-300 font-serif text-sm font-semibold">
            🎉 The moment has arrived!
          </div>
        )}
      </div>
    </div>
  );
}

function calculateTimeLeft(targetDate) {
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
