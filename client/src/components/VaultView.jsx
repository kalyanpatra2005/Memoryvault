import { 
  Image as ImageIcon, Video, Plus, Search, Calendar, Lock, Unlock, 
  Trash2, Download, Eye, Sparkles, Filter, X, Clock, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { vaultEngine } from '../services/vaultEngine';

export default function VaultView({ token, user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // all, photo, video, capsule
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadTags, setUploadTags] = useState('');
  const [isTimeCapsule, setIsTimeCapsule] = useState(false);
  const [unlockDate, setUnlockDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  // Fetch user's private vault items
  const fetchVaultItems = async () => {
    try {
      setLoading(true);
      const vaultItems = await vaultEngine.getVaultItems(token, user?.id, searchQuery);
      setItems(vaultItems || []);
    } catch (err) {
      console.error('Fetch items error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchVaultItems();
    }
  }, [token, searchQuery]);

  // Handle File Select
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadFile(file);
    if (file.type.startsWith('image/')) {
      setUploadPreview(URL.createObjectURL(file));
    } else if (file.type.startsWith('video/')) {
      setUploadPreview(URL.createObjectURL(file));
    }
  };

  // Submit Upload
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setErrorMsg('Please select a photo or video to seal in your vault.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await vaultEngine.uploadVaultItem(
        token,
        user?.id,
        uploadFile,
        uploadCaption,
        uploadDate,
        uploadTags,
        isTimeCapsule && unlockDate ? unlockDate : null
      );

      // Reset Form & Refresh
      setUploadFile(null);
      setUploadPreview(null);
      setUploadCaption('');
      setUploadTags('');
      setIsTimeCapsule(false);
      setUnlockDate('');
      setIsUploadOpen(false);
      fetchVaultItems();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Vault Item
  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to permanently erase this memory from your private vault? Once deleted, it cannot be recovered.')) {
      return;
    }

    try {
      setDeletingId(id);
      await vaultEngine.deleteVaultItem(token, id, user?.id);
      setItems(items.filter(item => item.id !== id));
      if (selectedMedia && selectedMedia.id === id) {
        setSelectedMedia(null);
      }
    } catch (err) {
      alert('Could not delete item: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Filter Items
  const filteredItems = items.filter(item => {
    if (activeFilter === 'photo') return item.type === 'photo';
    if (activeFilter === 'video') return item.type === 'video';
    if (activeFilter === 'capsule') return !!item.unlock_date;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-amber-900/20">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-cinzel font-bold text-amber-100 tracking-wider">
              YOUR TIME CAPSULE VAULT
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
              Private &amp; Permanent
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1 font-serif">
            Every photo and video stored here remains permanent and strictly visible only to you.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Upload Button */}
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-950/40 transition-all flex items-center gap-2 font-cinzel"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Preserve Memory</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-[#121622] rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeFilter === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Memories ({items.length})
          </button>
          <button
            onClick={() => setActiveFilter('photo')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeFilter === 'photo'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Photos
          </button>
          <button
            onClick={() => setActiveFilter('video')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeFilter === 'video'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            Videos
          </button>
          <button
            onClick={() => setActiveFilter('capsule')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeFilter === 'capsule'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Time Capsules
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search captions, tags, dates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#121622] border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="inline-block w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-amber-200/70 mt-3 font-serif italic">Unlocking your permanent archives...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-[#121622]/50 border border-slate-800/80 mt-6 p-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 mx-auto flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-lg font-cinzel font-semibold text-amber-100">Your Vault is Ready</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 font-serif">
            {searchQuery
              ? 'No memories matched your search keywords.'
              : 'Preserve your very first photo or video. Everything you save here is permanently protected and visible only to you.'}
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="mt-5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs font-cinzel transition-all"
          >
            Upload Your First Memory
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group relative bg-[#131824] rounded-2xl border border-slate-800 hover:border-amber-500/50 shadow-md hover:shadow-xl hover:shadow-amber-950/30 overflow-hidden transition-all duration-300 flex flex-col"
            >
              {/* Media Thumbnail Container */}
              <div 
                onClick={() => !item.is_locked && setSelectedMedia(item)}
                className={`relative aspect-[4/3] bg-black/60 overflow-hidden cursor-pointer ${
                  item.is_locked ? 'cursor-not-allowed filter blur-[2px] opacity-75' : ''
                }`}
              >
                {item.type === 'photo' ? (
                  <img
                    src={`/api/vault/media/${item.id}?token=${token}`}
                    alt={item.caption || item.original_name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center bg-[#090b10]">
                    <video
                      src={`/api/vault/media/${item.id}?token=${token}`}
                      preload="metadata"
                      className="w-full h-full object-cover pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-amber-500/90 text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Video className="w-6 h-6 ml-0.5" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Badge Overlay */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/75 text-amber-200 border border-amber-500/30 backdrop-blur-sm">
                    {item.type}
                  </span>
                  {item.is_locked && (
                    <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-950/80 text-rose-200 border border-rose-700/50 backdrop-blur-sm flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Sealed
                    </span>
                  )}
                </div>

                {/* Date Stamp */}
                <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-mono bg-black/75 text-slate-300 border border-slate-700/50 backdrop-blur-sm flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-400" />
                  {item.memory_date}
                </div>
              </div>

              {/* Locked Time Capsule Overlay Banner */}
              {item.is_locked && (
                <div className="p-3 bg-amber-950/40 border-t border-amber-700/30 flex items-center gap-2 text-xs text-amber-200">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Sealed until {item.unlock_date}</span>
                </div>
              )}

              {/* Card Details & Actions */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-semibold text-slate-100 text-sm line-clamp-1 group-hover:text-amber-200 transition-colors">
                    {item.caption || item.original_name}
                  </h4>
                  {item.tags && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.split(',').map((tag, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-amber-300/80">
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {(item.file_size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                  <div className="flex items-center gap-2">
                    {!item.is_locked && (
                      <button
                        onClick={() => setSelectedMedia(item)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition-colors"
                        title="View Full Resolution"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      disabled={deletingId === item.id}
                      className="p-1.5 rounded-lg hover:bg-red-950/40 text-slate-400 hover:text-red-400 transition-colors"
                      title="Permanently Delete Memory"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= UPLOAD MODAL ================= */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg my-8 bg-[#111622] border border-amber-500/30 rounded-2xl shadow-2xl shadow-amber-950/60 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-amber-950/30 to-[#141a29] border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-cinzel font-bold text-amber-100 text-lg">SEAL NEW MEMORY</h3>
                <p className="text-xs text-slate-400">Stored permanently with strict private isolation.</p>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-950/40 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Drag & Drop File Zone */}
              <div>
                <label className="block text-xs font-semibold text-amber-200/90 mb-1.5">
                  Select Photo or Video
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {uploadPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-amber-500/40 max-h-56 bg-black flex items-center justify-center">
                    {uploadFile?.type.startsWith('video/') ? (
                      <video src={uploadPreview} controls className="max-h-56 w-full object-contain" />
                    ) : (
                      <img src={uploadPreview} alt="Preview" className="max-h-56 w-full object-contain" />
                    )}
                    <button
                      type="button"
                      onClick={() => { setUploadFile(null); setUploadPreview(null); }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-amber-400/70 rounded-2xl p-8 text-center cursor-pointer bg-[#0c0f17]/60 hover:bg-[#131926] transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 mx-auto flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-6 h-6 text-amber-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-200">
                      Click to choose a Photo or Video file
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports JPG, PNG, WEBP, GIF, MP4, MOV, WEBM (up to 150MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Memory Caption */}
              <div>
                <label className="block text-xs font-semibold text-amber-200/90 mb-1.5">
                  Memory Caption / Note
                </label>
                <textarea
                  rows="2"
                  placeholder="What was happening in this moment? What did you feel?"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  className="w-full px-3 py-2 bg-[#090c13] border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                ></textarea>
              </div>

              {/* Memory Date & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-amber-200/90 mb-1.5">
                    Date of Memory
                  </label>
                  <input
                    type="date"
                    value={uploadDate}
                    onChange={(e) => setUploadDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#090c13] border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-200/90 mb-1.5">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Childhood, Love, Vacation"
                    value={uploadTags}
                    onChange={(e) => setUploadTags(e.target.value)}
                    className="w-full px-3 py-2 bg-[#090c13] border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Optional Time Capsule Locking */}
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-semibold text-amber-100">Seal as Future Time Capsule</div>
                      <div className="text-[10px] text-amber-300/70">Lock this memory until a future anniversary or milestone.</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isTimeCapsule}
                    onChange={(e) => setIsTimeCapsule(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded border-slate-700 focus:ring-amber-400 accent-amber-500 cursor-pointer"
                  />
                </div>

                {isTimeCapsule && (
                  <div className="mt-3 pt-3 border-t border-amber-900/30">
                    <label className="block text-xs font-medium text-amber-200/80 mb-1">
                      Unlock Date
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={unlockDate}
                      onChange={(e) => setUnlockDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#090c13] border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !uploadFile}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-950/50 font-cinzel text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Preserving in Vault...' : 'Permanently Save into Vault'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= FULL SCREEN MEDIA VIEWER ================= */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-lg">
          <button
            onClick={() => setSelectedMedia(null)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-5xl w-full max-h-[90vh] flex flex-col items-center">
            <div className="w-full flex-1 max-h-[75vh] flex items-center justify-center overflow-hidden rounded-2xl bg-black/50 border border-slate-800">
              {selectedMedia.type === 'photo' ? (
                <img
                  src={`/api/vault/media/${selectedMedia.id}?token=${token}`}
                  alt={selectedMedia.caption}
                  className="max-h-[75vh] max-w-full object-contain rounded-xl"
                />
              ) : (
                <video
                  src={`/api/vault/media/${selectedMedia.id}?token=${token}`}
                  controls
                  autoPlay
                  className="max-h-[75vh] max-w-full rounded-xl"
                />
              )}
            </div>

            <div className="w-full mt-4 p-4 rounded-xl bg-[#121622] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  {selectedMedia.caption || selectedMedia.original_name}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                  <span>Captured: {selectedMedia.memory_date}</span>
                  <span>•</span>
                  <span>Size: {(selectedMedia.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <a
                  href={`/api/vault/media/${selectedMedia.id}?token=${token}`}
                  download={selectedMedia.original_name}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => handleDeleteItem(selectedMedia.id)}
                  className="px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
