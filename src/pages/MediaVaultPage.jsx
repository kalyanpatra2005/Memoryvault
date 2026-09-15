import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { vaultEngine, safeFetchJson } from '../services/vaultEngine';
import { 
  Film, Image as ImageIcon, UploadCloud, Trash2, Eye, ShieldCheck, 
  Lock, Play, Calendar, HardDrive, Download, AlertTriangle, CheckCircle 
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

  // Selected media for modal viewer
  const [selectedMedia, setSelectedMedia] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchMedia();
  }, [filterType]);

  const fetchMedia = async () => {
    try {
      let serverMedia = [];
      try {
        const url = filterType === 'all' ? '/api/media' : `/api/media?type=${filterType}`;
        const res = await authFetch(url);
        const data = await safeFetchJson(res);
        if (res.ok && data && data.media) {
          serverMedia = data.media;
        }
      } catch (e) {}

      let localMedia = [];
      try {
        localMedia = await vaultEngine.getVaultItems(token, user?.id || 'guest');
      } catch (e) {}

      // Combine server & local items
      const map = new Map();
      serverMedia.forEach(item => {
        map.set(String(item.id), {
          ...item,
          media_type: item.media_type || (item.mime_type?.startsWith('video/') ? 'video' : 'photo'),
          media_url: `/api/media/stream/${item.id}?token=${token}`
        });
      });

      localMedia.forEach(item => {
        const itemType = item.media_type || item.type || 'photo';
        if (!map.has(String(item.id))) {
          if (filterType === 'all' || itemType === filterType) {
            map.set(String(item.id), {
              ...item,
              media_type: itemType,
              media_url: item.data_url || item.media_url || item.file_url
            });
          }
        }
      });

      const list = Array.from(map.values());
      list.sort((a, b) => new Date(b.created_at || b.memory_date) - new Date(a.created_at || a.memory_date));
      setMediaList(list);
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
      // 1. Try server upload first if available
      let serverSuccess = false;
      try {
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
          formData.append('files', files[i]);
        }
        if (uploadCaption.trim()) {
          formData.append('caption', uploadCaption.trim());
        }

        const res = await fetch('/api/media/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });

        const data = await safeFetchJson(res);
        if (res.ok && data && data.media && data.media.length > 0) {
          serverSuccess = true;
          uploadedCount = data.media.length;
        }
      } catch (serverErr) {
        console.warn('Server upload unavailable, falling back to local vault:', serverErr);
      }

      // 2. Fallback to permanent local vaultEngine (IndexedDB)
      if (!serverSuccess) {
        for (let i = 0; i < files.length; i++) {
          await vaultEngine.uploadVaultItem(
            token,
            user?.id || 'guest',
            files[i],
            uploadCaption.trim() || files[i].name,
            new Date().toISOString().split('T')[0],
            ''
          );
          uploadedCount++;
        }
      }

      setUploadSuccess(`${uploadedCount} memory item(s) permanently vaulted.`);
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
      await authFetch(`/api/media/${id}`, { method: 'DELETE' });
    } catch (err) {}

    try {
      await vaultEngine.deleteVaultItem(token, id, user?.id || 'guest');
    } catch (err) {}

    setMediaList(mediaList.filter(item => item.id !== id));
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

  // Build safe URL for streaming or local data URL
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-amber-400 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ENCRYPTED & PERMANENT VAULT</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-antique text-stone-100">
            Photos & Videos Vault
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 font-serif mt-1">
            Your personal visual history. Every file stays here permanently unless you choose to delete it.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center bg-stone-900 p-1 rounded-xl border border-stone-800">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filterType === 'all'
                ? 'bg-amber-900/60 text-amber-200 border border-amber-700/50 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            All Archive ({mediaList.length})
          </button>
          <button
            onClick={() => setFilterType('photo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1 ${
              filterType === 'photo'
                ? 'bg-amber-900/60 text-amber-200 border border-amber-700/50 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photos</span>
          </button>
          <button
            onClick={() => setFilterType('video')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1 ${
              filterType === 'video'
                ? 'bg-amber-900/60 text-amber-200 border border-amber-700/50 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Videos</span>
          </button>
        </div>
      </div>

      {/* UPLOAD BOX */}
      <div className="mb-10 p-6 sm:p-8 rounded-2xl bg-stone-900/90 border border-amber-900/30 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold font-antique text-amber-100 flex items-center space-x-2">
              <UploadCloud className="w-5 h-5 text-amber-400" />
              <span>Deposit Memories into the Vault</span>
            </h2>
            <p className="text-xs text-stone-400">
              Upload photos (JPG, PNG, GIF, WebP) and videos (MP4, WebM, MOV) up to 250MB each.
            </p>
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-800/40">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Private: Only accessible to your account</span>
          </div>
        </div>

        {uploadError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-200 text-xs">
            {uploadError}
          </div>
        )}

        {uploadSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center space-x-2">
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
              className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="file-upload-input"
            />
            <label
              htmlFor="file-upload-input"
              className={`w-full py-2.5 px-4 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-500 text-stone-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-950 flex items-center justify-center space-x-2 cursor-pointer transition border border-amber-400/40 ${
                uploading ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <UploadCloud className="w-4 h-4" />
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
          <h3 className="text-lg font-antique font-bold text-stone-300">Your visual vault is empty</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto font-serif">
            Deposit your old photos, heartfelt family videos, or treasured snapshots above. They will stay safe forever.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {mediaList.map((item) => {
            const isVideo = item.media_type === 'video';
            const mediaUrl = getMediaUrl(item);

            return (
              <div
                key={item.id}
                onClick={() => setSelectedMedia(item)}
                className="group relative rounded-2xl bg-stone-900 border border-amber-900/20 hover:border-amber-600/50 overflow-hidden shadow-xl cursor-pointer transition-all duration-300 flex flex-col justify-between"
              >
                {/* Media Preview Container */}
                <div className="relative aspect-square bg-stone-950 flex items-center justify-center overflow-hidden">
                  {isVideo ? (
                    <div className="relative w-full h-full bg-stone-950 flex items-center justify-center">
                      <video
                        src={mediaUrl}
                        preload="metadata"
                        className="w-full h-full object-cover opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-amber-600/90 text-stone-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 fill-stone-950 translate-x-0.5" />
                        </div>
                      </div>
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/70 text-amber-300 text-[10px] font-mono flex items-center space-x-1 border border-amber-700/40">
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
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/70 text-amber-300 text-[10px] font-mono flex items-center space-x-1 border border-amber-700/40">
                        <ImageIcon className="w-3 h-3" />
                        <span>PHOTO</span>
                      </span>
                    </div>
                  )}

                  {/* Hover Overlay with Delete & Open */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                    <span className="text-amber-200 text-xs font-serif flex items-center space-x-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Full</span>
                    </span>
                    <button
                      onClick={(e) => handleDeleteMedia(item.id, e)}
                      title="Permanently Delete Memory"
                      className="p-1.5 rounded-lg bg-rose-950/80 text-rose-300 hover:bg-rose-900 border border-rose-800 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details Footer */}
                <div className="p-3.5 bg-stone-900 text-xs">
                  <p className="font-semibold text-stone-200 truncate font-antique text-sm">
                    {item.caption || item.original_name}
                  </p>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-stone-400">
                    <span>{new Date(item.created_at || item.memory_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                    <span>{formatFileSize(item.size_bytes || item.file_size)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX & PLAYER MODAL */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-stone-900 border border-amber-900/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-stone-950">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono bg-amber-950 text-amber-300 border border-amber-800/60">
                  {selectedMedia.media_type}
                </span>
                <span className="text-sm font-antique font-bold text-stone-200 truncate max-w-md">
                  {selectedMedia.caption || selectedMedia.original_name}
                </span>
              </div>
              <button
                onClick={() => setSelectedMedia(null)}
                className="text-stone-400 hover:text-stone-100 p-1 rounded-lg hover:bg-stone-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Media Content */}
            <div className="flex-1 bg-black flex items-center justify-center overflow-auto p-2">
              {selectedMedia.media_type === 'video' ? (
                <video
                  controls
                  autoPlay
                  className="max-h-[65vh] w-auto max-w-full rounded"
                  src={getMediaUrl(selectedMedia)}
                />
              ) : (
                <img
                  src={getMediaUrl(selectedMedia)}
                  alt={selectedMedia.caption || selectedMedia.original_name}
                  className="max-h-[65vh] w-auto max-w-full object-contain rounded"
                />
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 bg-stone-950 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-stone-400">
                <p>Saved on: {new Date(selectedMedia.created_at || selectedMedia.memory_date).toLocaleString()}</p>
                <p className="text-[11px] text-stone-500">
                  Size: {formatFileSize(selectedMedia.size_bytes || selectedMedia.file_size)} • Format: {selectedMedia.mime_type}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <a
                  href={getMediaUrl(selectedMedia)}
                  download={selectedMedia.original_name || 'memory_vault_download'}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center space-x-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </a>
                <button
                  onClick={() => handleDeleteMedia(selectedMedia.id)}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 flex items-center space-x-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Permanently Delete</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
