import React, { useState, useEffect } from 'react';
import { 
  Feather, BookOpen, Volume2, VolumeX, Flame, HeartCrack, Calendar, 
  Trash2, Plus, Sparkles, Clock, Search, Edit3, Bookmark, Save, ArrowLeft
} from 'lucide-react';
import { ambientSound } from '../audio/ambientAudio';
import { vaultEngine } from '../services/vaultEngine';

const TRAGIC_QUOTES = [
  { text: "There is a pleasure in the pathless woods, There is a rapture on the lonely shore...", author: "Lord Byron" },
  { text: "Memories warm you up from the inside. But they also tear you apart.", author: "Haruki Murakami" },
  { text: "Deep into that darkness peering, long I stood there wondering, fearing...", author: "Edgar Allan Poe" },
  { text: "Saying goodbye doesn't mean anything. It's the time we spent together that matters.", author: "Trey Parker" },
  { text: "I felt an emptiness inside of me, a grief that had no origin, but felt eternal.", author: "Franz Kafka" },
  { text: "The heart was made to be broken.", author: "Oscar Wilde" }
];

const MOODS = [
  { name: 'Melancholy', color: 'bg-indigo-950 text-indigo-200 border-indigo-700/50' },
  { name: 'Heartbroken', color: 'bg-rose-950 text-rose-200 border-rose-800/60' },
  { name: 'Bittersweet', color: 'bg-amber-950 text-amber-200 border-amber-800/50' },
  { name: 'Solitude', color: 'bg-slate-900 text-slate-300 border-slate-700' },
  { name: 'Lost Love', color: 'bg-red-950 text-red-200 border-red-800/60' },
  { name: 'Nostalgic', color: 'bg-amber-900/60 text-amber-100 border-amber-600/40' },
  { name: 'Yearning', color: 'bg-purple-950 text-purple-200 border-purple-800/50' },
  { name: 'Quiet Peace', color: 'bg-emerald-950 text-emerald-200 border-emerald-800/50' },
];

export default function TragicDiaryView({ token, user }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeEntry, setActiveEntry] = useState(null); // null means writing mode or view mode
  const [isSoundOn, setIsSoundOn] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState('All');

  // Form State for Writing / Editing
  const [diaryTitle, setDiaryTitle] = useState('');
  const [diaryContent, setDiaryContent] = useState('');
  const [diaryMood, setDiaryMood] = useState('Melancholy');
  const [diaryDate, setDiaryDate] = useState(new Date().toISOString().split('T')[0]);
  const [paperStyle, setPaperStyle] = useState('bg-parchment-pattern'); // bg-parchment-pattern, bg-tragic-noir, bg-antique-sepia
  const [fontChoice, setFontChoice] = useState('font-handwriting'); // font-handwriting, font-typewriter, font-serif
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [viewMode, setViewMode] = useState('write'); // 'write' or 'read'

  // Fetch diary entries
  const fetchDiaries = async () => {
    try {
      setLoading(true);
      const list = await vaultEngine.getDiaries(token, user?.id, searchQuery);
      setEntries(list || []);
    } catch (err) {
      console.error('Fetch diaries error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchDiaries();
  }, [token, searchQuery]);

  // Rotate quotes
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % TRAGIC_QUOTES.length);
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  // Ambient sound toggle
  const toggleAmbientSound = () => {
    const playing = ambientSound.toggle();
    setIsSoundOn(playing);
  };

  // Clean up sound on unmount
  useEffect(() => {
    return () => {
      ambientSound.stop();
    };
  }, []);

  // Save or Update Diary Entry
  const handleSaveDiary = async (e) => {
    e.preventDefault();
    if (!diaryTitle.trim() || !diaryContent.trim()) {
      alert('Please provide a title and your diary thoughts before preserving.');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await vaultEngine.saveDiary(
        token,
        user?.id,
        {
          title: diaryTitle,
          content: diaryContent,
          mood: diaryMood,
          paper_style: paperStyle,
          entry_date: diaryDate
        },
        activeEntry ? activeEntry.id : null
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchDiaries();

      if (!activeEntry) {
        // Reset after new entry
        setDiaryTitle('');
        setDiaryContent('');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Start fresh entry
  const startNewEntry = () => {
    setActiveEntry(null);
    setDiaryTitle('');
    setDiaryContent('');
    setDiaryDate(new Date().toISOString().split('T')[0]);
    setDiaryMood('Melancholy');
    setViewMode('write');
  };

  // Read existing entry
  const openEntryForReading = (entry) => {
    setActiveEntry(entry);
    setDiaryTitle(entry.title);
    setDiaryContent(entry.content);
    setDiaryDate(entry.entry_date);
    setDiaryMood(entry.mood);
    setPaperStyle(entry.paper_style || 'bg-parchment-pattern');
    setViewMode('read');
  };

  // Delete diary entry
  const handleDeleteEntry = async (id) => {
    if (!window.confirm('Erase this personal page forever from your private diary? This action is irreversible.')) {
      return;
    }

    try {
      await vaultEngine.deleteDiary(token, id, user?.id);
      setEntries(entries.filter(e => e.id !== id));
      if (activeEntry && activeEntry.id === id) {
        startNewEntry();
      }
    } catch (err) {
      alert('Error deleting entry: ' + err.message);
    }
  };

  const filteredEntries = entries.filter(item => {
    if (selectedMoodFilter !== 'All' && item.mood !== selectedMoodFilter) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Tragic Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#171015] via-[#24131b] to-[#120e14] border border-rose-950/60 p-6 sm:p-8 shadow-2xl mb-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-900/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-700/40 flex items-center justify-center text-rose-300 shadow-inner">
                <Feather className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-cinzel font-bold text-amber-100 tracking-wider flex items-center gap-2">
                  THE TRAGIC DIARY
                </h1>
                <p className="text-xs text-rose-300/80 font-serif italic tracking-wide">
                  An intimate sanctuary for your deepest sorrows, bittersweet memories &amp; secret musings.
                </p>
              </div>
            </div>

            {/* Poetic Quote Bar */}
            <div className="mt-4 flex items-center gap-2 text-xs font-serif italic text-amber-200/70 max-w-xl bg-black/30 px-3.5 py-2 rounded-xl border border-rose-900/30">
              <HeartCrack className="w-4 h-4 text-rose-400 shrink-0" />
              <span>"{TRAGIC_QUOTES[quoteIndex].text}" — {TRAGIC_QUOTES[quoteIndex].author}</span>
            </div>
          </div>

          {/* Ambience & Atmosphere Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleAmbientSound}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-medium transition-all shadow-md ${
                isSoundOn
                  ? 'bg-rose-950/80 text-rose-200 border-rose-700/70 shadow-rose-950/50 animate-pulse'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-rose-800'
              }`}
            >
              {isSoundOn ? <Volume2 className="w-4 h-4 text-rose-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              <span>{isSoundOn ? 'Melancholy Rain Playing' : 'Enable Rain & Vinyl Ambience'}</span>
            </button>

            <button
              onClick={startNewEntry}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-xs font-cinzel tracking-wider shadow-lg shadow-amber-950/40 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Page</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout: Left Archive Drawer & Right Writing Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ================= LEFT: PAST DIARY ENTRIES ================= */}
        <div className="lg:col-span-4 bg-[#11141d] rounded-2xl border border-slate-800/90 p-5 shadow-xl flex flex-col max-h-[850px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-cinzel font-bold text-amber-100 tracking-wider">
                ARCHIVED PAGES
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {entries.length} {entries.length === 1 ? 'Page' : 'Pages'}
            </span>
          </div>

          {/* Search Input */}
          <div className="mt-3 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search past entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#0a0d13] border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Mood Filter Badges */}
          <div className="flex gap-1 overflow-x-auto py-2.5 scrollbar-none">
            <button
              onClick={() => setSelectedMoodFilter('All')}
              className={`px-2.5 py-1 rounded text-[10px] font-medium shrink-0 transition-colors ${
                selectedMoodFilter === 'All' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
              }`}
            >
              All
            </button>
            {MOODS.map(m => (
              <button
                key={m.name}
                onClick={() => setSelectedMoodFilter(m.name)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium shrink-0 border transition-colors ${
                  selectedMoodFilter === m.name ? 'border-amber-400 bg-amber-950/60 text-amber-200' : 'border-slate-800 text-slate-400'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>

          {/* List of Entries */}
          <div className="flex-1 overflow-y-auto space-y-3 mt-2 pr-1">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-500 font-serif italic">
                Searching diary pages...
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 font-serif italic">
                No archived pages found. Ink your first tragedy today.
              </div>
            ) : (
              filteredEntries.map((entry) => {
                const isSelected = activeEntry && activeEntry.id === entry.id;
                return (
                  <div
                    key={entry.id}
                    onClick={() => openEntryForReading(entry)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-950/40 to-rose-950/30 border-amber-500/50 shadow-md'
                        : 'bg-[#0c0f17] border-slate-800 hover:border-slate-700 hover:bg-[#131824]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-amber-400/80 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {entry.entry_date}
                      </span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/40">
                        {entry.mood}
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-slate-100 text-sm mt-1.5 line-clamp-1">
                      {entry.title}
                    </h4>
                    <p className="text-xs text-slate-400 font-serif italic mt-1 line-clamp-2 leading-relaxed">
                      {entry.content}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ================= RIGHT: THE OLD TRAGIC BEAUTIFUL DESK ================= */}
        <div className="lg:col-span-8 flex flex-col">
          
          {/* Desk Customization Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#11141d] p-3 rounded-2xl border border-slate-800 mb-4">
            {/* Paper Atmosphere Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-cinzel text-amber-300/80">Atmosphere:</span>
              <button
                onClick={() => setPaperStyle('bg-parchment-pattern')}
                className={`px-3 py-1 rounded-lg text-xs font-serif font-semibold transition-all ${
                  paperStyle === 'bg-parchment-pattern'
                    ? 'bg-[#f7f1e5] text-amber-950 shadow border border-amber-700'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                📜 Antique Parchment
              </button>
              <button
                onClick={() => setPaperStyle('bg-tragic-noir')}
                className={`px-3 py-1 rounded-lg text-xs font-serif font-semibold transition-all ${
                  paperStyle === 'bg-tragic-noir'
                    ? 'bg-[#181418] text-rose-200 shadow border border-rose-700'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                🕯️ Tragic Noir
              </button>
              <button
                onClick={() => setPaperStyle('bg-antique-sepia')}
                className={`px-3 py-1 rounded-lg text-xs font-serif font-semibold transition-all ${
                  paperStyle === 'bg-antique-sepia'
                    ? 'bg-[#33251e] text-amber-100 shadow border border-amber-600'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                🕰️ Victorian Sepia
              </button>
            </div>

            {/* Typography Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-cinzel text-amber-300/80">Quill:</span>
              <select
                value={fontChoice}
                onChange={(e) => setFontChoice(e.target.value)}
                className="bg-[#090b10] border border-slate-700 text-amber-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-400 font-serif"
              >
                <option value="font-handwriting">Handwritten Quill</option>
                <option value="font-typewriter">Old Typewriter</option>
                <option value="font-serif">Classic Antiqua</option>
              </select>
            </div>
          </div>

          {/* The Antique Paper Document */}
          <div className={`relative rounded-3xl p-8 sm:p-12 shadow-2xl transition-all duration-500 deckle-border ${paperStyle}`}>
            
            {/* Candlelight Flicker Accent */}
            <div className="absolute top-4 right-6 flex items-center gap-2 select-none pointer-events-none">
              <Flame className="w-5 h-5 text-amber-500 animate-flicker" />
              <span className={`text-[10px] tracking-widest font-mono uppercase ${
                paperStyle === 'bg-parchment-pattern' ? 'text-amber-900/60' : 'text-amber-400/50'
              }`}>
                Candlelight Lit
              </span>
            </div>

            <form onSubmit={handleSaveDiary} className="space-y-6">
              {/* Header: Date and Mood Selection */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-amber-950/20">
                {/* Date stamp */}
                <div className="flex items-center gap-2">
                  <Calendar className={`w-4 h-4 ${paperStyle === 'bg-parchment-pattern' ? 'text-amber-900' : 'text-amber-400'}`} />
                  <input
                    type="date"
                    value={diaryDate}
                    onChange={(e) => setDiaryDate(e.target.value)}
                    className={`bg-transparent text-sm font-cinzel font-bold border-b border-dashed focus:outline-none ${
                      paperStyle === 'bg-parchment-pattern'
                        ? 'text-amber-950 border-amber-800/40'
                        : 'text-amber-100 border-amber-400/40'
                    }`}
                  />
                </div>

                {/* Mood Tag Selector */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-serif italic ${
                    paperStyle === 'bg-parchment-pattern' ? 'text-amber-900/80' : 'text-amber-300/80'
                  }`}>
                    Emotional Mood:
                  </span>
                  <select
                    value={diaryMood}
                    onChange={(e) => setDiaryMood(e.target.value)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold focus:outline-none border ${
                      paperStyle === 'bg-parchment-pattern'
                        ? 'bg-[#ede3ce] text-amber-950 border-amber-800/40'
                        : 'bg-black/50 text-amber-100 border-rose-900/60'
                    }`}
                  >
                    {MOODS.map(m => (
                      <option key={m.name} value={m.name} className="bg-slate-900 text-slate-100">
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title of Diary Entry */}
              <div>
                <input
                  type="text"
                  placeholder="Title of this memory or heartache..."
                  value={diaryTitle}
                  onChange={(e) => setDiaryTitle(e.target.value)}
                  className={`w-full bg-transparent text-2xl sm:text-3xl font-cinzel font-bold placeholder-opacity-40 focus:outline-none pb-2 border-b ${
                    paperStyle === 'bg-parchment-pattern'
                      ? 'text-amber-950 placeholder-amber-900/40 border-amber-900/20'
                      : 'text-amber-100 placeholder-rose-200/30 border-rose-900/40'
                  }`}
                />
              </div>

              {/* Body of Diary Entry */}
              <div>
                <textarea
                  rows="14"
                  placeholder="Pour your heart out upon this page... Write of that quiet dusk, words that were left unspoken, or a love that slips like water through weary fingers. Nothing written here will ever leave your eyes..."
                  value={diaryContent}
                  onChange={(e) => setDiaryContent(e.target.value)}
                  className={`w-full bg-transparent text-base sm:text-lg leading-relaxed sm:leading-loose focus:outline-none resize-y ${fontChoice} ${
                    paperStyle === 'bg-parchment-pattern'
                      ? 'text-[#2a1a0a] placeholder-amber-900/40'
                      : 'text-amber-100 placeholder-slate-500'
                  }`}
                ></textarea>
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-6 border-t border-amber-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs">
                  {saveSuccess && (
                    <span className="text-emerald-500 font-serif font-bold flex items-center gap-1">
                      ✓ Permanently preserved in your private diary
                    </span>
                  )}
                  {activeEntry && (
                    <span className={`font-mono text-[11px] ${
                      paperStyle === 'bg-parchment-pattern' ? 'text-amber-900/70' : 'text-slate-400'
                    }`}>
                      Editing entry from {activeEntry.entry_date}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {activeEntry && (
                    <button
                      type="button"
                      onClick={() => handleDeleteEntry(activeEntry.id)}
                      className="px-4 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-200 border border-red-800/60 text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Tear Out Page</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-cinzel font-bold text-xs tracking-wider shadow-lg shadow-amber-950/50 transition-all flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Inking Page...' : activeEntry ? 'Update Archived Page' : 'Permanently Ink to Diary'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
