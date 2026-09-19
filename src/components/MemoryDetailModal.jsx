import React from 'react';
import { 
  X, Calendar, Tag, Heart, Download, Trash2, 
  Film, Image as ImageIcon, Sparkles, Lock 
} from 'lucide-react';
import { isVideoMedia } from '../services/vaultEngine';

export default function MemoryDetailModal({ 
  memory, 
  onClose, 
  onDelete, 
  onToggleFavorite, 
  token 
}) {
  if (!memory) return null;

  const isVideo = isVideoMedia(memory);
  const mediaSrc = memory.data_url || memory.media_url || (memory.id && token ? `/api/media/stream/${memory.id}?token=${token}` : '');

  const rawCaption = memory.caption || memory.title || 'Untitled Moment';
  const parts = rawCaption.split('\n\n');
  const title = parts[0] || 'Untitled Moment';
  const description = parts.slice(1).join('\n\n') || memory.description || '';

  const category = memory.category || (memory.tags && memory.tags[0]) || 'Personal';
  
  const isFavorite = memory.is_favorite || 
    (Array.isArray(memory.tags) && memory.tags.includes('favorite')) ||
    (typeof memory.tags === 'string' && memory.tags.includes('favorite'));

  const formatDate = (val) => {
    if (!val) return '';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString(undefined, {
        dateStyle: 'full'
      });
    } catch (e) {
      return '';
    }
  };

  const formattedDate = formatDate(memory.memory_date || memory.created_at);

  const handleDelete = () => {
    if (window.confirm('Delete this memory permanently?')) {
      onDelete?.(memory.id);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl rounded-3xl bg-stone-900 border border-amber-500/30 shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-800/40">
              {category}
            </span>
            <div className="flex items-center gap-1 text-xs text-stone-400 font-mono">
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              <span>{formattedDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite?.(memory)}
              className="p-2 rounded-xl bg-stone-900 text-stone-300 hover:text-amber-400 border border-stone-800 transition"
              title="Toggle Favorite"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
            {mediaSrc && (
              <a
                href={mediaSrc}
                download={`timememory-${memory.id || 'export'}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-stone-900 text-stone-300 hover:text-amber-300 border border-stone-800 transition"
                title="Download file"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={handleDelete}
              className="p-2 rounded-xl bg-stone-900 text-stone-400 hover:text-rose-400 border border-stone-800 transition"
              title="Delete memory"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-900 text-stone-400 hover:text-stone-100 border border-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media display area */}
        {mediaSrc && (
          <div className="bg-black flex items-center justify-center max-h-[55vh] overflow-hidden border-b border-stone-800/80">
            {isVideo ? (
              <video src={mediaSrc} controls autoPlay className="max-h-[55vh] w-full object-contain" />
            ) : (
              <img src={mediaSrc} alt={title} className="max-h-[55vh] w-full object-contain" />
            )}
          </div>
        )}

        {/* Content details */}
        <div className="p-6 sm:p-8 bg-stone-900">
          <h2 className="text-2xl font-bold font-sans text-stone-100">
            {title}
          </h2>

          {description ? (
            <p className="mt-4 text-stone-300 text-sm leading-relaxed whitespace-pre-wrap font-serif">
              {description}
            </p>
          ) : (
            <p className="mt-3 text-xs text-stone-500 italic">No additional story attached to this moment.</p>
          )}

          <div className="mt-6 pt-4 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400 font-mono">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>TimeMemory Protected & Synced</span>
            </div>
            <span>ID: {memory.id || 'local'}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
