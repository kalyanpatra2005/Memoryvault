import React, { useState } from 'react';
import { 
  X, Calendar, MapPin, Tag, Heart, Edit3, Trash2, 
  Share2, Shield, Download, Check
} from 'lucide-react';
import Button from './ui/Button';
import Badge from './ui/Badge';
import ConfirmationDialog from './ui/ConfirmationDialog';

export default function MemoryDetailModal({ 
  isOpen, 
  onClose, 
  memory, 
  onEdit, 
  onDelete, 
  onToggleFavorite 
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !memory) return null;

  const mediaItem = memory.media && memory.media.length > 0 ? memory.media[0] : null;
  const mediaUrl = mediaItem?.url || mediaItem?.data_url || memory.image_url;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = memory.memory_date ? new Date(memory.memory_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Undated';

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{memory.category || 'Personal'}</Badge>
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <Shield className="w-3 h-3" />
                <span>Private & Encrypted</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onToggleFavorite?.(memory.id, !memory.is_favorite)}
                className="p-2 text-slate-400 hover:text-rose-500 rounded-lg transition"
                title={memory.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart className={`w-5 h-5 ${memory.is_favorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
              <button
                onClick={() => onEdit?.(memory)}
                className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg transition"
                title="Edit memory"
              >
                <Edit3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition"
                title="Delete memory"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Media Preview if exists */}
          {mediaItem && (
            <div className="bg-slate-100 dark:bg-slate-950 flex items-center justify-center max-h-96 overflow-hidden border-b border-slate-100 dark:border-slate-800">
              {mediaItem.file_type === 'video' ? (
                <video 
                  src={mediaUrl} 
                  controls 
                  className="max-h-96 w-full object-contain"
                />
              ) : (
                <img 
                  src={mediaUrl} 
                  alt={memory.title} 
                  onError={(e) => {
                    if (mediaItem?.data_url && e.currentTarget.src !== mediaItem.data_url) {
                      e.currentTarget.src = mediaItem.data_url;
                    }
                  }}
                  className="max-h-96 w-full object-contain" 
                />
              )}
            </div>
          )}

          {/* Content Body */}
          <div className="p-6 space-y-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {memory.title}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{formattedDate}</span>
                </div>
                {memory.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>{memory.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description / Story */}
            {memory.description ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/80">
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {memory.description}
                </p>
              </div>
            ) : (
              <p className="text-xs italic text-slate-400">No written story attached to this memory.</p>
            )}

            {/* Tags */}
            {Array.isArray(memory.tags) && memory.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <Tag className="w-3.5 h-3.5 text-slate-400 mr-1" />
                {memory.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Added {memory.created_at ? new Date(memory.created_at).toLocaleDateString() : 'recently'}
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={handleShare} className="flex items-center gap-1.5">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? 'Link Copied' : 'Share'}</span>
              </Button>
              <Button size="sm" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete?.(memory.id);
          onClose();
        }}
        title="Delete this memory?"
        message="This memory and any associated media will be permanently deleted from your private vault. This action cannot be undone."
        confirmText="Delete Memory"
        type="danger"
      />
    </>
  );
}
