import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { 
  Search, Lock, Globe, Heart, Play, Pause, Download, 
  Share2, ArrowLeft, MoreHorizontal, X, MapPin, Calendar, Plus, MessageCircle
} from 'lucide-react';

const SAMPLE_ALBUMS = [
  { id: 'family', name: 'Family', count: 12, cover: '/images/welcome_screen_bg.jpg' },
  { id: 'friends', name: 'Friends', count: 18, cover: '/images/dashboard_hero.jpg' },
  { id: 'travel', name: 'Travel', count: 24, cover: '/images/mountain_lake.jpg' },
  { id: 'college', name: 'College', count: 16, cover: '/images/sunset_video.jpg' },
  { id: 'special', name: 'Special Moments', count: 10, cover: '/images/diary_candle_header.jpg' },
  { id: 'nature', name: 'Nature', count: 8, cover: '/images/capsule_wax_letter.jpg' },
];

export default function MemoriesScreen({ defaultMode = 'feed' }) {
  const [searchParams] = useSearchParams();
  const screenParam = searchParams.get('screen');
  const initialTab = searchParams.get('tab') || 'all'; // 'all' | 'private' | 'public'
  const initialMode = searchParams.get('mode') || defaultMode;

  // Sub-modes: 'feed' (Screen 6) | 'albums' (Screen 8) | 'videos' (Screen 10)
  const [mode, setMode] = useState(initialMode);
  const [activeFilter, setActiveFilter] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [photosTab, setPhotosTab] = useState('albums'); // 'albums' | 'all-photos'
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states for Screen 9 (Photo Viewer) and Screen 11 (Video Player)
  const [viewingPhoto, setViewingPhoto] = useState(null);
  const [viewingVideo, setViewingVideo] = useState(null);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const [videoProgress, setVideoProgress] = useState(24);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [photoLiked, setPhotoLiked] = useState(false);
  const [videoLiked, setVideoLiked] = useState(true);

  const navigate = useNavigate();

  const loadMemories = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/memories');
      setMemories(data);
    } catch (err) {
      console.error('Failed to load memories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, []);

  useEffect(() => {
    if (screenParam === '6') { setMode('feed'); setViewingPhoto(null); setViewingVideo(null); }
    else if (screenParam === '8') { setMode('albums'); setSelectedAlbum(null); setViewingPhoto(null); setViewingVideo(null); }
    else if (screenParam === '9' && memories.length > 0) {
      setViewingPhoto(memories.find(m => m.media_type === 'photo') || memories[0]);
    } else if (screenParam === '10') { setMode('videos'); setViewingPhoto(null); setViewingVideo(null); }
    else if (screenParam === '11' && memories.length > 0) {
      setViewingVideo(memories.find(m => m.media_type === 'video') || memories[0]);
    }
  }, [screenParam, memories]);

  // Filter memories
  const filteredMemories = memories.filter(m => {
    const matchesFilter = 
      activeFilter === 'all' ? true :
      activeFilter === 'private' ? m.is_public !== 1 :
      m.is_public === 1;

    const matchesSearch = searchQuery.trim() === '' ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMode = 
      mode === 'videos' ? m.media_type === 'video' :
      mode === 'feed' ? true : true;

    return matchesFilter && matchesSearch && matchesMode;
  });

  return (
    <div className="p-4 sm:p-5 animate-fade-in space-y-4">
      {/* ===================== SCREEN HEADER & SUB-MODES ===================== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-serif font-bold text-[#f4ede2]">Memories</h1>
          
          <div className="flex gap-1.5 bg-[#1b1713] p-1 rounded-xl border border-[#2b241c]">
            <button
              onClick={() => setMode('feed')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-serif font-semibold transition-all ${
                mode === 'feed' ? 'bg-[#cda869] text-[#120f0b]' : 'text-[#8f7e69]'
              }`}
            >
              Feed
            </button>
            <button
              onClick={() => setMode('albums')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-serif font-semibold transition-all ${
                mode === 'albums' ? 'bg-[#cda869] text-[#120f0b]' : 'text-[#8f7e69]'
              }`}
            >
              Albums
            </button>
            <button
              onClick={() => setMode('videos')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-serif font-semibold transition-all ${
                mode === 'videos' ? 'bg-[#cda869] text-[#120f0b]' : 'text-[#8f7e69]'
              }`}
            >
              Videos
            </button>
          </div>
        </div>

        {/* ===================== TABS (Contextual for Screen 8 vs Screen 6/10) ===================== */}
        {mode === 'albums' ? (
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => { setPhotosTab('albums'); setSelectedAlbum(null); }}
              className={`px-4 py-1.5 rounded-full text-xs font-serif font-semibold transition-all ${
                photosTab === 'albums' && !selectedAlbum
                  ? 'bg-[#cda869] text-[#120f0b] shadow-sm'
                  : 'bg-[#1b1713] border border-[#2f271f] text-[#baa995] hover:text-[#f4ede2]'
              }`}
            >
              Albums
            </button>
            <button
              onClick={() => { setPhotosTab('all-photos'); setSelectedAlbum(null); }}
              className={`px-4 py-1.5 rounded-full text-xs font-serif font-semibold transition-all ${
                photosTab === 'all-photos'
                  ? 'bg-[#cda869] text-[#120f0b] shadow-sm'
                  : 'bg-[#1b1713] border border-[#2f271f] text-[#baa995] hover:text-[#f4ede2]'
              }`}
            >
              All Photos
            </button>
          </div>
        ) : (
          <div className="flex gap-2 mb-3">
            {['all', 'private', 'public'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-serif capitalize transition-all ${
                  activeFilter === tab
                    ? 'bg-[#cda869] text-[#120f0b] font-bold shadow-sm'
                    : 'bg-[#1b1713] border border-[#2f271f] text-[#baa995] hover:text-[#f4ede2]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* ===================== SEARCH BAR ===================== */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#786c5c] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              mode === 'albums' ? 'Search photos & albums...' :
              mode === 'videos' ? 'Search video archives...' :
              'Search memories...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1b1713] border border-[#2c241c] rounded-2xl pl-9 pr-4 py-2.5 text-xs text-[#f5ede0] placeholder-[#6b6051] focus:border-[#cda869] outline-none font-serif"
          />
        </div>
      </div>

      {/* ==============================================================
          SCREEN 8: PHOTOS / ALBUMS (2-Column Grid & All Photos View)
      ============================================================== */}
      {mode === 'albums' && photosTab === 'albums' && !selectedAlbum && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-serif text-[#baa995]">
            <span>6 Personal Albums</span>
            <span className="text-[10px] text-[#cda869]">Private to you</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {SAMPLE_ALBUMS.map(album => (
              <div
                key={album.id}
                onClick={() => setSelectedAlbum(album)}
                className="bg-[#1b1713] border border-[#2c241c] hover:border-[#cda869]/40 rounded-2xl overflow-hidden cursor-pointer group active:scale-[0.98] transition-all shadow-md"
              >
                <div className="w-full h-28 bg-[#14110e] relative overflow-hidden">
                  <img
                    src={album.cover}
                    alt={album.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-[#cda869]">
                    <Lock className="w-3 h-3" />
                  </div>
                </div>

                <div className="p-2.5">
                  <h4 className="text-xs font-serif font-bold text-[#f4ede2] truncate">{album.name}</h4>
                  <p className="text-[10px] font-serif text-[#8f7e69] mt-0.5">{album.count} photos</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Screen 8: Selected Album Photos */}
      {mode === 'albums' && selectedAlbum && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedAlbum(null)}
                className="w-7 h-7 rounded-full bg-[#1b1713] border border-[#2f271f] flex items-center justify-center text-[#cda869]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <div>
                <h3 className="text-sm font-serif font-bold text-[#f4ede2]">{selectedAlbum.name}</h3>
                <span className="text-[10px] font-serif text-[#8f7e69]">{selectedAlbum.count} photos • Private</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {filteredMemories.filter(m => m.media_type === 'photo').map(m => (
              <div
                key={m.id}
                onClick={() => setViewingPhoto(m)}
                className="bg-[#1b1713] border border-[#2c241c] rounded-2xl overflow-hidden cursor-pointer group active:scale-[0.98] transition-all"
              >
                <div className="w-full h-28 relative overflow-hidden">
                  <img
                    src={m.media_url}
                    alt={m.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-2">
                  <p className="text-[11px] font-serif font-bold text-[#f4ede2] truncate">{m.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Screen 8: All Photos Gallery */}
      {mode === 'albums' && photosTab === 'all-photos' && (
        <div className="grid grid-cols-3 gap-2 animate-fade-in">
          {filteredMemories.filter(m => m.media_type === 'photo').map(m => (
            <div
              key={m.id}
              onClick={() => setViewingPhoto(m)}
              className="aspect-square bg-[#1b1713] rounded-2xl overflow-hidden border border-[#2c241c] cursor-pointer group active:scale-95 transition-all"
            >
              <img
                src={m.media_url}
                alt={m.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
          ))}
        </div>
      )}

      {/* ==============================================================
          SCREEN 6: MEMORIES FEED (Cards with Location & Privacy)
      ============================================================== */}
      {mode !== 'albums' && (
        <div className="space-y-3.5">
          {loading ? (
            <div className="py-16 text-center text-xs font-serif text-[#baa995]">
              <div className="w-8 h-8 rounded-full border-2 border-[#cda869] border-t-transparent animate-spin mx-auto mb-2" />
              <span>Opening your memories…</span>
            </div>
          ) : filteredMemories.length === 0 ? (
            <div className="bg-[#1b1713] border border-[#2b241c] rounded-2xl p-8 text-center">
              <p className="text-sm font-serif font-bold text-[#f4ede2] mb-1">No memories found</p>
              <p className="text-xs font-serif text-[#8f7e69] mb-4">Start by adding your first special moment.</p>
              <button
                onClick={() => navigate('/memories/new')}
                className="px-4 py-2 bg-[#cda869] text-[#120f0b] font-serif font-bold text-xs rounded-xl"
              >
                + Add Memory
              </button>
            </div>
          ) : (
            filteredMemories.map(m => (
              <div
                key={m.id}
                onClick={() => {
                  if (m.media_type === 'video') setViewingVideo(m);
                  else setViewingPhoto(m);
                }}
                className="bg-[#1b1713] border border-[#2c241c] hover:border-[#cda869]/40 rounded-3xl overflow-hidden cursor-pointer group active:scale-[0.99] transition-all shadow-md"
              >
                {/* Image / Video thumbnail */}
                {m.media_url ? (
                  <div className="w-full h-48 bg-black relative overflow-hidden flex items-center justify-center">
                    {m.media_type === 'video' ? (
                      <>
                        <video src={m.media_url} className="w-full h-full object-cover opacity-90" />
                        <div className="w-12 h-12 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white absolute">
                          <Play className="w-5 h-5 ml-0.5" />
                        </div>
                      </>
                    ) : (
                      <img
                        src={m.media_url}
                        alt={m.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}

                    {/* Privacy tag badge */}
                    <div className="absolute top-3 right-3">
                      {m.is_public === 1 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-serif font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 backdrop-blur-md flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5" />
                          <span>Public</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-serif font-semibold bg-black/70 text-[#cda869] border border-[#cda869]/30 backdrop-blur-md flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Private</span>
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-24 bg-[#231e18] flex items-center justify-center text-2xl">
                    📜
                  </div>
                )}

                {/* Card details */}
                <div className="p-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif font-bold text-sm text-[#f4ede2] truncate">
                      {m.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-serif text-[#8f7e69] mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#cda869]" />
                      <span>{new Date(m.memory_date || m.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 text-[#baa995]">
                      <MapPin className="w-2.5 h-2.5" />
                      <span>{m.category || 'Personal'}</span>
                    </span>
                  </div>

                  {m.description && (
                    <p className="text-xs font-serif text-[#bdae99] line-clamp-2 mt-2 leading-relaxed">
                      {m.description}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ==============================================================
          SCREEN 9: PHOTO VIEWER MODAL
      ============================================================== */}
      {viewingPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 animate-fade-in">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setViewingPhoto(null)}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <button className="text-white hover:text-rose-400">
                <Heart className="w-5 h-5" />
              </button>
              <button className="text-white">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="text-white">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Photo Display */}
          <div className="flex-1 flex items-center justify-center my-4">
            <img
              src={viewingPhoto.media_url || '/images/mountain_lake.jpg'}
              alt={viewingPhoto.title}
              className="max-h-[60vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>

          {/* Footer Reflection & Quotes (Matching Screen 9) */}
          <div className="bg-[#181410] border border-[#2b241c] rounded-3xl p-4 text-center">
            <h3 className="font-serif font-bold text-base text-[#f4ede2]">
              {viewingPhoto.title}
            </h3>
            <p className="text-[11px] font-serif text-[#8f7e69] mt-0.5">
              {new Date(viewingPhoto.memory_date || viewingPhoto.created_at).toLocaleDateString()} • {viewingPhoto.category || 'Manali'}
            </p>
            <p className="font-serif italic text-xs text-[#cda869] mt-2 leading-relaxed">
              "{viewingPhoto.description || 'Sometimes, being alone is the most beautiful company.'}"
            </p>
          </div>
        </div>
      )}

      {/* ==============================================================
          SCREEN 11: VIDEO PLAYER MODAL
      ============================================================== */}
      {viewingVideo && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-4 animate-fade-in">
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setViewingVideo(null)}
              className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-serif text-white font-medium">Memory Video</span>
            <div className="w-9" />
          </div>

          {/* Video Player Canvas with Glowing Sunset Video */}
          <div className="flex-1 flex flex-col justify-center my-2 relative">
            <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 group bg-black">
              <img
                src={viewingVideo.media_url || '/images/sunset_video.jpg'}
                alt={viewingVideo.title}
                className="w-full max-h-[50vh] object-cover"
              />

              {/* Play / Pause toggle overlay */}
              <button
                type="button"
                onClick={() => setVideoPlaying(!videoPlaying)}
                className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 border border-white/25 flex items-center justify-center text-white backdrop-blur-md hover:scale-105 active:scale-95 transition-transform shadow-2xl"
              >
                {videoPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 ml-1 fill-white text-white" />
                )}
              </button>

              {/* Exact Screen 11 Scrubber Progress Bar (1:24 / 5:42) */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent p-3 pt-6">
                <div 
                  className="w-full h-1.5 bg-white/25 rounded-full cursor-pointer relative overflow-hidden"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    setVideoProgress(Math.round((clickX / rect.width) * 100));
                  }}
                >
                  <div
                    className="h-full bg-gradient-to-r from-[#d8b275] to-[#cda869] rounded-full"
                    style={{ width: `${videoProgress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-[#baa995] mt-1.5 font-medium">
                  <span>1:24</span>
                  <span>5:42</span>
                </div>
              </div>
            </div>
          </div>

          {/* Video Metadata (Screen 11) */}
          <div className="bg-[#181410] border border-[#2b241c] rounded-3xl p-4 shadow-2xl">
            <h3 className="font-serif font-bold text-base text-[#f4ede2]">{viewingVideo.title}</h3>
            <p className="text-[11px] font-serif text-[#8f7e69] mt-0.5">
              12 Dec 2024 • {viewingVideo.category || 'Darjeeling'}
            </p>
            <p className="text-xs font-serif text-[#baa995] mt-2 leading-relaxed">
              {viewingVideo.description || 'One of the best trips of my life ❤️'}
            </p>

            {/* Interactive Action Bar */}
            <div className="flex items-center justify-between border-t border-[#2f271f] pt-3 mt-3 text-xs text-[#baa995]">
              <button
                type="button"
                onClick={() => setVideoLiked(!videoLiked)}
                className={`flex items-center gap-1.5 transition-colors ${videoLiked ? 'text-rose-400' : 'hover:text-rose-400'}`}
              >
                <Heart className={`w-4 h-4 ${videoLiked ? 'fill-rose-400' : ''}`} />
                <span>{videoLiked ? '12 Likes' : '11 Likes'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCommentsOpen(!commentsOpen)}
                className="flex items-center gap-1.5 hover:text-[#cda869] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Comments (2)</span>
              </button>

              <button
                type="button"
                onClick={() => alert('Video memory link copied to clipboard!')}
                className="flex items-center gap-1.5 hover:text-[#cda869] transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>

              <button
                type="button"
                onClick={() => alert('Downloading HD video clip to device storage…')}
                className="flex items-center gap-1.5 hover:text-[#cda869] transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>

            {/* Expandable Comments Drawer */}
            {commentsOpen && (
              <div className="mt-3 pt-3 border-t border-[#2f271f] space-y-2 animate-fade-in">
                <div className="bg-[#221c16] p-2.5 rounded-xl text-[11px] font-serif">
                  <span className="text-[#cda869] font-bold">Arjun M.: </span>
                  <span className="text-[#e8ded1]">The sunset glow over the water is breathtaking!</span>
                </div>
                <div className="bg-[#221c16] p-2.5 rounded-xl text-[11px] font-serif">
                  <span className="text-[#cda869] font-bold">Sneha R.: </span>
                  <span className="text-[#e8ded1]">Best Darjeeling trip ever, let us go back next year!</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
