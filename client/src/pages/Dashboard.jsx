import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { vaultEngine, safeFetchJson, isVideoMedia } from '../services/vaultEngine';
import { BookOpen, Film, Clock, ShieldCheck, HardDrive, ArrowRight, Sparkles, Heart, PlusCircle, Calendar } from 'lucide-react';

export default function Dashboard({ setActiveTab }) {
  const { user, token, authFetch } = useAuth();
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

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      let serverStats = null;
      try {
        const res = await authFetch('/api/stats');
        const data = await safeFetchJson(res);
        if (res.ok && data && (data.photos !== undefined || data.videos !== undefined)) {
          serverStats = data;
        }
      } catch (e) {}

      // Fetch all vaulted items and diaries (IndexedDB + LocalStorage + Server synced)
      const localItems = await vaultEngine.getVaultItems(token, user?.id || 'guest');
      const localDiaries = await vaultEngine.getDiaries(token, user?.id || 'guest');

      let localPhotos = 0;
      let localVideos = 0;
      let localBytes = 0;

      localItems.forEach(item => {
        const bytes = Number(item.size_bytes || item.file_size || 0) ||
          (item.data_url ? Math.round(item.data_url.length * 0.75) : 0);
        localBytes += bytes;

        if (isVideoMedia(item)) {
          localVideos++;
        } else {
          localPhotos++;
        }
      });

      // When localItems are present, its dynamic item classification is authoritative
      const finalPhotos = localItems.length > 0 ? localPhotos : (serverStats?.photos || 0);
      const finalVideos = localItems.length > 0 ? localVideos : (serverStats?.videos || 0);
      const finalBytes = Math.max(serverStats?.totalBytes || 0, localBytes);
      const finalDiaries = Math.max(serverStats?.diaries || 0, localDiaries.length);

      setStats({
        photos: finalPhotos,
        videos: finalVideos,
        diaries: finalDiaries,
        capsules: serverStats?.capsules || 0,
        totalBytes: finalBytes,
        latestDiary: serverStats?.latestDiary || (localDiaries[0] ? {
          title: localDiaries[0].title,
          mood: localDiaries[0].mood,
          created_at: localDiaries[0].created_at
        } : null),
        nextCapsule: serverStats?.nextCapsule || null
      });
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-stone-900 via-vault-900 to-amber-950/40 border border-amber-900/40 p-6 sm:p-10 shadow-2xl mb-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-700/40 text-amber-300 text-xs font-mono mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>PERMANENT & PRIVATE VAULT</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-antique text-stone-100">
              Welcome back to your Sanctuary, <span className="text-amber-200">{user?.name?.replace(/\.+$/, '')}</span>.
            </h1>
            <p className="text-stone-400 text-sm sm:text-base font-serif mt-2 max-w-2xl">
              All your memories, tragic diary writings, photographs, and sealed time capsules are permanently safeguarded here. Nobody can access them except you.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setActiveTab('diary')}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-stone-950 font-bold text-sm shadow-lg shadow-amber-950 hover:brightness-110 transition flex items-center justify-center space-x-2 border border-amber-400/40"
            >
              <BookOpen className="w-4 h-4 text-stone-950" />
              <span>Write in Diary</span>
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className="px-5 py-3 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-amber-200 border border-amber-800/40 text-sm font-medium transition flex items-center justify-center space-x-2"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>Upload Memories</span>
            </button>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute right-0 bottom-0 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        
        {/* Photos Card */}
        <div 
          onClick={() => setActiveTab('media')}
          className="cursor-pointer p-5 rounded-2xl bg-stone-900/80 border border-amber-900/30 hover:border-amber-600/50 transition-all group shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Film className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase font-mono tracking-wider bg-stone-950 text-stone-400 px-2 py-0.5 rounded border border-stone-800">
              Photos & Videos
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-antique text-stone-100">
            {stats.photos} <span className="text-xs font-normal text-stone-400 font-sans">photos</span> · {stats.videos} <span className="text-xs font-normal text-stone-400 font-sans">videos</span>
          </div>
          <div className="mt-1 text-xs text-stone-400 flex items-center space-x-1">
            <HardDrive className="w-3 h-3 text-stone-500 inline" />
            <span>{formatBytes(stats.totalBytes)} permanently stored</span>
          </div>
        </div>

        {/* Tragic Diary Card */}
        <div 
          onClick={() => setActiveTab('diary')}
          className="cursor-pointer p-5 rounded-2xl bg-stone-900/80 border border-amber-900/30 hover:border-amber-600/50 transition-all group shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase font-mono tracking-wider bg-amber-950 text-amber-400 px-2 py-0.5 rounded border border-amber-800">
              Antique Diary
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-antique text-stone-100">
            {stats.diaries} <span className="text-xs font-normal text-stone-400 font-sans">entries</span>
          </div>
          <p className="mt-1 text-xs text-stone-400">
            Parchment writings & heartbreaks
          </p>
        </div>

        {/* Time Capsules Card */}
        <div 
          onClick={() => setActiveTab('capsules')}
          className="cursor-pointer p-5 rounded-2xl bg-stone-900/80 border border-amber-900/30 hover:border-amber-600/50 transition-all group shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase font-mono tracking-wider bg-stone-950 text-stone-400 px-2 py-0.5 rounded border border-stone-800">
              Time Locked
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-antique text-stone-100">
            {stats.capsules} <span className="text-xs font-normal text-stone-400 font-sans">capsules</span>
          </div>
          <p className="mt-1 text-xs text-stone-400">
            Cast into future dates
          </p>
        </div>

        {/* Security & Lifetime Status */}
        <div className="p-5 rounded-2xl bg-stone-900/80 border border-emerald-950/80 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase font-mono tracking-wider bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
              Active
            </span>
          </div>
          <div className="text-lg font-bold font-antique text-stone-100">
            Lifetime Free
          </div>
          <p className="mt-1 text-xs text-stone-400">
            Zero fees • Strict User Isolation
          </p>
        </div>

      </div>

      {/* QUICK JUMP / PREVIEW PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Latest Diary Preview */}
        <div className="p-6 rounded-2xl bg-stone-900/70 border border-amber-900/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <h2 className="text-lg font-bold font-antique text-stone-200">The Tragic Personal Diary</h2>
              </div>
              <span className="text-xs text-amber-500/80 font-mono italic">Writing Archive</span>
            </div>

            {stats.latestDiary ? (
              <div className="p-4 rounded-xl bg-stone-950/80 border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-amber-200">{stats.latestDiary.title}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/50">
                    {stats.latestDiary.mood}
                  </span>
                </div>
                <p className="text-xs text-stone-400">
                  Written on {new Date(stats.latestDiary.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                </p>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-stone-950/60 border border-stone-800/80 text-center text-stone-400 text-xs">
                <p className="font-serif italic text-stone-300 mb-2">"The unspoken words in your heart wait for this paper."</p>
                <p>No diary entries written yet. Begin your first handwritten memory.</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveTab('diary')}
            className="mt-4 w-full py-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/50 text-amber-200 text-xs font-semibold flex items-center justify-center space-x-2 transition"
          >
            <span>Open Diary Desk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Upcoming Time Capsule Preview */}
        <div className="p-6 rounded-2xl bg-stone-900/70 border border-amber-900/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h2 className="text-lg font-bold font-antique text-stone-200">Sealed Time Capsules</h2>
              </div>
              <span className="text-xs text-amber-500/80 font-mono italic">Future Messages</span>
            </div>

            {stats.nextCapsule ? (
              <div className="p-4 rounded-xl bg-stone-950/80 border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-amber-200">{stats.nextCapsule.title}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/50">
                    Sealed
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-amber-400/90">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Unlocks on: {new Date(stats.nextCapsule.unlock_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-stone-950/60 border border-stone-800/80 text-center text-stone-400 text-xs">
                <p className="font-serif italic text-stone-300 mb-2">"Send a message or a treasured photograph to your future self."</p>
                <p>No sealed capsules right now.</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveTab('capsules')}
            className="mt-4 w-full py-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/50 text-amber-200 text-xs font-semibold flex items-center justify-center space-x-2 transition"
          >
            <span>View All Time Capsules</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
}
