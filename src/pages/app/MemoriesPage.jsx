import React, { useState, useEffect } from 'react';
import { memoryService } from '../../services/memoryService';
import { 
  Search, Filter, Plus, Grid, List, Calendar, 
  Tag, MapPin, Heart, ArrowUpDown, X
} from 'lucide-react';
import MemoryCard from '../../components/MemoryCard';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';

const CATEGORIES = ['All', 'Personal', 'Family', 'Travel', 'Milestone', 'Work', 'Special Moment'];

export default function MemoriesPage({ onOpenAddModal, onSelectMemory }) {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  useEffect(() => {
    loadMemories();
  }, [category, search]);

  const loadMemories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await memoryService.getMemories({
        search,
        category: category === 'All' ? '' : category,
      });
      setMemories(data);
    } catch (err) {
      console.error('Failed to load memories', err);
      setError("Couldn't load your memories. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const sortedMemories = [...memories].sort((a, b) => {
    const dateA = new Date(a.memory_date || a.created_at || 0).getTime();
    const dateB = new Date(b.memory_date || b.created_at || 0).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Memories
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {loading ? 'Connecting to vault...' : error ? 'Sync error' : `${memories.length} ${memories.length === 1 ? 'moment' : 'moments'} preserved in your vault`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={onOpenAddModal} className="flex items-center gap-1.5 shadow-sm">
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Memory</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, story, tags, or location..."
              className="w-full pl-9 pr-9 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Controls: Sort Order and View Toggle */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition"
              title="Toggle date sort order"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
            </button>

            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list' 
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          {CATEGORIES.map((cat) => {
            const isActive = category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton variant="card" className="h-64" />
          <Skeleton variant="card" className="h-64" />
          <Skeleton variant="card" className="h-64" />
          <Skeleton variant="card" className="h-64" />
          <Skeleton variant="card" className="h-64" />
          <Skeleton variant="card" className="h-64" />
        </div>
      ) : error ? (
        <div className="p-12 bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/40 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center mb-4">
            <X className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
            Couldn't load your memories. Try again.
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            We encountered a network issue reaching your vault. Your memories are safely preserved in the cloud.
          </p>
          <Button onClick={loadMemories} variant="primary">
            Retry Loading
          </Button>
        </div>
      ) : sortedMemories.length === 0 ? (
        <div className="p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
          <EmptyState
            title={search || category !== 'All' ? 'No matching memories found' : 'Your vault is empty'}
            description={
              search || category !== 'All'
                ? 'Try adjusting your search query or switching categories.'
                : 'Start chronicling your life stories and capturing moments.'
            }
            actionText={search || category !== 'All' ? 'Clear Filters' : 'Create First Memory'}
            onAction={() => {
              if (search || category !== 'All') {
                setSearch('');
                setCategory('All');
              } else {
                onOpenAddModal();
              }
            }}
          />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedMemories.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              onClick={() => onSelectMemory?.(memory)}
              onFavoriteToggle={async () => {
                await memoryService.toggleFavorite(memory.id, !memory.is_favorite);
                loadMemories();
              }}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-sm">
          {sortedMemories.map((memory) => {
            const hasMedia = memory.media && memory.media.length > 0;
            const mediaItem = hasMedia ? memory.media[0] : null;

            return (
              <div
                key={memory.id}
                onClick={() => onSelectMemory?.(memory)}
                className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {hasMedia ? (
                    <img
                      src={mediaItem.url || mediaItem.data_url || memory.image_url}
                      alt={memory.title}
                      onError={(e) => {
                        if (mediaItem?.data_url && e.currentTarget.src !== mediaItem.data_url) {
                          e.currentTarget.src = mediaItem.data_url;
                        }
                      }}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {memory.title?.charAt(0) || 'M'}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {memory.title}
                      </h3>
                      {memory.is_favorite && (
                        <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>{new Date(memory.memory_date).toLocaleDateString()}</span>
                      {memory.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{memory.location}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="secondary">{memory.category || 'Personal'}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
