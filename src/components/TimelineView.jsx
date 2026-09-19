import React, { useState, useMemo } from 'react';
import { 
  Calendar, Tag, Search, Filter, Sparkles, Heart, 
  Play, Plus, ArrowUpDown, Film, Image as ImageIcon 
} from 'lucide-react';
import MemoryCard from './MemoryCard';
import { isVideoMedia } from '../services/vaultEngine';

export default function TimelineView({ 
  memories = [], 
  onViewMemory, 
  onDeleteMemory, 
  onToggleFavorite, 
  onOpenAddModal, 
  token 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' = newest first, 'asc' = oldest first

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set(['All']);
    memories.forEach(m => {
      if (m.category) set.add(m.category);
    });
    return Array.from(set);
  }, [memories]);

  // Filter and sort memories
  const filteredMemories = useMemo(() => {
    let result = [...memories];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => {
        const title = (m.caption || m.title || '').toLowerCase();
        const category = (m.category || '').toLowerCase();
        return title.includes(q) || category.includes(q);
      });
    }

    if (selectedCategory !== 'All') {
      result = result.filter(m => m.category === selectedCategory);
    }

    result.sort((a, b) => {
      const dateA = new Date(a.memory_date || a.created_at || 0).getTime();
      const dateB = new Date(b.memory_date || b.created_at || 0).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [memories, searchQuery, selectedCategory, sortOrder]);

  // Group by Year and Month
  const groupedTimeline = useMemo(() => {
    const groups = [];
    let currentKey = null;
    let currentGroup = null;

    filteredMemories.forEach(mem => {
      const d = new Date(mem.memory_date || mem.created_at || Date.now());
      const year = isNaN(d.getFullYear()) ? 'Undated' : d.getFullYear();
      const monthName = isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { month: 'long' });
      const groupKey = `${monthName} ${year}`.trim();

      if (groupKey !== currentKey) {
        currentKey = groupKey;
        currentGroup = {
          key: groupKey,
          year,
          monthName,
          items: []
        };
        groups.push(currentGroup);
      }

      currentGroup.items.push(mem);
    });

    return groups;
  }, [filteredMemories]);

  return (
    <div className="w-full">
      {/* Controls & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 p-4 rounded-2xl bg-stone-900/60 border border-stone-800 backdrop-blur-md">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search timeline moments..."
            className="w-full pl-10 pr-4 py-2 bg-stone-950/80 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Filter Pills & Sort */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <div className="flex items-center gap-1.5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  selectedCategory === cat 
                    ? 'bg-amber-950 text-amber-300 border border-amber-800/80' 
                    : 'bg-stone-950/60 text-stone-400 hover:text-stone-200 border border-stone-800/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-1.5 rounded-lg bg-stone-950/80 border border-stone-800 text-xs font-mono text-stone-300 hover:text-amber-300 flex items-center gap-1.5 whitespace-nowrap ml-auto"
            title="Toggle sort order"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>

      </div>

      {/* Empty State */}
      {filteredMemories.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-stone-900/40 border border-stone-800/80 my-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-950/40 border border-amber-800/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-stone-200">No Timeline Moments Found</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto mt-1 mb-6">
            {searchQuery 
              ? 'Try adjusting your search or category filter to discover memories.' 
              : 'Your timeline is waiting. Add photographs, memorable moments, and personal milestones.'}
          </p>
          <button
            onClick={onOpenAddModal}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-stone-950 font-bold text-xs shadow-lg shadow-amber-950/50 hover:brightness-110 transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add to Timeline</span>
          </button>
        </div>
      ) : (
        /* The Timeline Feed */
        <div className="relative pl-6 sm:pl-10 timeline-spine space-y-12">
          
          {groupedTimeline.map((group) => (
            <div key={group.key} className="relative">
              
              {/* Milestone Node on Spine */}
              <div className="absolute -left-6 sm:-left-10 top-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-xl bg-stone-900 border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-lg shadow-amber-500/20">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>

              {/* Group Title Badge */}
              <div className="mb-6 pt-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900/90 border border-amber-500/30 shadow">
                  <span className="text-xs font-bold font-mono text-amber-300 uppercase tracking-wider">
                    {group.key}
                  </span>
                  <span className="text-[10px] text-stone-400 font-sans">
                    • {group.items.length} {group.items.length === 1 ? 'moment' : 'moments'}
                  </span>
                </div>
              </div>

              {/* Cards Grid for this time period */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.items.map((memory) => (
                  <MemoryCard
                    key={memory.id}
                    memory={memory}
                    token={token}
                    onView={onViewMemory}
                    onDelete={onDeleteMemory}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
              </div>

            </div>
          ))}

        </div>
      )}
    </div>
  );
}
