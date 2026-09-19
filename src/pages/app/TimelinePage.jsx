import React, { useState, useEffect, useMemo } from 'react';
import { memoryService } from '../../services/memoryService';
import { 
  Calendar, Clock, MapPin, Tag, Heart, Plus, 
  ChevronRight, Sparkles, Filter
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';

const CATEGORIES = ['All', 'Personal', 'Family', 'Travel', 'Milestone', 'Work', 'Special Moment'];

export default function TimelinePage({ onOpenAddModal, onSelectMemory }) {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    setLoading(true);
    try {
      const data = await memoryService.getMemories();
      setMemories(data);
    } catch (err) {
      console.error('Failed to load timeline memories', err);
    } finally {
      setLoading(false);
    }
  };

  // Group memories hierarchically: Year -> Month -> List of Memories
  const { groupedTimeline, availableYears } = useMemo(() => {
    let filtered = [...memories];
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(m => m.category === selectedCategory);
    }

    const yearsSet = new Set();
    filtered.forEach(m => {
      const d = new Date(m.memory_date || m.created_at || Date.now());
      yearsSet.add(d.getFullYear().toString());
    });

    const yearsList = Array.from(yearsSet).sort((a, b) => b - a);

    if (selectedYear !== 'All') {
      filtered = filtered.filter(m => {
        const d = new Date(m.memory_date || m.created_at || Date.now());
        return d.getFullYear().toString() === selectedYear;
      });
    }

    // Sort strictly chronological descending
    filtered.sort((a, b) => {
      const dateA = new Date(a.memory_date || a.created_at || 0).getTime();
      const dateB = new Date(b.memory_date || b.created_at || 0).getTime();
      return dateB - dateA;
    });

    const groups = {};
    filtered.forEach(m => {
      const dateObj = new Date(m.memory_date || m.created_at || Date.now());
      const year = dateObj.getFullYear();
      const monthName = dateObj.toLocaleString('en-US', { month: 'long' });

      if (!groups[year]) groups[year] = {};
      if (!groups[year][monthName]) groups[year][monthName] = [];
      groups[year][monthName].push(m);
    });

    return { groupedTimeline: groups, availableYears: yearsList };
  }, [memories, selectedCategory, selectedYear]);

  const yearKeys = Object.keys(groupedTimeline).sort((a, b) => b - a);

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Chronological Timeline
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Your life story organized chronologically by Year, Month, and Day.
          </p>
        </div>

        <Button onClick={onOpenAddModal} className="flex items-center gap-1.5 shadow-sm">
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Moment</span>
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Year Filter */}
        {availableYears.length > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold focus:outline-none"
            >
              <option value="All">All Years</option>
              {availableYears.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Timeline Stream */}
      {loading ? (
        <div className="space-y-6">
          <Skeleton variant="card" className="h-40" />
          <Skeleton variant="card" className="h-40" />
          <Skeleton variant="card" className="h-40" />
        </div>
      ) : yearKeys.length === 0 ? (
        <div className="p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
          <EmptyState
            title="No timeline events found"
            description="Add your milestones, childhood stories, or recent trips to build your chronological timeline."
            actionText="Record First Moment"
            onAction={onOpenAddModal}
          />
        </div>
      ) : (
        <div className="space-y-12">
          {yearKeys.map(year => (
            <div key={year} className="relative">
              {/* Year Header Marker */}
              <div className="sticky top-16 z-20 inline-block bg-indigo-600 text-white font-extrabold text-sm px-4 py-1.5 rounded-full shadow-md mb-6">
                {year}
              </div>

              <div className="relative pl-6 sm:pl-8 border-l-2 border-indigo-200 dark:border-slate-800 ml-4 sm:ml-5 space-y-8">
                {Object.keys(groupedTimeline[year]).map(month => (
                  <div key={month} className="space-y-4">
                    {/* Month Indicator */}
                    <div className="relative flex items-center gap-2 -ml-[31px] sm:-ml-[39px]">
                      <div className="w-3.5 h-3.5 rounded-full bg-indigo-500 border-4 border-slate-50 dark:border-slate-950 shadow-sm" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {month}
                      </span>
                    </div>

                    {/* Memories in Month */}
                    <div className="space-y-4">
                      {groupedTimeline[year][month].map(memory => {
                        const hasMedia = memory.media && memory.media.length > 0;
                        const mediaItem = hasMedia ? memory.media[0] : null;
                        const dayNum = new Date(memory.memory_date).getDate();

                        return (
                          <div
                            key={memory.id}
                            onClick={() => onSelectMemory?.(memory)}
                            className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/40 hover:shadow-md transition cursor-pointer group"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                              {/* Thumbnail */}
                              {hasMedia && (
                                <div className="sm:w-36 h-28 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 border border-slate-200 dark:border-slate-700">
                                  {mediaItem.file_type === 'video' ? (
                                    <video src={mediaItem.url} className="w-full h-full object-cover" />
                                  ) : (
                                    <img src={mediaItem.url} alt={memory.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                                  )}
                                </div>
                              )}

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                      {month} {dayNum}
                                    </span>
                                    <Badge variant="secondary">{memory.category || 'Personal'}</Badge>
                                  </div>
                                  {memory.is_favorite && (
                                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500 flex-shrink-0" />
                                  )}
                                </div>

                                <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                                  {memory.title}
                                </h3>

                                {memory.description && (
                                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                    {memory.description}
                                  </p>
                                )}

                                <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-400">
                                  {memory.location && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      <span>{memory.location}</span>
                                    </div>
                                  )}
                                  {Array.isArray(memory.tags) && memory.tags.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Tag className="w-3 h-3" />
                                      <span>{memory.tags.join(', ')}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
