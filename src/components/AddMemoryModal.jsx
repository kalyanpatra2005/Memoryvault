import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { vaultEngine } from '../services/vaultEngine';
import { 
  X, UploadCloud, Calendar, Tag, Heart, Image as ImageIcon, 
  Film, Sparkles, AlertCircle, CheckCircle2, Lock
} from 'lucide-react';

const CATEGORIES = [
  'Personal', 'Family', 'Travel', 'Milestone', 'Love', 'Special Moment'
];

export default function AddMemoryModal({ isOpen, onClose, onSuccess }) {
  const { user, token } = useAuth();
  const [title, setTitle] = useState('');
  const [memoryDate, setMemoryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Personal');
  const [notes, setNotes] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isVideo, setIsVideo] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError('');
    setFile(selectedFile);

    const isVid = selectedFile.type?.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(selectedFile.name);
    setIsVideo(isVid);

    const objUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objUrl);

    if (!title.trim()) {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      const isVid = droppedFile.type?.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(droppedFile.name);
      setIsVideo(isVid);
      const objUrl = URL.createObjectURL(droppedFile);
      setPreviewUrl(objUrl);

      if (!title.trim()) {
        const cleanName = droppedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for this memory.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const tags = isFavorite ? ['favorite', category.toLowerCase()] : [category.toLowerCase()];
      const caption = notes.trim() ? `${title.trim()}\n\n${notes.trim()}` : title.trim();

      const savedItem = await vaultEngine.uploadVaultItem(
        token,
        user?.id || 'guest',
        file || null,
        caption,
        memoryDate || new Date().toISOString().split('T')[0],
        tags.join(','),
        category,
        user?.email || ''
      );

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.(savedItem);
        handleClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to save memory', err);
      const msg = err?.message && !err.message.includes('JSON')
        ? err.message
        : 'Failed to vault memory. Please try again.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (previewUrl) {
      try { URL.revokeObjectURL(previewUrl); } catch (e) {}
    }
    setTitle('');
    setNotes('');
    setFile(null);
    setPreviewUrl('');
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-xl rounded-3xl bg-stone-900 border border-amber-500/30 p-6 sm:p-8 shadow-2xl shadow-amber-950/40 text-stone-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-100 font-sans tracking-tight">
                Vault a New Memory
              </h2>
              <p className="text-xs text-stone-400 font-sans">
                Permanent, private, and synced across all your devices
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Memory preserved forever into your cloud vault!</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5 font-mono">
              Memory Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Mountain Sunset at Lake Tahoe"
              className="w-full px-4 py-3 bg-stone-950/80 border border-stone-700/80 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 text-sm transition"
            />
          </div>

          {/* Date & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5 font-mono flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Date of Memory</span>
              </label>
              <input
                type="date"
                value={memoryDate}
                onChange={(e) => setMemoryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-950/80 border border-stone-700/80 rounded-xl text-stone-100 focus:outline-none focus:border-amber-400 text-sm transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5 font-mono flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Category</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-950/80 border border-stone-700/80 rounded-xl text-stone-100 focus:outline-none focus:border-amber-400 text-sm transition cursor-pointer"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="bg-stone-900 text-stone-100">{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Photo / Video Upload Zone */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5 font-mono flex items-center justify-between">
              <span>Attach Photograph or Video</span>
              <span className="text-[10px] text-stone-400 lowercase font-sans">Optional</span>
            </label>

            {previewUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-amber-500/40 bg-stone-950 max-h-48 group flex items-center justify-center">
                {isVideo ? (
                  <video src={previewUrl} controls className="max-h-48 w-full object-contain" />
                ) : (
                  <img src={previewUrl} alt="Preview" className="max-h-48 w-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl('');
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-stone-900/90 text-stone-300 hover:text-rose-400 hover:bg-stone-800 transition shadow"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-stone-700 hover:border-amber-400/60 rounded-2xl p-6 text-center bg-stone-950/40 hover:bg-stone-950/70 transition group"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-400 flex items-center justify-center mx-auto mb-2.5 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-xs font-medium text-stone-200">
                  Click to browse or drop photo / video here
                </p>
                <p className="text-[11px] text-stone-400 mt-1">
                  JPG, PNG, WebP, MP4, MOV up to 250MB (auto-optimized)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,.mp4,.mov,.webm"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Story / Description Textarea */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5 font-mono">
              The Story / Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What made this moment unforgettable? Write down the people, place, or feelings..."
              className="w-full px-4 py-2.5 bg-stone-950/80 border border-stone-700/80 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400 text-sm transition resize-none"
            />
          </div>

          {/* Favorite Toggle & Security note */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                isFavorite 
                  ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-sm' 
                  : 'border-stone-800 text-stone-400 hover:text-stone-300'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>{isFavorite ? 'Bookmarked as Favorite' : 'Mark as Favorite'}</span>
            </button>

            <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Isolated to your account</span>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-300 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:brightness-110 text-stone-950 font-bold text-sm shadow-lg shadow-amber-950/50 transition border border-amber-400/40 flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                  <span>Vaulting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-stone-950" />
                  <span>Preserve Memory</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
