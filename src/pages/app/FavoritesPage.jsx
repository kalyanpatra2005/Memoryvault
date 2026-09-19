import React, { useState, useEffect } from 'react';
import { memoryService } from '../../services/memoryService';
import { Heart, Search, X, Plus } from 'lucide-react';
import MemoryCard from '../../components/MemoryCard';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

export default function FavoritesPage({ onOpenAddModal, onSelectMemory, onNavigate }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadFavorites();
  }, [search]);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const data = await memoryService.getMemories({
        search,
        isFavoriteOnly: true
      });
      setFavorites(data);
    } catch (err) {
      console.error('Failed to load favorites', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Favorites
            </h1>
            <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Your most treasured memories and highlighted moments.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search favorites..."
            className="w-full pl-9 pr-9 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
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
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton variant="card" className="h-64" />
          <Skeleton variant="card" className="h-64" />
          <Skeleton variant="card" className="h-64" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
          <EmptyState
            title={search ? 'No matching favorites' : 'No favorites yet'}
            description={
              search
                ? 'Try a different search keyword.'
                : 'Click the heart icon on any memory card to bookmark it here for quick access.'
            }
            actionText={search ? 'Clear Search' : 'Browse All Memories'}
            onAction={() => {
              if (search) setSearch('');
              else onNavigate?.('/memories');
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              onClick={() => onSelectMemory?.(memory)}
              onFavoriteToggle={async () => {
                await memoryService.toggleFavorite(memory.id, !memory.is_favorite);
                loadFavorites();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
