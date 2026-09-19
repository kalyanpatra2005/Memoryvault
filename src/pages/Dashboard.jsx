import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { vaultEngine, safeFetchJson, isVideoMedia } from '../services/vaultEngine';
import MemoryCard from '../components/MemoryCard';
import TimelineView from '../components/TimelineView';
import MemoryDetailModal from '../components/MemoryDetailModal';
import AddMemoryModal from '../components/AddMemoryModal';
import { 
  LayoutGrid, GitCommit, Search, Plus, Sparkles, BookOpen, 
  Clock, Film, Heart, ShieldCheck, HardDrive, Calendar, 
  ArrowRight, AlertCircle, Filter, CheckCircle2 
} from 'lucide-react';

export default function Dashboard({ setActiveTab }) {
  const { user, token, authFetch } = useAuth();
  
  const [memories, setMemories] = useState([]);
  const [diaries, setDiaries] = useState([]);
  const [capsules, setCapsules] = useState([]);
  const [stats, setStats] = useState({
    photos: 0,
    videos: 0,
    diaries: 0,
    capsules: 0,
    totalBytes: 0,
    latestDiary: null,
    nextCapsule: null
  });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'photos', 'videos', 'favorites', or category name
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'timeline'

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeMemoryDetail, setActiveMemoryDetail] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [token, user?.id, user?.email]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Fetch server stats if available
      let serverStats = null;
      try {
        const res = await authFetch('/api/stats');
        const data = await safeFetchJson(res);
        if (res.ok && data) serverStats = data;
      } catch (e) {}

      // 2. Fetch all vault items (photos/videos/memories)
      const allItems = await vaultEngine.getVaultItems(token, user?.id || 'guest', user?.email || '');
      
      // 3. Fetch diaries
      const allDiaries = await vaultEngine.getDiaries(token, user?.id || 'guest', user?.email || '');

      // 4. Fetch capsules
      let allCapsules = [];
      try {
        const cRes = await authFetch('/api/capsules');
        const cData = await safeFetchJson(cRes);
        if (cRes.ok && cData?.capsules) allCapsules = cData.capsules;
      } catch (e) {}

      let photoCount = 0;
      let videoCount = 0;
      let totalBytes = 0;

      allItems.forEach(item => {
        const bytes = Number(item.size_bytes || item.file_size || 0) ||
          (item.data_url ? Math.round(item.data_url.length * 0.75) : 0);
        totalBytes += bytes;

        if (isVideoMedia(item)) {
          videoCount++;
        } else {
          photoCount++;
        }
      });

      // Sort memories newest first
      allItems.sort((a, b) => new Date(b.memory_date || b.created_at || 0) - new Date(a.memory_date || a.created_at || 0));

      setMemories(allItems);
      setDiaries(allDiaries);
      setCapsules(allCapsules);

      setStats({
        photos: photoCount,
        videos: videoCount,
        diaries: Math.max(serverStats?.diaries || 0, allDiaries.length),
        capsules: Math.max(serverStats?.capsules || 0, allCapsules.length),
        totalBytes: Math.max(serverStats?.totalBytes || 0, totalBytes),
        latestDiary: serverStats?.latestDiary || (allDiaries[0] ? {
          title: allDiaries[0].title,
          mood: allDiaries[0].mood,
          created_at: allDiaries[0].created_at
        } : null),
        nextCapsule: serverStats?.nextCapsule || (allCapsules[0] || null)
      });

    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMemory = async (id) => {
    try {
      await vaultEngine.deleteVaultItem(token, id, user?.id || 'guest');
      setMemories(prev => prev.filter(m => String(m.id) !== String(id)));
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const handleToggleFavorite = (memory) => {
    setMemories(prev => prev.map(m => {
      if (m.id === memory.id) {
        const currentFav = m.is_favorite || (Array.isArray(m.tags) && m.tags.includes('favorite'));
        const newFav = !currentFav;
        let updatedTags = Array.isArray(m.tags) ? [...m.tags] : [];
        if (newFav && !updatedTags.includes('favorite')) {
          updatedTags.push('favorite');
        } else if (!newFav) {
          updatedTags = updatedTags.filter(t => t !== 'favorite');
        }
        return { ...m, is_favorite: newFav, tags: updatedTags };
      }
      return m;
    }));
  };

  const handleMemoryAdded = (newItem) => {
    if (newItem) {
      setMemories(prev => [newItem, ...prev]);
      loadDashboardData();
    }
  };

  // Filtered Memories for display
  const filteredMemories = useMemo(() => {
    let result = [...memories];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => {
        const text = (m.caption || m.title || '').toLowerCase();
        const cat = (m.category || '').toLowerCase();
        return text.includes(q) || cat.includes(q);
      });
    }

    if (selectedFilter === 'photos') {
      result = result.filter(m => !isVideoMedia(m));
    } else if (selectedFilter === 'videos') {
      result = result.filter(m => isVideoMedia(m));
    } else if (selectedFilter === 'favorites') {
      result = result.filter(m => m.is_favorite || (m.tags && (Array.isArray(m.tags) ? m.tags.includes('favorite') : m.tags.includes('favorite'))));
    } else if (selectedFilter !== 'all') {
      result = result.filter(m => m.category === selectedFilter);
    }

    return result;
  }, [memories, searchQuery, selectedFilter]);

  const formatBytes = (bytes) => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const todayString = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-stone-200">
      
      {/* GREETING & HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-stone-900 via-stone-950 to-amber-950/40 border border-amber-500/20 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/30 text-amber-300 text-xs font-mono mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>PERMANENT CLOUD ARCHIVE • {todayString}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold font-sans text-stone-100 tracking-tight">
              Welcome to your TimeMemory, <span className="text-amber-300">{user?.name ? user.name.replace(/\.+$/, '') : 'Keeper'}</span>.
            </h1>
            
            <p className="text-stone-400 text-xs sm:text-sm max-w-2xl mt-2 leading-relaxed">
              Your photos, milestones, candlelit journal reflections, and sealed time capsules are permanently safeguarded here.
            </p>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:brightness-110 text-stone-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-950/50 transition border border-amber-400/40 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-stone-950 stroke-[2.5]" />
              <span>Add Memory</span>
            </button>

            <button
              onClick={() => setActiveTab('diary')}
              className="px-4 py-3 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-200 hover:text-amber-200 border border-stone-700/80 text-xs sm:text-sm font-medium transition flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Write Diary</span>
            </button>

            <button
              onClick={() => setActiveTab('capsules')}
              className="px-4 py-3 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-200 hover:text-amber-200 border border-stone-700/80 text-xs sm:text-sm font-medium transition flex items-center gap-2"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Seal Capsule</span>
            </button>
          </div>

        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 4 SLEEK STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Total Memories */}
        <div 
          onClick={() => setActiveTab('media')}
          className="glass-card rounded-2xl p-5 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Film className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase font-mono tracking-wider bg-stone-950 text-stone-400 px-2 py-0.5 rounded border border-stone-800">
              Media Archive
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-stone-100 font-sans">
            {memories.length} <span className="text-xs font-normal text-stone-400">items</span>
          </div>
          <p className="mt-1 text-xs text-stone-400 flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-stone-500" />
            <span>{formatBytes(stats.totalBytes)} cloud stored</span>
          </p>
        </div>

        {/* Timeline Moments */}
        <div 
          onClick={() => setViewMode('timeline')}
          className="glass-card rounded-2xl p-5 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <GitCommit className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase font-mono tracking-wider bg-stone-950 text-stone-400 px-2 py-0.5 rounded border border-stone-800">
              Chronology
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-stone-100 font-sans">
            {memories.filter(m => m.memory_date).length} <span className="text-xs font-normal text-stone-400">milestones</span>
          </div>
          <p className="mt-1 text-xs text-stone-400">
            Organized across years & months
          </p>
        </div>

        {/* Secret Diary */}
        <div 
          onClick={() => setActiveTab('diary')}
          className="glass-card rounded-2xl p-5 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase font-mono tracking-wider bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800/60">
              Journal
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-stone-100 font-sans">
            {stats.diaries} <span className="text-xs font-normal text-stone-400">entries</span>
          </div>
          <p className="mt-1 text-xs text-stone-400">
            {stats.latestDiary ? `Latest: ${stats.latestDiary.title}` : 'Candlelit parchment desk'}
          </p>
        </div>

        {/* Time Capsules */}
        <div 
          onClick={() => setActiveTab('capsules')}
          className="glass-card rounded-2xl p-5 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase font-mono tracking-wider bg-stone-950 text-stone-400 px-2 py-0.5 rounded border border-stone-800">
              Time Locks
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-stone-100 font-sans">
            {stats.capsules} <span className="text-xs font-normal text-stone-400">sealed</span>
          </div>
          <p className="mt-1 text-xs text-stone-400">
            Guarded until future dates
          </p>
        </div>

      </div>

      {/* FILTER & VIEW CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-stone-900/60 border border-stone-800 backdrop-blur-md">
        
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories, captions, categories..."
            className="w-full pl-10 pr-4 py-2 bg-stone-950/80 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-400 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Moments' },
            { id: 'photos', label: 'Photos' },
            { id: 'videos', label: 'Videos' },
            { id: 'favorites', label: 'Favorites' },
            { id: 'Travel', label: 'Travel' },
            { id: 'Milestone', label: 'Milestones' },
            { id: 'Family', label: 'Family' },
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedFilter === filter.id 
                  ? 'bg-amber-950 text-amber-300 border border-amber-800/80 shadow-sm' 
                  : 'bg-stone-950/60 text-stone-400 hover:text-stone-200 border border-stone-800/60'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* View Mode Toggle: Grid vs. Timeline */}
        <div className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800 self-start md:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'grid' 
                ? 'bg-amber-950 text-amber-300 border border-amber-800/60' 
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Grid</span>
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'timeline' 
                ? 'bg-amber-950 text-amber-300 border border-amber-800/60' 
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </button>
        </div>

      </div>

      {/* MAIN VIEW AREA: GRID OR TIMELINE */}
      {viewMode === 'timeline' ? (
        <TimelineView
          memories={filteredMemories}
          token={token}
          onViewMemory={(mem) => setActiveMemoryDetail(mem)}
          onDeleteMemory={handleDeleteMemory}
          onToggleFavorite={handleToggleFavorite}
          onOpenAddModal={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div>
          {filteredMemories.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-stone-900/40 border border-stone-800/80 my-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-950/40 border border-amber-800/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-stone-200">No Memories Found</h3>
              <p className="text-xs text-stone-400 max-w-sm mx-auto mt-1 mb-6">
                {searchQuery || selectedFilter !== 'all'
                  ? 'No memories match your current search and filter settings.'
                  : 'Your TimeMemory vault is empty. Begin preserving your life moments.'}
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-stone-950 font-bold text-xs shadow-lg shadow-amber-950/50 hover:brightness-110 transition inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Memory</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMemories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  token={token}
                  onView={(mem) => setActiveMemoryDetail(mem)}
                  onDelete={handleDeleteMemory}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      <AddMemoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleMemoryAdded}
      />

      <MemoryDetailModal
        memory={activeMemoryDetail}
        onClose={() => setActiveMemoryDetail(null)}
        onDelete={handleDeleteMemory}
        onToggleFavorite={handleToggleFavorite}
        token={token}
      />

    </div>
  );
}
