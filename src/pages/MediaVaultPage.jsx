import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { vaultEngine, safeFetchJson, isVideoMedia } from '../services/vaultEngine';
import MemoryDetailModal from '../components/MemoryDetailModal';
import { 
  Film, Image as ImageIcon, UploadCloud, Trash2, Eye, ShieldCheck, 
  Lock, Play, Calendar, HardDrive, Download, AlertTriangle, CheckCircle, 
  Sparkles, Filter, Plus 
} from 'lucide-react';

export default function MediaVaultPage() {
  const { token, user, authFetch } = useAuth();
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all', 'photo', 'video'
  const [uploading, setUploading] = useState(false);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');

  const [photoCount, setPhotoCount] = useState(0);
  const [videoCount, setVideoCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Selected media for modal viewer
  const [selectedMedia, setSelectedMedia] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchMedia();
  }, [filterType]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const allItems = await vaultEngine.getVaultItems(token, user?.id || 'guest', user?.email || '');

      let pCount = 0;
      let vCount = 0;
      allItems.forEach(i => {
        if (isVideoMedia(i)) vCount++;
        else pCount++;
      });
      setPhotoCount(pCount);
      setVideoCount(vCount);
      setTotalCount(allItems.length);

      let filtered = allItems;
      if (filterType === 'photo') {
        filtered = allItems.filter(i => !isVideoMedia(i));
      } else if (filterType === 'video') {
        filtered = allItems.filter(i => isVideoMedia(i));
      }

      filtered.sort((a, b) => new Date(b.created_at || b.memory_date || 0) - new Date(a.created_at || a.memory_date || 0));
      setMediaList(filtered);
    } catch (err) {
      console.error('Failed to load media', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    let uploadedCount = 0;
    try {
      for (let i = 0; i < files.length; i++) {
        await vaultEngine.uploadVaultItem(
          token,
          user?.id || 'guest',
          files[i],
          uploadCaption.trim() || files[i].name,
          new Date().toISOString().split('T')[0],
          '',
          'Personal',
          user?.email || ''
        );
        uploadedCount++;
      }

      setUploadSuccess(`${uploadedCount} moment(s) permanently preserved to cloud vault.`);
      setUploadCaption('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchMedia();
      setTimeout(() => setUploadSuccess(''), 4000);
    } catch (err) {
      console.error('Upload error:', err);
      const msg = err?.message && !err.message.includes('JSON') && !err.message.includes('token')
        ? err.message
        : 'Could not complete media upload. Please check file format.';
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMedia = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you certain? This memory will be permanently removed from disk and database.')) {
      return;
    }

    try {
      await vaultEngine.deleteVaultItem(token, id, user?.id || 'guest');
    } catch (err) {}

    await fetchMedia();
    if (selectedMedia?.id === id) {
      setSelectedMedia(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getMediaUrl = (itemOrId) => {
    if (!itemOrId) return '';
    if (typeof itemOrId === 'object') {
      if (itemOrId.data_url) return itemOrId.data_url;
      if (itemOrId.media_url) return itemOrId.media_url;
      return `/api/media/stream/${itemOrId.id}?token=${token}`;
    }
    const found = mediaList.find(m => String(m.id) === String(itemOrId));
    if (found) {
      if (found.data_url) return found.data_url;
      if (found.media_url) return found.media_url;
    }
    return `/api/media/stream/${itemOrId}?token=${token}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-stone-200">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-amber-400 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ENCRYPTED & PERMANENT CLOUD ARCHIVE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-sans text-stone-100 tracking-tight">
            Photos & Videos Vault
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Your personal visual history. Every file stays here permanently unless you choose to delete it.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center bg-stone-900 p-1 rounded-xl border border-stone-800 self-start md:self-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filterType === 'all'
                ? 'bg-amber-950 text-amber-300 border border-amber-800/80 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            All Archive ({totalCount})
          </button>
          <button
            onClick={() => setFilterType('photo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1 ${
              filterType === 'photo'
                ? 'bg-amber-950 text-amber-300 border border-amber-800/80 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photos ({photoCount})</span>
          </button>
          <button
            onClick={() => setFilterType('video')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1 ${
              filterType === 'video'
                ? 'bg-amber-950 text-amber-300 border border-amber-800/80 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Videos ({videoCount})</span>
          </button>
        </div>
      </div>

      {/* UPLOAD BOX */}
      <div className="p-6 sm:p-8 rounded-3xl bg-stone-900/60 border border-stone-800 backdrop-blur-md shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-bold font-sans text-stone-100 flex items-center space-x-2">
              <UploadCloud className="w-5 h-5 text-amber-400" />
              <span>Deposit Memories into the Vault</span>
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Upload photos (JPG, PNG, GIF, WebP) and videos (MP4, WebM, MOV) up to 250MB each.
            </p>
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-800/40 font-mono">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Strict User Account Privacy</span>
          </div>
        </div>

        {uploadError && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs">
            {uploadError}
          </div>
        )}

        {uploadSuccess && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-200 text-xs flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Add a permanent memory caption or note (optional)..."
              value={uploadCaption}
              onChange={(e) => setUploadCaption(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-950/80 border border-stone-700/80 rounded-xl text-xs sm:text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-400 transition"
            />
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.mp4,.mov,.webm,.mkv,.avi,.m4v,.3gp,.wmv,.flv,.ogv,.ts,.mts,.m2ts,.qt"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="file-upload-input"
            />
            <label
              htmlFor="file-upload-input"
              className={`w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:brightness-110 text-stone-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-950/50 flex items-center justify-center space-x-2 cursor-pointer transition border border-amber-400/40 ${
                uploading ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <UploadCloud className="w-4 h-4 text-stone-950" />
              <span>{uploading ? 'Encrypting & Vaulting...' : 'Select Photos or Videos'}</span>
            </label>
          </div>
        </div>
      </div>

      {/* MEDIA GALLERY */}
      {loading ? (
        <div className="text-center py-16 text-stone-500 text-sm">
          Unlocking memory catalog...
        </div>
      ) : mediaList.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-stone-900/30 border border-stone-800 text-stone-400">
          <Film className="w-12 h-12 text-stone-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-300">Your visual vault is empty</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Deposit your photos, family videos, or treasured snapshots above. They stay safe forever.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {mediaList.map((item) => {
            const isVideo = isVideoMedia(item);
            const mediaUrl = getMediaUrl(item);

            return (
              <div
                key={item.id}
                onClick={() => setSelectedMedia(item)}
                className="glass-card rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 flex flex-col justify-between"
              >
                {/* Media Preview Container */}
                <div className="relative aspect-square bg-stone-950 flex items-center justify-center overflow-hidden border-b border-stone-800/80">
                  {isVideo ? (
                    <div className="relative w-full h-full bg-stone-950 flex items-center justify-center">
                      <video
                        src={mediaUrl}
                        preload="metadata"
                        className="w-full h-full object-cover opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-amber-500/90 text-stone-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 fill-stone-950 translate-x-0.5" />
                        </div>
                      </div>
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/70 text-amber-300 text-[10px] font-mono flex items-center space-x-1 border border-amber-500/30">
                        <Film className="w-3 h-3" />
                        <span>VIDEO</span>
                      </span>
                    </div>
                  ) : (
                    <div className="relative w-full h-full">
                      <img
                        src={mediaUrl}
                        alt={item.caption || item.original_name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/70 text-stone-200 text-[10px] font-mono flex items-center space-x-1 border border-white/10">
                        <ImageIcon className="w-3 h-3 text-amber-400" />
                        <span>PHOTO</span>
                      </span>
                    </div>
                  )}

                  {/* Hover Overlay with Delete & Open */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                    <span className="text-amber-300 text-xs flex items-center space-x-1 font-medium">
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Full</span>
                    </span>
                    <button
                      onClick={(e) => handleDeleteMedia(item.id, e)}
                      title="Permanently Delete Memory"
                      className="p-1.5 rounded-lg bg-rose-950/90 text-rose-300 hover:bg-rose-900 border border-rose-800 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details Footer */}
                <div className="p-4 bg-stone-900/60 text-xs">
                  <p className="font-semibold text-stone-100 truncate text-sm">
                    {item.caption || item.original_name}
                  </p>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-stone-400 font-mono">
                    <span>{new Date(item.created_at || item.memory_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                    <span>{formatFileSize(item.size_bytes || item.file_size)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Memory Detail Modal */}
      <MemoryDetailModal
        memory={selectedMedia}
        onClose={() => setSelectedMedia(null)}
        onDelete={(id) => handleDeleteMedia(id)}
        token={token}
      />

    </div>
  );
}
