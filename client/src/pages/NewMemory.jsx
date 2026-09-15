import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { 
  ArrowLeft, Upload, Image as ImageIcon, Film, 
  Calendar, MapPin, Lock, Globe, Check, AlertCircle 
} from 'lucide-react';

export default function NewMemory() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [memoryDate, setMemoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  // Media file state
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [mediaType, setMediaType] = useState('photo');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    const isVideo = selected.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'photo');
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleSaveMemory = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError('Please enter a title for your memory');

    setSaving(true);
    setError('');
    try {
      let uploadedUrl = null;
      let finalType = 'none';

      if (file) {
        const formData = new FormData();
        formData.append('media', file);
        const uploadRes = await api.post('/memories/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploadedUrl = uploadRes.data.mediaUrl;
        finalType = uploadRes.data.mediaType;
      }

      await api.post('/memories', {
        title,
        description,
        category: location.trim() || 'Personal',
        media_type: finalType,
        media_url: uploadedUrl,
        memory_date: memoryDate,
        is_public: isPublic ? 1 : 0,
      });

      navigate('/memories');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to preserve memory.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 animate-fade-in space-y-4">
      {/* ===================== TOP HEADER ===================== */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-[#cda869] hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-serif font-bold text-[#f4ede2]">Add Memory</h1>
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-serif flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ===================== FORM (Screen 7 Exact Match) ===================== */}
      <form onSubmit={handleSaveMemory} className="space-y-3.5">
        {/* Upload Box */}
        <div>
          <div className="border border-dashed border-[#3a3024] hover:border-[#cda869]/50 rounded-3xl p-5 text-center bg-[#17130f]/60 transition-all">
            {previewUrl ? (
              <div className="flex flex-col items-center">
                <div className="w-full h-44 rounded-2xl overflow-hidden bg-black mb-3 flex items-center justify-center">
                  {mediaType === 'video' ? (
                    <video src={previewUrl} controls className="w-full h-full object-contain" />
                  ) : (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                  )}
                </div>
                <label className="cursor-pointer text-xs font-serif text-[#cda869] hover:underline">
                  Change Photo or Video
                  <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center py-4">
                <div className="w-12 h-12 rounded-2xl bg-[#cda869]/10 text-[#cda869] flex items-center justify-center text-2xl mb-2">
                  <ImageIcon className="w-6 h-6 stroke-[1.5]" />
                </div>
                <span className="text-xs font-serif font-bold text-[#f4ede2] mb-0.5">
                  Add Photo / Video
                </span>
                <span className="text-[10px] font-serif text-[#8f7e69]">
                  Tap to upload or drag and drop
                </span>
                <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-[11px] font-serif text-[#cda869] mb-1 font-medium">Title</label>
          <input
            type="text"
            required
            placeholder="Enter a title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#1b1713] border border-[#2c241c] rounded-2xl px-4 py-2.5 text-xs text-[#f5ede0] placeholder-[#6b6051] focus:border-[#cda869] outline-none font-serif"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-[11px] font-serif text-[#cda869] mb-1 font-medium">Description</label>
          <textarea
            rows={3}
            placeholder="Write something about this memory..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#1b1713] border border-[#2c241c] rounded-2xl px-4 py-2.5 text-xs text-[#f5ede0] placeholder-[#6b6051] focus:border-[#cda869] outline-none font-serif resize-none"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-[11px] font-serif text-[#cda869] mb-1 font-medium">Date</label>
          <div className="relative">
            <input
              type="date"
              required
              value={memoryDate}
              onChange={(e) => setMemoryDate(e.target.value)}
              className="w-full bg-[#1b1713] border border-[#2c241c] rounded-2xl px-4 py-2.5 text-xs text-[#f5ede0] focus:border-[#cda869] outline-none font-serif"
            />
          </div>
        </div>

        {/* Location (optional) */}
        <div>
          <label className="block text-[11px] font-serif text-[#cda869] mb-1 font-medium">Location (optional)</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Enter location (e.g. Manali, Paris)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-[#1b1713] border border-[#2c241c] rounded-2xl px-4 py-2.5 text-xs text-[#f5ede0] placeholder-[#6b6051] focus:border-[#cda869] outline-none font-serif"
            />
          </div>
        </div>

        {/* Visibility (Radio selector matching Screen 7) */}
        <div>
          <label className="block text-[11px] font-serif text-[#cda869] mb-2 font-medium">Visibility</label>
          
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 bg-[#1b1713] border border-[#2c241c] rounded-2xl cursor-pointer">
              <input
                type="radio"
                name="visibility"
                checked={!isPublic}
                onChange={() => setIsPublic(false)}
                className="accent-[#cda869] w-4 h-4"
              />
              <div className="flex items-center gap-2 text-xs font-serif text-[#f4ede2]">
                <Lock className="w-3.5 h-3.5 text-[#cda869]" />
                <span>Private (only you)</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-[#1b1713] border border-[#2c241c] rounded-2xl cursor-pointer">
              <input
                type="radio"
                name="visibility"
                checked={isPublic}
                onChange={() => setIsPublic(true)}
                className="accent-[#cda869] w-4 h-4"
              />
              <div className="flex items-center gap-2 text-xs font-serif text-[#f4ede2]">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Public (everyone can see)</span>
              </div>
            </label>
          </div>
        </div>

        {/* Save Memory Button (Solid Gold) */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-2xl bg-[#cda869] hover:bg-[#bfa058] text-[#120f0b] font-serif font-bold text-xs tracking-wide shadow-lg shadow-black/40 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
        >
          {saving ? 'Preserving in Vault…' : 'Save Memory'}
        </button>
      </form>
    </div>
  );
}
