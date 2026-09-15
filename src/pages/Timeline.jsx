import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../api';

const CATEGORIES = ['All', 'Personal', 'Travel', 'Family', 'Work', 'Milestone', 'Other'];
const MOODS = ['😊', '❤️', '🎉', '😢', '😌', '🤩', '😤', '🥰', '😂', '🙏', '💭', '✨'];

export default function Timeline() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [memories, setMemories] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedYear) params.year = selectedYear;
      if (search) params.search = search;
      const { data } = await api.get('/memories', { params });
      setMemories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/memories/stats');
      setYears(data.years || []);
    } catch (err) {}
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchMemories(); }, [selectedYear, selectedCategory, search]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this memory permanently?')) return;
    try {
      await api.delete(`/memories/${id}`);
      setMemories(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      alert('Failed to delete memory');
    }
  };

  // Group by year for timeline display
  const grouped = memories.reduce((acc, mem) => {
    const yr = new Date(mem.memory_date).getFullYear().toString();
    if (!acc[yr]) acc[yr] = [];
    acc[yr].push(mem);
    return acc;
  }, {});

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-2xl font-bold">Memory Timeline</h1>
          <p className="text-violet-400/60 text-sm mt-1">{memories.length} memor{memories.length !== 1 ? 'ies' : 'y'} found</p>
        </div>
        <button
          onClick={() => navigate('/memories/new')}
          className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
        >
          <span>➕</span> Add Memory
        </button>
      </div>

      {/* Year tabs — inspired by image 3 */}
      {years.length > 0 && (
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedYear(null)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex-shrink-0 ${
              !selectedYear ? 'text-amber-400 border-b-2 border-amber-400' : 'text-violet-400/60 hover:text-violet-300'
            }`}
          >
            All
          </button>
          {years.map(yr => (
            <button
              key={yr}
              onClick={() => setSelectedYear(yr === selectedYear ? null : yr)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex-shrink-0 ${
                selectedYear === yr ? 'text-amber-400 border-b-2 border-amber-400' : 'text-violet-400/60 hover:text-violet-300'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <input
          type="text"
          placeholder="🔍 Search memories…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-violet-400/40 focus:border-violet-500 transition-all"
        />
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-violet-600 text-white'
                  : 'glass-card text-violet-300/70 hover:text-violet-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="text-4xl animate-pulse">⏳</div>
        </div>
      ) : memories.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-violet-200 font-medium mb-2">No memories found</p>
          <p className="text-violet-400/50 text-sm mb-6">
            {search || selectedCategory !== 'All' ? 'Try adjusting your filters' : 'Start adding your first memory!'}
          </p>
          <button
            onClick={() => navigate('/memories/new')}
            className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
          >
            ✨ Add Memory
          </button>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical dashed line */}
          <div className="absolute left-5 top-0 bottom-0 w-px border-l-2 border-dashed border-violet-700/40" />

          <div className="flex flex-col gap-0">
            {Object.entries(grouped)
              .sort(([a], [b]) => parseInt(b) - parseInt(a))
              .map(([yr, mems]) => (
                <div key={yr}>
                  {/* Year label */}
                  <div className="flex items-center gap-4 mb-4 mt-2">
                    <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 z-10 shadow-lg shadow-amber-500/30 timeline-dot-active">
                      {yr.slice(2)}
                    </div>
                    <span className="text-amber-400 font-bold text-xl">{yr}</span>
                  </div>

                  {/* Memory items */}
                  <div className="ml-16 flex flex-col gap-3 mb-6">
                    {mems.map((mem, idx) => (
                      <div key={mem.id} className="relative flex items-start gap-4">
                        {/* Dot */}
                        <div className="absolute -left-11 top-5 w-3 h-3 rounded-full bg-amber-500/60 border-2 border-amber-400 flex-shrink-0 z-10" />

                        {/* Card */}
                        <div
                          onClick={() => navigate(`/memories/${mem.id}`)}
                          className="flex-1 glass-card rounded-2xl p-4 cursor-pointer hover:border-violet-500/50 hover-lift group transition-all"
                        >
                          <div className="flex items-center gap-4">
                            {/* Thumbnail */}
                            {mem.photos?.[0] ? (
                              <img
                                src={mem.photos[0]}
                                alt={mem.title}
                                className="w-16 h-16 rounded-xl object-cover flex-shrink-0 group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-800/60 to-indigo-900/60 flex items-center justify-center text-2xl flex-shrink-0">
                                {mem.mood || '💭'}
                              </div>
                            )}

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-semibold text-sm truncate">{mem.title}</h3>
                              <p className="text-violet-400/60 text-xs mt-0.5">{format(new Date(mem.memory_date), 'MMM dd, yyyy')}</p>
                              {mem.description && (
                                <p className="text-violet-300/50 text-xs mt-1 line-clamp-1">{mem.description}</p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-1 flex-shrink-0">
                              <button
                                onClick={e => { e.stopPropagation(); navigate(`/memories/${mem.id}`); }}
                                className="text-violet-400/60 hover:text-violet-300 p-1.5 rounded-lg hover:bg-violet-500/20 transition-all"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); handleDelete(mem.id); }}
                                className="text-red-400/40 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
