import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { 
  ArrowLeft, Search, Plus, Calendar, Heart, Lock, 
  Bold, Italic, Underline, AlignLeft, Quote, Volume2, 
  VolumeX, Trash2, Edit3, Sparkles, Image as ImageIcon 
} from 'lucide-react';

export default function TragicDiary() {
  const [searchParams] = useSearchParams();
  const screenParam = searchParams.get('screen');

  // 'list' (Screen 12) | 'editor' (Screen 13) | 'view' (Screen 14)
  const [diaryView, setDiaryView] = useState(() => {
    if (screenParam === '13' || screenParam === 'editor') return 'editor';
    if (screenParam === '14' || screenParam === 'view') return 'view';
    return 'list';
  });
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'favorites'
  const [searchQuery, setSearchQuery] = useState('');
  const [entries, setEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Editor Form state (Screen 13)
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [saving, setSaving] = useState(false);

  // Web Audio ambient sound synthesizer
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioCtxRef = useRef(null);

  const navigate = useNavigate();

  const loadEntries = async () => {
    try {
      const { data } = await api.get('/diary');
      setEntries(data);
      if (data.length > 0) {
        setSelectedEntry(data[0]);
      }
    } catch (e) {
      console.error('Failed to load diary entries:', e);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    if (screenParam === '12') setDiaryView('list');
    else if (screenParam === '13') {
      setDiaryView('editor');
      setTitle('A New Beginning');
      setContent('Today I felt a strange peace. It was not happiness, not sadness... just a calm feeling that maybe, things will be better someday. I don\'t know what the future holds, but I am ready to face it.');
    } else if (screenParam === '14') {
      setDiaryView('view');
    }
  }, [screenParam]);

  // Ambient rain generator
  const toggleAmbientSound = () => {
    if (isPlayingAudio) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      setIsPlayingAudio(false);
    } else {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;

        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = data[i];
          data[i] *= 1.5;
        }

        const rainSource = ctx.createBufferSource();
        rainSource.buffer = buffer;
        rainSource.loop = true;

        const rainFilter = ctx.createBiquadFilter();
        rainFilter.type = 'lowpass';
        rainFilter.frequency.value = 800;

        const rainGain = ctx.createGain();
        rainGain.gain.value = 0.08;

        rainSource.connect(rainFilter);
        rainFilter.connect(rainGain);
        rainGain.connect(ctx.destination);
        rainSource.start();

        setIsPlayingAudio(true);
      } catch (e) {
        console.warn('Audio not available:', e);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  // Save diary entry (Screen 13)
  const handleSaveEntry = async (e) => {
    if (e) e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    try {
      const { data } = await api.post('/diary', {
        title: title.trim(),
        content: content.trim(),
        mood: 'Melancholy',
        tragic_quote: 'Some days are just for you...',
      });

      await loadEntries();
      setSelectedEntry(data);
      setDiaryView('view');
      setTitle('');
      setContent('');
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  // Filtered entries
  const filteredEntries = entries.filter(entry => {
    return searchQuery.trim() === '' ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="p-4 sm:p-5 animate-fade-in space-y-4">
      {/* ==============================================================
          SCREEN 12: PERSONAL DIARY LIST VIEW
      ============================================================== */}
      {diaryView === 'list' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-[#cda869]"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-xl font-serif font-bold text-[#f4ede2]">Personal Diary</h1>
            </div>

            <button
              onClick={() => { setDiaryView('editor'); setTitle(''); setContent(''); }}
              className="px-3.5 py-1.5 rounded-full bg-[#cda869] text-[#120f0b] font-serif font-bold text-xs shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Write</span>
            </button>
          </div>

          {/* Tabs [All Entries | Favorites] */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-serif transition-all ${
                activeTab === 'all'
                  ? 'bg-[#cda869] text-[#120f0b] font-bold shadow-sm'
                  : 'bg-[#1b1713] border border-[#2f271f] text-[#baa995]'
              }`}
            >
              All Entries
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-4 py-1.5 rounded-full text-xs font-serif transition-all ${
                activeTab === 'favorites'
                  ? 'bg-[#cda869] text-[#120f0b] font-bold shadow-sm'
                  : 'bg-[#1b1713] border border-[#2f271f] text-[#baa995]'
              }`}
            >
              Favorites
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#786c5c] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search diary entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1b1713] border border-[#2c241c] rounded-2xl pl-9 pr-4 py-2 text-xs text-[#f5ede0] placeholder-[#6b6051] focus:border-[#cda869] outline-none font-serif"
            />
          </div>

          {/* Diary Entries List (Screen 12 Cards) */}
          <div className="space-y-3">
            {filteredEntries.length === 0 ? (
              <div className="bg-[#1b1713] border border-[#2b241c] rounded-2xl p-8 text-center">
                <p className="text-sm font-serif font-bold text-[#f4ede2] mb-1">No diary entries yet</p>
                <p className="text-xs font-serif text-[#8f7e69] mb-4">Pour your heart into the quiet sanctuary.</p>
                <button
                  onClick={() => setDiaryView('editor')}
                  className="px-4 py-2 bg-[#cda869] text-[#120f0b] font-serif font-bold text-xs rounded-xl"
                >
                  Write First Entry
                </button>
              </div>
            ) : (
              filteredEntries.map((entry, idx) => (
                <div
                  key={entry.id}
                  onClick={() => { setSelectedEntry(entry); setDiaryView('view'); }}
                  className="bg-[#1b1713] border border-[#2c241c] hover:border-[#cda869]/40 p-3 rounded-2xl cursor-pointer group active:scale-[0.99] transition-all flex items-center gap-3.5 shadow-md"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#241f19] flex-shrink-0 relative">
                    <img
                      src={idx % 2 === 0 ? '/images/mountain_lake.jpg' : '/images/dashboard_hero.jpg'}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center text-[#cda869]">
                      <Lock className="w-2.5 h-2.5" />
                    </div>
                  </div>

                  {/* Content details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif font-bold text-xs text-[#f4ede2] truncate">
                        {entry.title}
                      </h3>
                      <span className="text-[10px] font-serif text-[#cda869] flex-shrink-0">
                        {new Date(entry.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <p className="text-[11px] font-serif italic text-[#baa995] line-clamp-2 mt-1 leading-relaxed">
                      "{entry.content}"
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==============================================================
          SCREEN 13: DIARY EDITOR (Weathered Antique Parchment)
      ============================================================== */}
      {diaryView === 'editor' && (
        <div className="space-y-3 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDiaryView('list')}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#cda869]"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-sm font-serif font-bold text-[#f4ede2]">New Diary Entry</h2>
            </div>

            <button
              onClick={toggleAmbientSound}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-serif transition-all border ${
                isPlayingAudio 
                  ? 'bg-[#cda869]/20 text-[#cda869] border-[#cda869]/40' 
                  : 'bg-white/5 text-[#baa995] border-white/5'
              }`}
            >
              {isPlayingAudio ? <Volume2 className="w-3 h-3 animate-pulse" /> : <VolumeX className="w-3 h-3" />}
              <span>{isPlayingAudio ? 'Rain Playing' : 'Muted'}</span>
            </button>
          </div>

          {/* Weathered Parchment Sheet Editor */}
          <div className="parchment-sheet rounded-3xl p-4 sm:p-5 text-[#2c1b10] shadow-2xl relative">
            {/* Title */}
            <input
              type="text"
              required
              placeholder="Title of this memory..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent border-b border-[#caa983] text-lg font-serif font-bold text-[#23150b] placeholder-[#8a6e4d] outline-none pb-1 mb-2"
            />

            {/* Date Indicator */}
            <div className="flex items-center gap-2 text-[11px] font-serif text-[#6d5135] mb-3">
              <Calendar className="w-3 h-3" />
              <span>{new Date(entryDate).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>

            {/* Formatting Toolbar (Screen 13 Match) */}
            <div className="flex items-center gap-1 border-y border-[#caa983]/60 py-1.5 mb-3 text-[#4a3622]">
              <button
                type="button"
                onClick={() => setIsBold(!isBold)}
                className={`p-1 rounded ${isBold ? 'bg-[#caa983]' : 'hover:bg-[#caa983]/40'}`}
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsItalic(!isItalic)}
                className={`p-1 rounded ${isItalic ? 'bg-[#caa983]' : 'hover:bg-[#caa983]/40'}`}
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsUnderline(!isUnderline)}
                className={`p-1 rounded ${isUnderline ? 'bg-[#caa983]' : 'hover:bg-[#caa983]/40'}`}
              >
                <Underline className="w-3.5 h-3.5" />
              </button>
              <div className="h-4 w-[1px] bg-[#caa983] mx-1" />
              <button type="button" className="p-1 rounded hover:bg-[#caa983]/40">
                <Quote className="w-3.5 h-3.5" />
              </button>
              <button type="button" className="p-1 rounded hover:bg-[#caa983]/40">
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Lined Writing Surface */}
            <textarea
              rows={8}
              placeholder="Today I felt a strange peace. It was not happiness, not sadness... just a calm feeling that maybe, things will be better someday."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`w-full bg-transparent text-sm font-serif text-[#23150b] placeholder-[#8a6e4d] leading-[26px] outline-none resize-none ${
                isBold ? 'font-bold' : ''
              } ${isItalic ? 'italic' : ''} ${isUnderline ? 'underline' : ''}`}
              style={{
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 25px, rgba(160, 120, 80, 0.25) 25px, rgba(160, 120, 80, 0.25) 26px)',
              }}
            />

            {/* Photo Attachment preview (Screen 13 match) */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#caa983]/60">
              <div className="w-14 h-12 rounded-xl overflow-hidden border border-[#b2875b]">
                <img src="/images/dashboard_hero.jpg" alt="Attachment" className="w-full h-full object-cover" />
              </div>
              <div className="w-12 h-12 rounded-xl border border-dashed border-[#b2875b] flex items-center justify-center text-[#6d5135] text-xs">
                <Plus className="w-4 h-4" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4 pt-3 border-t border-[#caa983]/60">
              <button
                type="button"
                onClick={() => setDiaryView('list')}
                className="flex-1 py-2.5 rounded-xl border border-[#7e553b] text-[#5c3e2c] font-serif font-semibold text-xs active:scale-95"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={handleSaveEntry}
                disabled={saving || !title.trim() || !content.trim()}
                className="flex-1 py-2.5 rounded-xl bg-[#6e4620] hover:bg-[#583718] text-[#f4ede1] font-serif font-bold text-xs shadow-md active:scale-95 disabled:opacity-50"
              >
                {saving ? 'Engraving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          SCREEN 14: DIARY READING VIEW (Candlelit Header + Handwriting)
      ============================================================== */}
      {diaryView === 'view' && selectedEntry && (
        <div className="space-y-3 animate-fade-in">
          {/* Header Bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setDiaryView('list')}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#cda869]"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-serif text-[#baa995]">Diary Reading</span>
            <button
              onClick={toggleAmbientSound}
              className="text-[#cda869] p-1.5"
            >
              {isPlayingAudio ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          {/* Candle Atmosphere Header (Screen 14 Top Image) */}
          <div className="w-full h-32 rounded-3xl overflow-hidden border border-[#31281e] shadow-xl relative">
            <img
              src="/images/diary_candle_header.jpg"
              alt="Candlelight Room"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>

          {/* Parchment Entry Body */}
          <div className="parchment-sheet rounded-3xl p-5 text-[#2c1b10] shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#caa983] pb-2 mb-3">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#23150b]">
                  {selectedEntry.title}
                </h2>
                <p className="text-[11px] font-serif text-[#6d5135]">
                  {new Date(selectedEntry.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button className="text-rose-600">
                <Heart className="w-4 h-4 fill-rose-600" />
              </button>
            </div>

            {/* Content in warm serif font */}
            <p className="text-sm font-serif text-[#23150b] leading-[26px] whitespace-pre-wrap min-h-[120px]">
              {selectedEntry.content}
            </p>

            {/* Attached Image inside parchment (Screen 14 match) */}
            <div className="my-3 w-32 h-20 rounded-xl overflow-hidden border border-[#b2875b] shadow-md">
              <img src="/images/mountain_lake.jpg" alt="Memory Attachment" className="w-full h-full object-cover" />
            </div>

            {/* Poetic Quote Footer in Cursive */}
            <div className="text-right pt-2 border-t border-[#caa983]/60">
              <p className="font-cursive text-base text-[#6d5135]">
                Some days are just for you...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
