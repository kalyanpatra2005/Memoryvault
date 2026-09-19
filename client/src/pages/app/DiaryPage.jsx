import React, { useState, useEffect, useRef } from 'react';
import { memoryService } from '../../services/memoryService';
import { 
  BookOpen, Calendar, Camera, Save, Trash2, 
  Search, X, Check, Loader2, Edit3, Plus, ArrowLeft
} from 'lucide-react';
import Button from '../../components/ui/Button';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';

export default function DiaryPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'archive'

  // Form state
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [entryTitle, setEntryTitle] = useState('');
  const [entryContent, setEntryContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadDiaryEntries();
  }, [searchQuery]);

  const loadDiaryEntries = async () => {
    setLoading(true);
    try {
      const data = await memoryService.getDiaryEntries({ search: searchQuery });
      setEntries(data);

      // Check if there is an existing entry for entryDate
      const existing = data.find(e => (e.entry_date || '').startsWith(entryDate));
      if (existing && !editingId) {
        setEntryTitle(existing.title || '');
        setEntryContent(existing.content || '');
        setEditingId(existing.id);
        if (existing.media) {
          setFilePreviews(existing.media.map(m => m.url));
        }
      }
    } catch (err) {
      console.error('Error loading diary entries', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (newDate) => {
    setEntryDate(newDate);
    const existing = entries.find(e => (e.entry_date || '').startsWith(newDate));
    if (existing) {
      setEntryTitle(existing.title || '');
      setEntryContent(existing.content || '');
      setEditingId(existing.id);
      setFilePreviews((existing.media || []).map(m => m.url));
      setSelectedFiles([]);
    } else {
      setEntryTitle('');
      setEntryContent('');
      setEditingId(null);
      setFilePreviews([]);
      setSelectedFiles([]);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setSelectedFiles(prev => [...prev, ...files]);
    const urls = files.map(f => URL.createObjectURL(f));
    setFilePreviews(prev => [...prev, ...urls]);
  };

  const handleRemovePhoto = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!entryContent.trim()) return;

    setSaving(true);
    try {
      if (editingId) {
        await memoryService.updateDiaryEntry(
          editingId,
          { title: entryTitle, content: entryContent, entry_date: entryDate },
          selectedFiles
        );
      } else {
        const created = await memoryService.createDiaryEntry({
          title: entryTitle,
          content: entryContent,
          entry_date: entryDate,
          files: selectedFiles
        });
        setEditingId(created.id);
      }

      setSaveSuccess(true);
      setSelectedFiles([]);
      setTimeout(() => setSaveSuccess(false), 2500);
      loadDiaryEntries();
    } catch (err) {
      console.error('Save diary error', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await memoryService.deleteDiaryEntry(deleteConfirmId);
      setDeleteConfirmId(null);
      if (editingId === deleteConfirmId) {
        setEntryTitle('');
        setEntryContent('');
        setEditingId(null);
        setFilePreviews([]);
        setSelectedFiles([]);
      }
      loadDiaryEntries();
    } catch (err) {
      console.error('Delete diary error', err);
    }
  };

  const openEntryInEditor = (entry) => {
    setEntryDate(entry.entry_date ? entry.entry_date.split('T')[0] : entryDate);
    setEntryTitle(entry.title || '');
    setEntryContent(entry.content || '');
    setEditingId(entry.id);
    setFilePreviews((entry.media || []).map(m => m.url));
    setSelectedFiles([]);
    setActiveTab('write');
  };

  const formattedHeaderDate = new Date(entryDate).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
      {/* Top Tab Switcher */}
      <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('write')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'write'
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 shadow-sm'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Daily Notebook
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'archive'
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 shadow-sm'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Archive ({entries.length})
          </button>
        </div>

        {activeTab === 'write' && (
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <input 
              type="date"
              value={entryDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-transparent border-none text-stone-700 dark:text-stone-300 font-serif font-semibold focus:outline-none cursor-pointer text-xs"
            />
          </div>
        )}
      </div>

      {/* TAB 1: WRITE NOTEBOOK PAGE */}
      {activeTab === 'write' ? (
        <form onSubmit={handleSave} className="space-y-4 animate-in fade-in duration-200">
          {/* Paper Notebook Container */}
          <div className="paper-card notebook-ruled p-6 sm:p-10 relative overflow-hidden shadow-lg border-stone-200/90 dark:border-stone-800">
            {/* Red left margin decorative rule */}
            <div className="absolute top-0 bottom-0 left-8 sm:left-12 w-px bg-rose-300/40 dark:bg-rose-900/30 pointer-events-none" />

            {/* Notebook Header */}
            <div className="pl-6 sm:pl-8 pb-4 border-b border-stone-200/50 dark:border-stone-800/60 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <span className="font-serif text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
                {formattedHeaderDate}
              </span>
              <span className="font-handwriting text-base text-amber-700 dark:text-amber-400">
                {editingId ? 'Editing entry' : 'Personal Entry'}
              </span>
            </div>

            {/* Content inputs */}
            <div className="pl-6 sm:pl-8 pt-4 space-y-3">
              {/* Optional Entry Title */}
              <input
                type="text"
                value={entryTitle}
                onChange={(e) => setEntryTitle(e.target.value)}
                placeholder="Title (optional, e.g. An unforgettable Sunday morning...)"
                className="w-full bg-transparent font-serif font-bold text-base text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none border-b border-stone-200/60 dark:border-stone-800 pb-1"
              />

              <div className="font-serif italic text-stone-500 dark:text-stone-400 text-sm">
                Dear Diary,
              </div>

              {/* Lined Writing Textarea */}
              <textarea
                required
                rows={10}
                value={entryContent}
                onChange={(e) => setEntryContent(e.target.value)}
                placeholder="Write your thoughts, feelings, stories, and what you lived today..."
                className="w-full bg-transparent font-serif text-sm sm:text-base text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none resize-none leading-8"
              />

              {/* Photos Attached to Diary */}
              {filePreviews.length > 0 && (
                <div className="pt-4 border-t border-stone-200/50 dark:border-stone-800">
                  <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block mb-2 font-serif italic">
                    Memories attached to this day:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filePreviews.map((url, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-paper-100 dark:bg-stone-800 aspect-video shadow-sm">
                        <img src={url} alt="Attached" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-1.5 right-1.5 p-1 bg-rose-600/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition shadow"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-paper-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-700 transition"
            >
              <Camera className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span>Attach Photos ({filePreviews.length})</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex items-center gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(editingId)}
                  className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
                  title="Delete this entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <Button
                type="submit"
                disabled={saving || !entryContent.trim()}
                className="bg-amber-800 hover:bg-amber-900 text-white flex items-center gap-1.5 text-xs font-semibold px-5 shadow-sm"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saveSuccess ? (
                  <Check className="w-4 h-4 text-amber-200" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{saveSuccess ? 'Saved in Diary' : 'Save Entry'}</span>
              </Button>
            </div>
          </div>
        </form>
      ) : (
        /* TAB 2: DIARY ARCHIVE */
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search through past diary entries..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-paper-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              <div className="h-24 bg-stone-200/50 dark:bg-stone-800/50 rounded-2xl animate-pulse" />
              <div className="h-24 bg-stone-200/50 dark:bg-stone-800/50 rounded-2xl animate-pulse" />
            </div>
          ) : entries.length === 0 ? (
            <div className="paper-card p-12 text-center">
              <BookOpen className="w-10 h-10 mx-auto text-amber-700/60 dark:text-amber-400/60 mb-2" />
              <h3 className="font-serif text-base font-semibold text-stone-900 dark:text-stone-100">
                {searchQuery ? 'No matching diary entries' : 'Your diary archive is clean'}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
                {searchQuery ? 'Try another search keyword.' : 'Write your first diary entry today.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setActiveTab('write')}
                  className="mt-4 px-4 py-2 rounded-xl bg-amber-800 text-white text-xs font-semibold shadow"
                >
                  Write First Entry
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map(entry => (
                <div
                  key={entry.id}
                  onClick={() => openEntryInEditor(entry)}
                  className="paper-card notebook-ruled p-5 cursor-pointer hover:border-amber-400/60 transition group"
                >
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-amber-400 transition">
                      {new Date(entry.entry_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    {entry.media && entry.media.length > 0 && (
                      <span className="text-[11px] text-stone-400 flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        <span>{entry.media.length}</span>
                      </span>
                    )}
                  </div>

                  {entry.title && (
                    <h4 className="font-serif text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      {entry.title}
                    </h4>
                  )}

                  <p className="font-serif text-xs text-stone-600 dark:text-stone-400 line-clamp-3 leading-relaxed">
                    {entry.content}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-stone-400">
                    <span className="italic font-serif">Click to read or edit</span>
                    <span className="font-mono text-[10px]">&rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Delete this diary entry?"
        message="This written memory and all attached photographs will be permanently removed from your private cloud vault."
        confirmText="Delete Entry"
        type="danger"
      />
    </div>
  );
}
