import React, { useState, useEffect } from 'react';
import { memoryService } from '../services/memoryService';
import { Search, X, BookOpen, Heart, Hourglass, Calendar, MapPin } from 'lucide-react';

export default function SearchModal({ 
  isOpen, 
  onClose, 
  onSelectMemory, 
  onSelectDiary, 
  onSelectCapsule 
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ memories: [], diaries: [], capsules: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ memories: [], diaries: [], capsules: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await memoryService.searchAll(query);
        setResults(res);
      } catch (e) {
        console.error('Search error', e);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults = results.memories.length + results.diaries.length + results.capsules.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-paper-50 dark:bg-paper-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-stone-200/80 dark:border-stone-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-stone-400 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your memories, diary entries, capsules, tags..."
            className="w-full bg-transparent font-serif text-sm sm:text-base text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-stone-400 hover:text-stone-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-sans text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 ml-2"
          >
            Esc
          </button>
        </div>

        {/* Results Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 divide-y divide-stone-100 dark:divide-stone-800">
          {!query.trim() ? (
            <div className="py-8 text-center text-xs text-stone-400 font-serif italic">
              Type keywords, dates, or places to search your private memory book.
            </div>
          ) : loading ? (
            <div className="py-8 text-center text-xs text-stone-400 font-serif italic animate-pulse">
              Searching your private archive...
            </div>
          ) : totalResults === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400 font-serif italic">
              No entries found matching "{query}".
            </div>
          ) : (
            <>
              {/* Memories */}
              {results.memories.length > 0 && (
                <div className="pt-3 first:pt-0">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 dark:text-amber-400 block mb-2 font-sans">
                    Memories ({results.memories.length})
                  </span>
                  <div className="space-y-1.5">
                    {results.memories.map(m => (
                      <div
                        key={m.id}
                        onClick={() => {
                          onSelectMemory?.(m);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl hover:bg-paper-200/70 dark:hover:bg-stone-800/60 transition cursor-pointer flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Heart className="w-4 h-4 text-rose-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-serif font-bold text-stone-900 dark:text-stone-100 truncate">
                              {m.title}
                            </p>
                            <p className="text-[11px] text-stone-400 truncate">
                              {new Date(m.memory_date).toLocaleDateString()} {m.location ? `• ${m.location}` : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Diaries */}
              {results.diaries.length > 0 && (
                <div className="pt-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 dark:text-amber-400 block mb-2 font-sans">
                    Diary Entries ({results.diaries.length})
                  </span>
                  <div className="space-y-1.5">
                    {results.diaries.map(d => (
                      <div
                        key={d.id}
                        onClick={() => {
                          onSelectDiary?.(d);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl hover:bg-paper-200/70 dark:hover:bg-stone-800/60 transition cursor-pointer flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <BookOpen className="w-4 h-4 text-amber-700 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-serif font-bold text-stone-900 dark:text-stone-100 truncate">
                              {d.title || new Date(d.entry_date).toLocaleDateString()}
                            </p>
                            <p className="text-[11px] text-stone-400 truncate">
                              {d.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Time Capsules */}
              {results.capsules.length > 0 && (
                <div className="pt-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 dark:text-amber-400 block mb-2 font-sans">
                    Time Capsules ({results.capsules.length})
                  </span>
                  <div className="space-y-1.5">
                    {results.capsules.map(c => (
                      <div
                        key={c.id}
                        onClick={() => {
                          onSelectCapsule?.(c);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl hover:bg-paper-200/70 dark:hover:bg-stone-800/60 transition cursor-pointer flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Hourglass className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-serif font-bold text-stone-900 dark:text-stone-100 truncate">
                              {c.title}
                            </p>
                            <p className="text-[11px] text-stone-400 truncate">
                              Target: {new Date(c.target_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
