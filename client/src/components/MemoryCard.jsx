import React from 'react';
import { Calendar, MapPin, Heart, Play, Image as ImageIcon } from 'lucide-react';
import Badge from './ui/Badge';

export default function MemoryCard({
  memory,
  onClick,
  onToggleFavorite,
}) {
  if (!memory) return null;

  const media = memory.media?.[0];
  const isVideo = media?.file_type === 'video' || (media?.url && /\.(mp4|webm|mov)$/i.test(media.url));
  const mediaUrl = media?.url;

  const formatDate = (val) => {
    if (!val) return '';
    try {
      const d = new Date(val);
      return isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return '';
    }
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onToggleFavorite?.(memory.id, memory.is_favorite);
  };

  return (
    <div
      onClick={() => onClick?.(memory)}
      className="saas-card-interactive overflow-hidden flex flex-col justify-between cursor-pointer group select-none"
    >
      <div>
        {/* Media Thumbnail */}
        <div className="h-44 sm:h-48 w-full bg-slate-100 dark:bg-slate-900 relative overflow-hidden flex items-center justify-center">
          {mediaUrl ? (
            isVideo ? (
              <div className="w-full h-full relative">
                <video src={mediaUrl} className="w-full h-full object-cover" preload="metadata" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white flex items-center justify-center shadow">
                    <Play className="w-4 h-4 ml-0.5 fill-current" />
                  </div>
                </div>
              </div>
            ) : (
              <img
                src={mediaUrl}
                alt={memory.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            )
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 p-4">
              <Calendar className="w-8 h-8 mb-1" />
              <span className="text-[11px] font-mono">Recorded Moment</span>
            </div>
          )}

          {/* Favorite Button */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            aria-label={memory.is_favorite ? "Remove from favorites" : "Add to favorites"}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-400 hover:text-rose-500 shadow-sm transition hover:scale-110"
          >
            <Heart className={`w-4 h-4 ${memory.is_favorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <Badge category={memory.category} />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {formatDate(memory.memory_date)}
            </span>
          </div>

          <h4 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
            {memory.title}
          </h4>

          {memory.description && (
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {memory.description}
            </p>
          )}
        </div>
      </div>

      {/* Footer Location or Tags */}
      {memory.location && (
        <div className="px-4 sm:px-5 py-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
          <span className="truncate">{memory.location}</span>
        </div>
      )}
    </div>
  );
}
