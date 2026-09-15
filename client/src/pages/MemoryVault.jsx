import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { 
  Image as ImageIcon, Film, Lock, Globe, Plus, Trash2, 
  Calendar, Search, Filter, ShieldCheck, Heart, Sparkles, AlertCircle
} from 'lucide-react';

export default function MemoryVault() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'photo' | 'video'
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusMessage, setStatusMessage] = useState('');

  const navigate = useNavigate();

  const loadMemories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (search.trim()) params.append('search', search.trim());

      const { data } = await api.get(`/memories?${params.toString()}`);
      setMemories(data);
    } catch (err) {
      console.error('Error loading vault:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, [filterType, selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadMemories();
  };

  // Toggle public / private sharing
  const handleToggleShare = async (id, currentStatus) => {
    try {
      const { data } = await api.post(`/public/toggle-share/${id}`);
      setStatusMessage(data.message);
      setTimeout(() => setStatusMessage(''), 4000);
      loadMemories();
    } catch (err) {
      console.error('Error toggling share:', err);
    }
  };

  // Delete permanently
  const handleDelete = async (id) => {
    if (!window.confirm('⚠️ Are you certain you want to permanently delete this memory from your vault? This cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/memories/${id}`);
      setStatusMessage('Memory permanently removed.');
      setTimeout(() => setStatusMessage(''), 3000);
      loadMemories();
    } catch (err) {
      console.error('Error deleting memory:', err);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Top Banner: Security & Permanence Promise */}
      <div className="bg-gradient-to-r from-violet-950/60 via-purple-900/30 to-indigo-950/60 border border-violet-500/20 rounded-3xl p-6 mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-600/20 text-violet-300 border border-violet-500/30 flex items-center justify-center text-2xl flex-shrink-0">
            🛡️
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Your Private Memory Vault</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-medium">
                100% Private to You
              </span>
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              All uploaded photos and videos remain here permanently until you explicitly delete them. No one else can view these private files unless you choose to share them to the Public Post section.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/memories/new')}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold px-5 py-3 rounded-2xl text-sm shadow-xl shadow-violet-900/40 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Upload New Memory</span>
        </button>
      </div>

      {statusMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-violet-900/40 border border-violet-500/30 text-violet-200 text-sm flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        {/* Media Type Tabs */}
        <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'photo', label: 'Photos Only', icon: ImageIcon },
            { id: 'video', label: 'Videos Only', icon: Film },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                filterType === tab.id
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search memories by title or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-violet-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="bg-white/10 hover:bg-white/15 text-white text-xs font-semibold px-4 py-2 rounded-2xl transition-all"
          >
            Search
          </button>
        </form>
      </div>

      {/* Grid of Memories */}
      {loading ? (
        <div className="text-center py-20">
          <div className="text-4xl animate-pulse mb-3">🧠</div>
          <p className="text-violet-300 text-sm">Accessing encrypted vault files…</p>
        </div>
      ) : memories.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-violet-600/20 text-violet-400 flex items-center justify-center text-3xl mx-auto mb-4">
            📷
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Your vault has no records matching this filter</h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-6">
            Upload your permanent photos, videos, and sacred memories to keep them safe forever.
          </p>
          <button
            onClick={() => navigate('/memories/new')}
            className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition-all shadow-lg"
          >
            + Upload First Memory
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memories.map(m => (
            <div
              key={m.id}
              className="glass-card rounded-3xl overflow-hidden border border-white/5 hover:border-violet-500/30 transition-all flex flex-col group"
            >
              {/* Media Preview (Photo or Video) */}
              {m.media_url ? (
                <div className="w-full h-56 bg-black/50 relative overflow-hidden flex items-center justify-center">
                  {m.media_type === 'video' ? (
                    <video
                      src={m.media_url}
                      controls
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={m.media_url}
                      alt={m.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}

                  {/* Top-right privacy badge */}
                  <div className="absolute top-3 right-3">
                    {m.is_public === 1 ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-sky-500/80 text-white backdrop-blur-md shadow-md">
                        <Globe className="w-3 h-3" />
                        <span>Public Echo</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-black/70 text-slate-200 border border-white/10 backdrop-blur-md">
                        <Lock className="w-3 h-3 text-violet-400" />
                        <span>Private</span>
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full h-32 bg-gradient-to-br from-violet-900/30 to-purple-900/20 flex items-center justify-center text-3xl">
                  📝
                </div>
              )}

              {/* Memory Details */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                    <Calendar className="w-3.5 h-3.5 text-violet-400" />
                    <span>{new Date(m.memory_date || m.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span>•</span>
                    <span className="text-violet-300 font-medium">{m.category}</span>
                  </div>

                  <h3 className="font-bold text-white text-base mb-1.5 line-clamp-1">
                    {m.title}
                  </h3>
                  <p className="text-slate-300 text-xs leading-relaxed line-clamp-3 mb-4">
                    {m.description || 'No description added.'}
                  </p>
                </div>

                {/* Actions & Privacy toggle */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => handleToggleShare(m.id, m.is_public)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
                      m.is_public === 1
                        ? 'bg-sky-500/15 text-sky-300 hover:bg-sky-500/25'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {m.is_public === 1 ? (
                      <>
                        <Globe className="w-3.5 h-3.5 text-sky-400" />
                        <span>Make Private</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <span>Share to Public Post</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(m.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-all"
                    title="Delete permanently from vault"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
