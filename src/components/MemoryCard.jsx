import React from 'react';
import { Play, Calendar, Heart, Trash2, Maximize2, Tag, Film, Image as ImageIcon } from 'lucide-react';
import { isVideoMedia } from '../services/vaultEngine';

const CATEGORY_STYLES = {
  Personal:  { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/30' },
  Travel:    { bg: 'bg-sky-500/10',    text: 'text-sky-300',    border: 'border-sky-500/30' },
  Family:    { bg: 'bg-rose-500/10',   text: 'text-rose-300',   border: 'border-rose-500/30' },
  Milestone: { bg: 'bg-emerald-500/10',text: 'text-emerald-300',border: 'border-emerald-500/30' },
  Love:      { bg: 'bg-pink-500/10',   text: 'text-pink-300',   border: 'border-pink-500/30' },
  Other:     { bg: 'bg-stone-500/10',  text: 'text-stone-300',  border: 'border-stone-500/30' },
};

export default function MemoryCard({ 
  memory, 
  onView, 
  onDelete, 
  onToggleFavorite, 
  token,
  compact = false 
}) {
  if (!memory) return null;

  const isVideo = isVideoMedia(memory);
  const mediaSrc = memory.data_url || memory.media_url || (memory.id && token ? `/api/media/stream/${memory.id}?token=${token}` : '');
  
  // Extract title and description
  const rawCaption = memory.caption || memory.title || 'Untitled Moment';
  const parts = rawCaption.split('\n\n');
  const title = parts[0] || 'Untitled Moment';
  const description = parts.slice(1).join('\n\n') || memory.description || '';

  const category = memory.category || (memory.tags && memory.tags[0]) || 'Personal';
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.Other;
  
  const isFavorite = memory.is_favorite || 
    (Array.isArray(memory.tags) && memory.tags.includes('favorite')) ||
    (typeof memory.tags === 'string' && memory.tags.includes('favorite'));

  const formatDate = (val) => {
    if (!val) return '';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return '';
    }
  };

  const formattedDate = formatDate(memory.memory_date || memory.created_at);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Delete this memory permanently? This cannot be undone.')) {
      onDelete?.(memory.id);
    }
  };

  const handleFavorite = (e) => {
    e.stopPropagation();
    onToggleFavorite?.(memory);
  };

  if (compact) {
    return (
      <div
        onClick={() => onView?.(memory)}
        className="glass-card rounded-2xl p-3.5 flex items-center gap-3.5 cursor-pointer group hover:border-amber-500/40 transition-all"
      >
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-950 flex-shrink-0 relative border border-stone-800">
          {mediaSrc ? (
            isVideo ? (
              <div className="w-full h-full relative flex items-center justify-center bg-stone-900">
                <Film className="w-6 h-6 text-amber-400/80" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Play className="w-4 h-4 text-white fill-white/80" />
                </div>
              </div>
            ) : (
              <img src={mediaSrc} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-950/40 to-stone-900 text-amber-400">
              <Calendar className="w-5 h-5 opacity-70" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-stone-100 truncate group-hover:text-amber-200 transition">
              {title}
            </h4>
            {formattedDate && (
              <span className="text-[11px] text-stone-400 flex-shrink-0 font-mono">
                {formattedDate}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-stone-400 line-clamp-1 mt-0.5">
              {description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${style.bg} ${style.text} ${style.border}`}>
              {category}
            </span>
            {isVideo && (
              <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                <Play className="w-2.5 h-2.5 fill-amber-400" /> Video
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onView?.(memory)}
      className="glass-card rounded-2xl overflow-hidden cursor-pointer group flex flex-col justify-between"
    >
      <div>
        {/* Media Preview / Visual Header */}
        <div className="h-48 sm:h-52 w-full overflow-hidden relative bg-stone-950 border-b border-stone-800/80">
          {mediaSrc ? (
            isVideo ? (
              <div className="w-full h-full relative flex items-center justify-center bg-stone-950">
                <video src={mediaSrc} className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-amber-500/90 text-stone-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 ml-0.5 fill-stone-950" />
                  </div>
                </div>
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm border border-white/10 text-[11px] font-mono text-amber-300 flex items-center gap-1">
                  <Film className="w-3 h-3 text-amber-400" />
                  <span>Video</span>
                </div>
              </div>
            ) : (
              <div className="w-full h-full relative overflow-hidden">
                <img
                  src={mediaSrc}
                  alt={title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm border border-white/10 text-[11px] font-mono text-stone-300 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-amber-400" />
                  <span>Photo</span>
                </div>
              </div>
            )
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-950/30 via-stone-900 to-stone-950 flex flex-col items-center justify-center p-6 text-center">
              <Calendar className="w-10 h-10 text-amber-500/40 mb-2" />
              <p className="text-xs text-stone-400 font-serif italic">Recorded Moment</p>
            </div>
          )}

          {/* Quick Favorite Button */}
          <button
            onClick={handleFavorite}
            className="absolute top-3 right-3 p-2 rounded-xl bg-stone-950/70 backdrop-blur-md border border-white/10 text-stone-300 hover:text-amber-400 hover:scale-110 transition shadow"
            title={isFavorite ? 'Remove Favorite' : 'Save as Favorite'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className={`text-[11px] px-2.5 py-0.5 rounded-lg font-medium border ${style.bg} ${style.text} ${style.border}`}>
              {category}
            </span>
            {formattedDate && (
              <span className="text-xs text-stone-400 font-mono flex items-center gap-1">
                <Calendar className="w-3 h-3 text-stone-500" />
                <span>{formattedDate}</span>
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-stone-100 group-hover:text-amber-200 transition line-clamp-1">
            {title}
          </h3>

          {description && (
            <p className="text-xs text-stone-400 mt-2 line-clamp-2 leading-relaxed font-sans">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="px-4 sm:px-5 py-3 border-t border-stone-800/80 bg-stone-950/40 flex items-center justify-between text-xs text-stone-400">
        <span className="inline-flex items-center gap-1 text-stone-400 group-hover:text-stone-300 transition">
          <Maximize2 className="w-3.5 h-3.5" />
          <span>View Details</span>
        </span>

        {onDelete && (
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg hover:bg-rose-950/50 text-stone-500 hover:text-rose-400 transition"
            title="Delete memory"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
