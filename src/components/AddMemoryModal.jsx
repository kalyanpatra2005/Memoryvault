import React, { useState, useRef, useEffect } from 'react';
import { memoryService } from '../services/memoryService';
import { 
  X, UploadCloud, Calendar, Tag, Heart, Image as ImageIcon, 
  MapPin, AlertCircle, CheckCircle2, Loader2, Trash2
} from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';

const CATEGORIES = [
  'Personal', 'Family', 'Travel', 'Milestone', 'Work', 'Special Moment'
];

export default function AddMemoryModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const isEditing = Boolean(initialData);

  const [title, setTitle] = useState('');
  const [memoryDate, setMemoryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Personal');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isVideo, setIsVideo] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setMemoryDate(initialData.memory_date ? initialData.memory_date.split('T')[0] : new Date().toISOString().split('T')[0]);
      setCategory(initialData.category || 'Personal');
      setDescription(initialData.description || '');
      setLocation(initialData.location || '');
      setTagsInput(Array.isArray(initialData.tags) ? initialData.tags.join(', ') : '');
      setIsFavorite(Boolean(initialData.is_favorite));
      if (initialData.media && initialData.media.length > 0) {
        setPreviewUrl(initialData.media[0].url);
        setIsVideo(initialData.media[0].file_type === 'video');
      } else {
        setPreviewUrl('');
        setFile(null);
      }
    } else {
      setTitle('');
      setMemoryDate(new Date().toISOString().split('T')[0]);
      setCategory('Personal');
      setDescription('');
      setLocation('');
      setTagsInput('');
      setIsFavorite(false);
      setFile(null);
      setPreviewUrl('');
      setIsVideo(false);
    }
    setError('');
    setSuccess(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError('');
    setFile(selectedFile);

    const isVid = selectedFile.type?.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(selectedFile.name);
    setIsVideo(isVid);

    const objUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objUrl);

    if (!title.trim() && !isEditing) {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      const isVid = droppedFile.type?.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(droppedFile.name);
      setIsVideo(isVid);
      const objUrl = URL.createObjectURL(droppedFile);
      setPreviewUrl(objUrl);

      if (!title.trim() && !isEditing) {
        const cleanName = droppedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreviewUrl('');
    setIsVideo(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      const tags = tagsInput
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);

      if (isEditing) {
        await memoryService.updateMemory(
          initialData.id,
          {
            title: title.trim(),
            description: description.trim() || null,
            memory_date: memoryDate,
            category,
            location: location.trim() || null,
            tags,
            is_favorite: isFavorite
          },
          file
        );
      } else {
        await memoryService.createMemory({
          title: title.trim(),
          description: description.trim() || null,
          memory_date: memoryDate,
          category,
          location: location.trim() || null,
          tags,
          is_favorite: isFavorite,
          file
        });
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
        onClose();
      }, 700);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save memory. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {isEditing ? 'Edit Memory' : 'Create New Memory'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900/60">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-900/60">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{isEditing ? 'Memory updated successfully!' : 'Memory saved to your private vault!'}</span>
            </div>
          )}

          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Memory Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Trip to the Swiss Alps, Lily's Graduation"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>

          {/* Date & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date of Memory
              </label>
              <input
                type="date"
                value={memoryDate}
                onChange={(e) => setMemoryDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description / Story */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Story / Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this moment, what made it special, who was there..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Location & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Location (optional)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Paris, Home, Central Park"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="family, summer, happy"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* File Upload Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              Photo / Media
            </label>

            {previewUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center max-h-48 group">
                {isVideo ? (
                  <video src={previewUrl} controls className="max-h-48 w-full object-contain" />
                ) : (
                  <img src={previewUrl} alt="Preview" className="max-h-48 w-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg opacity-90 hover:opacity-100 transition shadow"
                  title="Remove image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-700/80 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-500/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition group"
              >
                <UploadCloud className="w-7 h-7 mx-auto text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition" />
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Click or drag photo / video here
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  PNG, JPG, WEBP, or MP4
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Favorite Toggle */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <Heart
                className={`w-4 h-4 transition ${
                  isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                }`}
              />
              <span>Mark as favorite</span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isEditing ? 'Save Changes' : 'Save Memory'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
