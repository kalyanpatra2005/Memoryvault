import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { memoryService } from '../../services/memoryService';
import { 
  Layers, Image as ImageIcon, Heart, Calendar, 
  Plus, ArrowRight, Sparkles, Clock, Compass, Shield
} from 'lucide-react';
import Button from '../../components/ui/Button';
import MemoryCard from '../../components/MemoryCard';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

export default function DashboardPage({ onOpenAddModal, onSelectMemory, onNavigate }) {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    totalMemories: 0,
    mediaCount: 0,
    favoritesCount: 0,
    milestonesCount: 0
  });
  const [recentMemories, setRecentMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, memories] = await Promise.all([
        memoryService.getStatistics(),
        memoryService.getMemories()
      ]);
      setStats(statsData);
      setRecentMemories(memories.slice(0, 6));
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Friend';

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 overflow-hidden shadow-lg">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 mb-3 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Private Personal Vault</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {getTimeGreeting()}, {displayName}
            </h1>
            <p className="mt-1 text-sm text-indigo-100 max-w-lg leading-relaxed">
              Your personal library of life stories and milestones. All data is securely stored and isolated.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={onOpenAddModal}
              className="bg-white text-indigo-950 hover:bg-indigo-50 font-bold shadow-md hover:shadow-lg border-0"
            >
              <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
              Capture Moment
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Memories</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {loading ? '-' : stats.totalMemories}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Recorded moments</p>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Media Files</span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {loading ? '-' : stats.mediaCount}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Photos & videos</p>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Favorites</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {loading ? '-' : stats.favoritesCount}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Starred moments</p>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Milestones</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {loading ? '-' : stats.milestonesCount}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Major life events</p>
          </div>
        </div>
      </div>

      {/* Recent Memories Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Recent Memories
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Your most recent stories and photos</p>
          </div>
          <button
            onClick={() => onNavigate?.('/memories')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 transition"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton variant="card" className="h-64" />
            <Skeleton variant="card" className="h-64" />
            <Skeleton variant="card" className="h-64" />
          </div>
        ) : recentMemories.length === 0 ? (
          <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <EmptyState
              title="No memories recorded yet"
              description="Your memory vault is pristine and waiting for your first story, photograph, or milestone."
              actionText="Capture Your First Moment"
              onAction={onOpenAddModal}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentMemories.map((memory) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                onClick={() => onSelectMemory?.(memory)}
                onFavoriteToggle={async () => {
                  await memoryService.toggleFavorite(memory.id, !memory.is_favorite);
                  loadDashboardData();
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div 
          onClick={() => onNavigate?.('/timeline')}
          className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/40 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                Chronological Timeline &rarr;
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Browse memories ordered sequentially by Year, Month, and Day.
              </p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => onNavigate?.('/favorites')}
          className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-rose-500/40 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition">
                Starred Favorites &rarr;
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Quickly revisit your most treasured memories in one curated space.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
