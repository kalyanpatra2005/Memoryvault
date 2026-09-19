import React, { useState } from 'react';
import { memoryService } from '../services/memoryService';
import { Hourglass, Calendar, Image as ImageIcon, X, Loader2, Lock, Trash2 } from 'lucide-react';
import Button from './ui/Button';

export default function CreateCapsuleModal({ isOpen, onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState(() => {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    return nextYear.toISOString().split('T')[0];
  });
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for this capsule.');
      return;
    }
    if (!targetDate) {
      setError('Please select a destination date.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await memoryService.createTimeCapsule({
        title,
        message,
        target_date: targetDate,
        file
      });

      onSuccess?.();
      onClose();
      setTitle('');
      setMessage('');
      setFile(null);
      setPreviewUrl('');
    } catch (err) {
      console.error('Create capsule error', err);
      setError(err.message || 'Failed to create time capsule.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-paper-50 dark:bg-paper-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hourglass className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
              Seal a Time Capsule
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Capsule Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Graduation Day, Next Birthday, My 5-Year Goal"
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-serif"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              Target Destination Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Letter or Message to Your Future Self (optional)
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What do you want to remember? What are your hopes or promises for that day?"
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-serif resize-none"
            />
          </div>

          {/* Photo attachment */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-stone-400" />
              Attach Sealed Photograph (optional)
            </label>

            {previewUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 aspect-video max-h-36">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setFile(null); setPreviewUrl(''); }}
                  className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded-lg opacity-90 hover:opacity-100 transition shadow"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-xl p-3.5 text-center cursor-pointer hover:border-amber-500/60 block transition group">
                <span className="text-xs text-stone-600 dark:text-stone-400 font-serif">
                  Click to attach a picture for the future
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200/80 dark:border-stone-800">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-amber-800 hover:bg-amber-900 text-white flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>Seal Time Capsule</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
