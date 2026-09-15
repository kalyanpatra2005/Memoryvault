import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { vaultEngine } from '../services/vaultEngine';
import { 
  BookOpen, Feather, Volume2, VolumeX, Flame, Heart, CloudRain, 
  Calendar, Trash2, Eye, Plus, Sparkles, Image as ImageIcon, Search, Lock,
  UploadCloud, X, Camera, Edit3, Save, Check, Maximize2, Download, ZoomIn
} from 'lucide-react';

const MOODS = [
  { id: 'Nostalgia', label: 'Nostalgia', icon: '🕰️', desc: 'Longing for the past' },
  { id: 'Unspoken Words', label: 'Unspoken Words', icon: '🥀', desc: 'Things left unsaid' },
  { id: 'Bittersweet', label: 'Bittersweet', icon: '🍂', desc: 'Joy mingled with ache' },
  { id: 'Solitude', label: 'Solitude', icon: '🕯️', desc: 'Quiet midnight thoughts' },
  { id: 'Heartbreak', label: 'Heartbreak', icon: '💔', desc: 'A wound time holds' },
  { id: 'Lost in Time', label: 'Lost in Time', icon: '⏳', desc: 'Memories fading away' },
  { id: 'Glimmer of Hope', label: 'Glimmer of Hope', icon: '✨', desc: 'Light in the dark' }
];

const WEATHERS = [
  'Rainy Night', 'Distant Thunderstorm', 'Foggy Twilight', 'Autumn Wind', 'Midnight Silence', 'Cold Winter Dawn'
];

export default function DiaryPage() {
  const { token, user, authFetch } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // New entry form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('Unspoken Words');
  const [weather, setWeather] = useState('Rainy Night');
  const [imageUrl, setImageUrl] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [filterMood, setFilterMood] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const photoFileInputRef = useRef(null);

  // Selected entry for reading modal
  const [activeReadingEntry, setActiveReadingEntry] = useState(null);

  // Full photo view modal state
  const [fullPhotoModal, setFullPhotoModal] = useState(null);

  // Editing state for saved page in archive
  const [editingEntry, setEditingEntry] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editMood, setEditMood] = useState('Nostalgia');
  const [editWeather, setEditWeather] = useState('Rainy Night');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editPhotoUploading, setEditPhotoUploading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const editPhotoFileInputRef = useRef(null);

  // Ambient rain audio generator via Web Audio API
  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const noiseNodeRef = useRef(null);

  useEffect(() => {
    fetchEntries();
    return () => {
      stopAmbientSound();
    };
  }, []);

  const fetchEntries = async () => {
    try {
      let serverEntries = [];
      try {
        const res = await authFetch('/api/diary');
        if (res.ok) {
          const data = await res.json();
          serverEntries = data.entries || [];
        }
      } catch (e) {}

      let localEntries = [];
      try {
        localEntries = await vaultEngine.getDiaries(token, user?.id || 'guest');
      } catch (e) {}

      // Combine server & local entries safely
      const map = new Map();
      serverEntries.forEach(item => map.set(String(item.id), item));
      localEntries.forEach(item => {
        if (!map.has(String(item.id))) {
          map.set(String(item.id), item);
        }
      });

      const list = Array.from(map.values());
      list.sort((a, b) => new Date(b.created_at || b.entry_date) - new Date(a.created_at || a.entry_date));
      setEntries(list);
    } catch (err) {
      console.error('Failed to load diary', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to append token if needed for private streaming or pass data URL
  const formatImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }
    if (url.startsWith('/api/media/stream/') && !url.includes('token=')) {
      return `${url}?token=${token}`;
    }
    return url;
  };

  // Direct photo file upload handler for new entry
  const handlePhotoFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoUploading(true);
    let photoUrl = '';

    // 1. Try server upload first
    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('caption', title.trim() || 'Diary Keepsake Photo');
      formData.append('source', 'vault');

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.media && data.media.length > 0) {
          const item = data.media[0];
          photoUrl = `/api/media/stream/${item.id}?token=${token}`;
        }
      }
    } catch (err) {
      console.warn('Server photo upload error, using local vault fallback:', err);
    }

    // 2. Fallback to client-side vaultEngine (IndexedDB / DataURL)
    if (!photoUrl) {
      try {
        const localItem = await vaultEngine.uploadVaultItem(
          token,
          user?.id || 'guest',
          file,
          title.trim() || 'Diary Keepsake Photo',
          new Date().toISOString().split('T')[0],
          'diary'
        );
        photoUrl = localItem.media_url || localItem.data_url;
      } catch (e) {
        console.error('Local vault fallback failed:', e);
      }
    }

    if (photoUrl) {
      setImageUrl(photoUrl);
    } else {
      alert('Could not attach photo. Please ensure it is a valid image file.');
    }

    setPhotoUploading(false);
    if (photoFileInputRef.current) photoFileInputRef.current.value = '';
  };

  // Direct photo file upload handler for edit modal
  const handleEditPhotoFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditPhotoUploading(true);
    let photoUrl = '';

    // 1. Try server upload first
    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('caption', editTitle.trim() || 'Updated Diary Keepsake');
      formData.append('source', 'vault');

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.media && data.media.length > 0) {
          const item = data.media[0];
          photoUrl = `/api/media/stream/${item.id}?token=${token}`;
        }
      }
    } catch (err) {
      console.warn('Server edit photo upload failed, using local vault fallback:', err);
    }

    // 2. Fallback to local vaultEngine
    if (!photoUrl) {
      try {
        const localItem = await vaultEngine.uploadVaultItem(
          token,
          user?.id || 'guest',
          file,
          editTitle.trim() || 'Updated Diary Keepsake',
          new Date().toISOString().split('T')[0],
          'diary'
        );
        photoUrl = localItem.media_url || localItem.data_url;
      } catch (e) {
        console.error('Local vault fallback failed:', e);
      }
    }

    if (photoUrl) {
      setEditImageUrl(photoUrl);
    } else {
      alert('Could not attach photo. Please ensure it is a valid image file.');
    }

    setEditPhotoUploading(false);
    if (editPhotoFileInputRef.current) editPhotoFileInputRef.current.value = '';
  };

  // Launch Editing Mode for a saved page
  const startEditing = (entry, e) => {
    if (e) e.stopPropagation();
    setEditingEntry(entry);
    setEditTitle(entry.title || '');
    setEditContent(entry.content || '');
    setEditMood(entry.mood || 'Nostalgia');
    setEditWeather(entry.weather || 'Rainy Night');
    setEditImageUrl(entry.image_url || '');
  };

  // Save/Update Edited Entry
  const handleUpdateEntry = async (e) => {
    e.preventDefault();
    if (!editContent.trim()) return;

    setEditSaving(true);
    let updatedEntry = null;

    try {
      const res = await authFetch(`/api/diary/${editingEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim() || 'Untitled Memory',
          content: editContent,
          mood: editMood,
          weather: editWeather,
          image_url: editImageUrl.trim() || null
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.entry) {
          updatedEntry = data.entry;
        }
      }
    } catch (err) {
      console.warn('Server diary update failed, updating local vaultEngine:', err);
    }

    if (!updatedEntry) {
      try {
        updatedEntry = await vaultEngine.saveDiary(token, user?.id || 'guest', {
          title: editTitle.trim() || 'Untitled Memory',
          content: editContent,
          mood: editMood,
          weather: editWeather,
          image_url: editImageUrl.trim() || null
        }, editingEntry.id);
      } catch (e) {
        console.error('Local vaultEngine update failed:', e);
      }
    }

    if (updatedEntry) {
      setEntries(entries.map(item => item.id === editingEntry.id ? updatedEntry : item));
      if (activeReadingEntry?.id === editingEntry.id) {
        setActiveReadingEntry(updatedEntry);
      }
      setEditingEntry(null);
      setSuccessMsg('Page updated and resealed into eternity.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      alert('Could not update diary page.');
    }

    setEditSaving(false);
  };

  // Web Audio ambient rain synthesizer
  const toggleAmbientSound = () => {
    if (ambientPlaying) {
      stopAmbientSound();
      setAmbientPlaying(false);
    } else {
      startAmbientSound();
      setAmbientPlaying(true);
    }
  };

  const startAmbientSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
        b6 = white * 0.115926;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      noiseNodeRef.current = noise;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1100;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNodeRef.current = gain;

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(0);
    } catch (e) {
      console.warn('AudioContext error:', e);
    }
  };

  const stopAmbientSound = () => {
    try {
      if (noiseNodeRef.current) {
        noiseNodeRef.current.stop();
        noiseNodeRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    } catch (e) {
      // ignore
    }
  };

  const handleSaveEntry = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSaving(true);
    let savedEntry = null;

    // 1. Try server save first
    try {
      const res = await authFetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || 'Untitled Memory',
          content,
          mood,
          weather,
          image_url: imageUrl.trim() || null
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.entry) {
          savedEntry = data.entry;
        }
      }
    } catch (err) {
      console.warn('Server diary save failed, falling back to permanent local vault:', err);
    }

    // 2. Fallback to vaultEngine (IndexedDB / LocalStorage)
    if (!savedEntry) {
      try {
        savedEntry = await vaultEngine.saveDiary(token, user?.id || 'guest', {
          title: title.trim() || 'Untitled Memory',
          content,
          mood,
          weather,
          image_url: imageUrl.trim() || null
        });
      } catch (e) {
        console.error('Local vaultEngine save failed:', e);
      }
    }

    if (savedEntry) {
      setEntries([savedEntry, ...entries.filter(it => it.id !== savedEntry.id)]);
      setTitle('');
      setContent('');
      setImageUrl('');
      setSuccessMsg('Your memory has been sealed into eternity.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      alert('Could not save diary page. Please check your inputs.');
    }

    setSaving(false);
  };

  const handleDeleteEntry = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you certain you wish to burn and erase this page forever?')) {
      return;
    }

    try {
      await authFetch(`/api/diary/${id}`, { method: 'DELETE' });
    } catch (err) {}

    try {
      await vaultEngine.deleteDiary(token, id, user?.id || 'guest');
    } catch (err) {}

    setEntries(entries.filter(entry => entry.id !== id));
    if (activeReadingEntry?.id === id) {
      setActiveReadingEntry(null);
    }
    if (editingEntry?.id === id) {
      setEditingEntry(null);
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesMood = filterMood === 'All' || entry.mood === filterMood;
    const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMood && matchesSearch;
  });

  return (
    <div className="min-h-screen pb-20 relative bg-vault-950">
      
      {/* Melancholic Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/40 via-stone-950 to-vault-950" />

      {/* Top Ambience Bar */}
      <div className="relative z-10 border-b border-amber-900/30 bg-stone-950/80 backdrop-blur px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="candle-glow flex items-center space-x-1.5 text-amber-400">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span className="text-xs font-serif italic text-amber-200/90">Sanctuary of Unspoken Truths</span>
          </div>
        </div>

        {/* Rain Soundscape Generator Toggle */}
        <button
          onClick={toggleAmbientSound}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            ambientPlaying 
              ? 'bg-amber-950 text-amber-300 border-amber-600 shadow-sm shadow-amber-900/40' 
              : 'bg-stone-900/80 text-stone-400 border-stone-800 hover:text-amber-200'
          }`}
          title="Toggle soothing rain & storm soundscape"
        >
          {ambientPlaying ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Rain Audio: On</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span>Rain Audio: Off</span>
            </>
          )}
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Header Title */}
        <div className="text-center mb-10">
          <div className="inline-block p-2 rounded-full bg-amber-950/40 border border-amber-800/40 text-amber-400 mb-2">
            <Feather className="w-6 h-6" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold font-antique tracking-wide text-amber-100">
            The Tragic & Beautiful Diary
          </h1>
          <p className="mt-2 text-xs sm:text-sm font-serif italic text-stone-400 max-w-xl mx-auto">
            "Pour your deepest sorrows, secret affections, and forgotten dreams into aged parchment. Permanently private. Sealed forever."
          </p>
        </div>

        {/* MAIN DESK: WRITING ON PARCHMENT */}
        <div className="mb-14">
          <div 
            className="parchment-texture rounded-2xl border-4 border-amber-900/60 p-6 sm:p-12 text-stone-900 shadow-2xl relative overflow-hidden"
            style={{
              borderColor: '#6b4d32'
            }}
          >
            {/* Vintage Watermark & Wax Seal Stamp */}
            <div className="absolute top-4 right-4 sm:top-8 sm:right-8 opacity-75 select-none pointer-events-none">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-red-950/60 bg-red-900/30 flex items-center justify-center rotate-12 shadow-inner">
                <span className="text-[10px] font-antique font-bold uppercase text-red-950 text-center tracking-widest leading-tight">
                  SEALED<br />ETERNAL<br />VAULT
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-6">
              
              {/* Top controls on paper */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-900/20 pb-4">
                <div className="flex items-center space-x-2 text-xs font-serif text-amber-950/80">
                  <Calendar className="w-4 h-4 text-amber-900" />
                  <span>Entry Date: {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  {/* Weather Dropdown */}
                  <div className="flex items-center space-x-1.5 bg-amber-100/70 px-3 py-1 rounded-full border border-amber-800/30 text-amber-950">
                    <CloudRain className="w-3.5 h-3.5 text-amber-900" />
                    <select
                      value={weather}
                      onChange={(e) => setWeather(e.target.value)}
                      className="bg-transparent border-none text-xs text-amber-950 font-serif focus:outline-none cursor-pointer"
                    >
                      {WEATHERS.map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Mood Selection Stamps */}
              <div>
                <label className="block text-xs font-serif font-bold uppercase tracking-widest text-amber-950/80 mb-2">
                  Select Your Emotional State:
                </label>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMood(m.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-serif flex items-center space-x-1.5 transition-all ${
                        mood === m.id
                          ? 'bg-amber-950 text-amber-100 shadow-md scale-105 font-bold border border-amber-800'
                          : 'bg-amber-100/80 text-amber-950 hover:bg-amber-200/90 border border-amber-900/20'
                      }`}
                    >
                      <span>{m.icon}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title input */}
              <div>
                <input
                  type="text"
                  placeholder="Give this memory a title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-amber-900/30 py-2 text-2xl sm:text-3xl font-antique font-bold text-amber-950 placeholder-amber-900/40 focus:outline-none focus:border-amber-900 transition-colors"
                />
              </div>

              {/* Journal textarea with ruled lines and handwritten/literary font */}
              <div className="relative">
                <textarea
                  rows={9}
                  required
                  placeholder="Write freely... Pour out the words you could never say out loud. Nobody else in the world will ever see this page..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-transparent text-base sm:text-lg font-serif text-amber-950 placeholder-amber-900/40 focus:outline-none resize-y leading-8 p-1 selection:bg-amber-300 selection:text-amber-950"
                  style={{
                    lineHeight: '2rem'
                  }}
                />
              </div>

              {/* ATTACHED PHOTO PREVIEW (ANTIQUE KEEPSAKE POLAROID) */}
              {imageUrl && (
                <div className="relative inline-block my-2 p-3 bg-stone-100 rounded-xl shadow-lg border border-amber-900/30 rotate-[-1deg] transition-all">
                  <div className="relative max-h-56 max-w-sm rounded overflow-hidden">
                    <img 
                      src={formatImageUrl(imageUrl)} 
                      alt="Keepsake Snapshot" 
                      className="max-h-56 w-auto object-cover rounded" 
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-rose-900 text-white rounded-full transition shadow-md"
                      title="Remove Photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-[11px] font-serif italic text-stone-600 text-center mt-1.5 flex items-center justify-center space-x-1">
                    <Camera className="w-3 h-3 text-amber-800 inline" />
                    <span>Attached Keepsake Photo</span>
                  </div>
                </div>
              )}

              {/* PHOTO ADD / UPLOAD PHOTO SECTION */}
              <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-amber-900/20">
                <div className="flex flex-wrap items-center gap-3">
                  
                  {/* Hidden file input for Photo Upload */}
                  <input
                    ref={photoFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoFileUpload}
                    className="hidden"
                    id="diary-photo-upload-input"
                  />

                  {/* Direct "Upload Photo" Button */}
                  <button
                    type="button"
                    onClick={() => photoFileInputRef.current?.click()}
                    disabled={photoUploading}
                    className="px-4 py-2 bg-amber-950 text-amber-100 hover:bg-amber-900 rounded-xl text-xs font-serif font-bold shadow-md flex items-center space-x-2 border border-amber-700/60 transition disabled:opacity-50 cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4 text-amber-300" />
                    <span>{photoUploading ? 'Uploading Photo...' : 'Upload Photo'}</span>
                  </button>

                  {/* Optional Image URL Input */}
                  <div className="flex items-center space-x-1.5 text-xs text-amber-950/70">
                    <ImageIcon className="w-4 h-4 text-amber-900" />
                    <input
                      type="text"
                      placeholder="Or paste photo link..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="bg-amber-100/60 border border-amber-800/30 rounded-lg px-2.5 py-1.5 text-xs text-amber-950 placeholder-amber-900/40 focus:outline-none focus:border-amber-900 w-44 sm:w-56"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <span className="text-xs font-mono text-amber-950/60">
                    {content.length} characters
                  </span>
                  <button
                    type="submit"
                    disabled={saving || !content.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-amber-100 rounded-xl font-antique font-bold text-sm tracking-wider shadow-lg hover:brightness-125 transition-all border border-amber-700/60 flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Feather className="w-4 h-4" />
                    <span>{saving ? 'Preserving...' : 'Seal Memory in Parchment'}</span>
                  </button>
                </div>
              </div>

              {successMsg && (
                <div className="p-3 rounded-lg bg-emerald-900/30 border border-emerald-800 text-emerald-950 text-xs font-serif font-bold text-center">
                  ✨ {successMsg}
                </div>
              )}

            </form>
          </div>
        </div>

        {/* ARCHIVE OF PREVIOUS TRAGIC ENTRIES */}
        <div className="mt-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold font-antique text-amber-100 flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <span>Your Eternal Pages Archive</span>
              </h2>
              <p className="text-xs text-stone-400">
                {entries.length} memories sealed and preserved permanently in your vault.
              </p>
            </div>

            {/* Filter and Search */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
                <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5" />
              </div>

              <select
                value={filterMood}
                onChange={(e) => setFilterMood(e.target.value)}
                className="bg-stone-900 border border-stone-700 text-xs text-amber-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="All">All Moods</option>
                {MOODS.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-stone-500 text-sm">
              Opening sealed volumes...
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-stone-900/40 border border-stone-800 text-stone-400">
              <p className="font-serif italic text-base text-stone-300 mb-1">
                "The parchment remains untouched."
              </p>
              <p className="text-xs text-stone-500">
                Write your first entry above to permanently preserve your memories.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEntries.map(entry => {
                const moodObj = MOODS.find(m => m.id === entry.mood) || MOODS[0];
                return (
                  <div
                    key={entry.id}
                    onClick={() => setActiveReadingEntry(entry)}
                    className="cursor-pointer group relative p-6 rounded-2xl bg-stone-900/80 hover:bg-stone-900 border border-amber-900/30 hover:border-amber-600/60 transition-all duration-300 shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3 text-xs">
                        <span className="px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/40 flex items-center space-x-1">
                          <span>{moodObj.icon}</span>
                          <span className="font-serif font-medium">{entry.mood}</span>
                        </span>
                        <span className="text-[11px] font-mono text-stone-400">
                          {new Date(entry.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold font-antique text-stone-100 group-hover:text-amber-200 transition-colors line-clamp-1">
                        {entry.title}
                      </h3>

                      <p className="mt-2 text-xs text-stone-400 font-serif leading-relaxed line-clamp-4">
                        {entry.content}
                      </p>

                      {entry.image_url && (
                        <div className="mt-3">
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              setFullPhotoModal({ url: formatImageUrl(entry.image_url), title: entry.title });
                            }}
                            className="h-32 rounded-lg overflow-hidden border border-stone-800 bg-stone-950 hover:border-amber-600/50 transition cursor-zoom-in relative group/img"
                            title="Click to view full photo"
                          >
                            <img 
                              src={formatImageUrl(entry.image_url)} 
                              alt="Memory attachment" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn className="w-5 h-5 text-amber-200" />
                            </div>
                          </div>

                          {/* View option under the photo */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFullPhotoModal({ url: formatImageUrl(entry.image_url), title: entry.title });
                            }}
                            className="mt-1.5 inline-flex items-center space-x-1.5 text-[11px] text-amber-400 hover:text-amber-200 hover:underline font-serif py-0.5 transition cursor-pointer"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>View Full Photo</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-amber-500/80 font-serif italic">
                        {entry.weather || 'Midnight Silence'}
                      </span>

                      <div className="flex items-center space-x-2">
                        {/* EDIT BUTTON ON SAVED CARD */}
                        <button
                          onClick={(e) => startEditing(entry, e)}
                          title="Edit this saved page"
                          className="p-1.5 text-stone-400 hover:text-amber-300 hover:bg-amber-950/40 rounded transition flex items-center space-x-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-serif">Edit</span>
                        </button>

                        <button
                          onClick={(e) => handleDeleteEntry(entry.id, e)}
                          title="Burn page permanently"
                          className="p-1.5 text-stone-500 hover:text-rose-400 hover:bg-rose-950/30 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <span className="text-amber-400/90 font-serif flex items-center space-x-1 text-xs">
                          <span>Read</span>
                          <Eye className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* READING MODAL: OPENED AGED PARCHMENT BOOK */}
      {activeReadingEntry && !editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div 
            className="parchment-texture relative w-full max-w-2xl rounded-2xl border-4 border-amber-900/80 p-8 sm:p-12 text-stone-950 shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
            style={{ borderColor: '#5c3d26' }}
          >
            <button
              onClick={() => setActiveReadingEntry(null)}
              className="absolute top-4 right-4 text-amber-950/60 hover:text-amber-950 p-2 rounded-full hover:bg-amber-900/10 transition"
            >
              ✕
            </button>

            <div className="flex items-center justify-between border-b border-amber-900/30 pb-3 mb-6">
              <div>
                <span className="text-xs uppercase tracking-widest font-mono text-amber-900 font-bold">
                  PAGE NO. #{activeReadingEntry.id}
                </span>
                <p className="text-xs text-amber-950/70 font-serif italic">
                  Preserved on {new Date(activeReadingEntry.created_at).toLocaleDateString(undefined, { dateStyle: 'full' })}
                </p>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 rounded-full bg-amber-950 text-amber-100 text-xs font-serif font-bold">
                  {activeReadingEntry.mood}
                </span>
                <p className="text-[11px] text-amber-950/80 mt-1">{activeReadingEntry.weather}</p>
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl font-antique font-bold text-amber-950 mb-6">
              {activeReadingEntry.title}
            </h2>

            {activeReadingEntry.image_url && (
              <div className="mb-6">
                <div 
                  onClick={() => setFullPhotoModal({ url: formatImageUrl(activeReadingEntry.image_url), title: activeReadingEntry.title })}
                  className="rounded-xl overflow-hidden border-2 border-amber-900/40 max-h-80 bg-stone-950/20 cursor-zoom-in group/readimg relative"
                  title="Click to view full photo"
                >
                  <img 
                    src={formatImageUrl(activeReadingEntry.image_url)} 
                    alt="Memory" 
                    className="w-full h-full object-contain" 
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/readimg:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="w-6 h-6 text-amber-100 drop-shadow" />
                  </div>
                </div>

                {/* View option under the photo */}
                <button
                  type="button"
                  onClick={() => setFullPhotoModal({ url: formatImageUrl(activeReadingEntry.image_url), title: activeReadingEntry.title })}
                  className="mt-2 inline-flex items-center space-x-1.5 text-xs text-amber-900 hover:text-amber-950 underline font-serif font-bold cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>View Full Photo</span>
                </button>
              </div>
            )}

            <div className="text-base sm:text-lg font-serif text-amber-950 leading-relaxed whitespace-pre-wrap selection:bg-amber-300">
              {activeReadingEntry.content}
            </div>

            <div className="mt-10 pt-4 border-t border-amber-900/30 flex items-center justify-between text-xs font-serif text-amber-950/70">
              <div className="flex items-center space-x-3">
                {/* EDIT BUTTON IN READING MODAL */}
                <button
                  onClick={() => startEditing(activeReadingEntry)}
                  className="px-3 py-1.5 bg-amber-950 text-amber-100 hover:bg-amber-900 rounded-lg font-serif font-bold flex items-center space-x-1.5 shadow-sm transition"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                  <span>Edit This Page</span>
                </button>
              </div>

              <button
                onClick={(e) => handleDeleteEntry(activeReadingEntry.id, e)}
                className="text-rose-800 hover:text-rose-950 flex items-center space-x-1 underline"
              >
                <Trash2 className="w-3.5 h-3.5 inline" />
                <span>Burn & Remove Page</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDITING MODAL: EDIT A PREVIOUSLY SAVED ARCHIVE PAGE                        */}
      {/* ========================================================================= */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div 
            className="parchment-texture relative w-full max-w-2xl rounded-2xl border-4 border-amber-900/80 p-6 sm:p-10 text-stone-950 shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
            style={{ borderColor: '#5c3d26' }}
          >
            {/* Close / Cancel Edit */}
            <button
              onClick={() => setEditingEntry(null)}
              className="absolute top-4 right-4 text-amber-950/60 hover:text-amber-950 p-2 rounded-full hover:bg-amber-900/10 transition"
            >
              ✕
            </button>

            <div className="flex items-center justify-between border-b border-amber-900/30 pb-3 mb-5">
              <div>
                <span className="text-xs uppercase tracking-widest font-mono text-amber-900 font-bold flex items-center space-x-1">
                  <Edit3 className="w-3.5 h-3.5 inline text-amber-800" />
                  <span>EDITING ARCHIVE PAGE #{editingEntry.id}</span>
                </span>
                <p className="text-xs text-amber-950/70 font-serif italic">
                  Originally sealed on {new Date(editingEntry.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </p>
              </div>

              {/* Weather selector in edit */}
              <div className="flex items-center space-x-1.5 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-800/30 text-amber-950 text-xs">
                <CloudRain className="w-3.5 h-3.5 text-amber-900" />
                <select
                  value={editWeather}
                  onChange={(e) => setEditWeather(e.target.value)}
                  className="bg-transparent border-none text-xs text-amber-950 font-serif focus:outline-none cursor-pointer"
                >
                  {WEATHERS.map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
            </div>

            <form onSubmit={handleUpdateEntry} className="space-y-4">
              
              {/* Mood selector in edit */}
              <div>
                <label className="block text-xs font-serif font-bold uppercase tracking-widest text-amber-950/80 mb-1.5">
                  Update Emotional Mood:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {MOODS.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setEditMood(m.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-serif flex items-center space-x-1 transition-all ${
                        editMood === m.id
                          ? 'bg-amber-950 text-amber-100 shadow-md font-bold'
                          : 'bg-amber-100/80 text-amber-950 hover:bg-amber-200/90 border border-amber-900/20'
                      }`}
                    >
                      <span>{m.icon}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Edit Title */}
              <div>
                <label className="block text-xs font-serif font-bold uppercase tracking-widest text-amber-950/80 mb-1">
                  Page Title:
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-amber-900/40 py-1.5 text-2xl font-antique font-bold text-amber-950 placeholder-amber-900/40 focus:outline-none focus:border-amber-900"
                />
              </div>

              {/* Edit Content */}
              <div>
                <label className="block text-xs font-serif font-bold uppercase tracking-widest text-amber-950/80 mb-1">
                  Page Words:
                </label>
                <textarea
                  rows={8}
                  required
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-transparent text-base sm:text-lg font-serif text-amber-950 placeholder-amber-900/40 focus:outline-none resize-y leading-8 p-1 selection:bg-amber-300"
                  style={{ lineHeight: '2rem' }}
                />
              </div>

              {/* Edit Photo Preview if present */}
              {editImageUrl && (
                <div className="relative inline-block my-1 p-2.5 bg-stone-100 rounded-xl shadow border border-amber-900/30">
                  <div className="relative max-h-48 max-w-xs rounded overflow-hidden">
                    <img 
                      src={formatImageUrl(editImageUrl)} 
                      alt="Attached keepsake" 
                      className="max-h-48 w-auto object-cover rounded" 
                    />
                    <button
                      type="button"
                      onClick={() => setEditImageUrl('')}
                      className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-rose-900 text-white rounded-full transition shadow"
                      title="Remove Photo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-[10px] font-serif italic text-stone-600 text-center mt-1">
                    Attached Keepsake Photo
                  </div>
                </div>
              )}

              {/* Photo Upload in Edit Modal */}
              <div className="pt-2 flex flex-wrap items-center gap-3 border-t border-amber-900/20">
                <input
                  ref={editPhotoFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleEditPhotoFileUpload}
                  className="hidden"
                  id="edit-photo-file-input"
                />
                <button
                  type="button"
                  onClick={() => editPhotoFileInputRef.current?.click()}
                  disabled={editPhotoUploading}
                  className="px-3 py-1.5 bg-amber-950 text-amber-100 hover:bg-amber-900 rounded-lg text-xs font-serif font-bold shadow flex items-center space-x-1.5 border border-amber-800 transition disabled:opacity-50"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-amber-300" />
                  <span>{editPhotoUploading ? 'Uploading...' : 'Replace / Add Photo'}</span>
                </button>

                <div className="flex items-center space-x-1.5 text-xs text-amber-950/70">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-900" />
                  <input
                    type="text"
                    placeholder="Or photo URL..."
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    className="bg-amber-100/60 border border-amber-800/30 rounded px-2 py-1 text-xs text-amber-950 focus:outline-none w-44"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-amber-900/30">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 rounded-xl bg-transparent hover:bg-amber-900/10 text-amber-950 text-xs font-serif font-bold transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={editSaving || !editContent.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-amber-100 rounded-xl font-antique font-bold text-xs tracking-wider shadow-lg hover:brightness-125 transition flex items-center space-x-2 border border-amber-700/60 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-amber-300" />
                  <span>{editSaving ? 'Updating...' : 'Save & Update Page'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL PHOTO LIGHTBOX MODAL: FULL RESOLUTION UNCLIPPED PHOTO PREVIEW        */}
      {/* ========================================================================= */}
      {fullPhotoModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setFullPhotoModal(null)}
        >
          <div 
            className="relative max-w-5xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar with title and close button */}
            <div className="w-full flex items-center justify-between pb-3 text-stone-200">
              <div className="flex items-center space-x-2 truncate">
                <Maximize2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-serif text-sm font-semibold truncate text-amber-200">
                  {fullPhotoModal.title || 'Attached Keepsake Photo'}
                </span>
              </div>
              <div className="flex items-center space-x-2 shrink-0 ml-4">
                <a
                  href={fullPhotoModal.url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="p-2 bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-amber-300 rounded-full transition border border-stone-700/60"
                  title="Open / Download Full Image"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setFullPhotoModal(null)}
                  className="p-2 bg-stone-900/80 hover:bg-rose-950/80 text-stone-300 hover:text-rose-300 rounded-full transition border border-stone-700/60"
                  title="Close Full Photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* High-Resolution Full Image Container */}
            <div className="rounded-xl overflow-hidden border border-amber-900/40 bg-stone-950/90 shadow-2xl flex items-center justify-center max-h-[80vh]">
              <img 
                src={fullPhotoModal.url} 
                alt={fullPhotoModal.title || 'Keepsake Photo'} 
                className="max-h-[80vh] max-w-full object-contain select-none"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
