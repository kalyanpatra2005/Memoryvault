import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../api';

const categoryStyles = {
  Personal:  'bg-violet-500/20 text-violet-300',
  Travel:    'bg-sky-500/20 text-sky-300',
  Work:      'bg-emerald-500/20 text-emerald-300',
  Family:    'bg-pink-500/20 text-pink-300',
  Milestone: 'bg-amber-500/20 text-amber-300',
  Other:     'bg-gray-500/20 text-gray-300',
};

export default function MemoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/memories/${id}`);
        setMemory(data);
      } catch (err) {
        navigate('/timeline');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this memory? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.delete(`/memories/${id}`);
      navigate('/timeline');
    } catch {
      alert('Failed to delete.');
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-4xl animate-pulse">💭</div>
    </div>
  );

  if (!memory) return null;

  const catStyle = categoryStyles[memory.category] || categoryStyles.Other;

  return (
    <div className="p-8 max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="glass-card p-2.5 rounded-xl text-violet-300 hover:text-white transition-colors flex items-center gap-2 text-sm">
          ← Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/memories/new?edit=${id}`)}
            className="glass-card px-4 py-2 rounded-xl text-violet-300 hover:text-white text-sm transition-all"
          >
            ✏️ Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl text-red-400 hover:bg-red-500/20 text-sm transition-all disabled:opacity-50"
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      {/* Photo carousel */}
      {memory.photos?.length > 0 && (
        <div className="mb-8 rounded-2xl overflow-hidden">
          <div className="relative h-80">
            <img
              src={memory.photos[activePhoto]}
              alt={memory.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            {memory.photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {memory.photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === activePhoto ? 'bg-white scale-125' : 'bg-white/40'}`}
                  />
                ))}
              </div>
            )}
          </div>
          {memory.photos.length > 1 && (
            <div className="flex gap-2 p-3 bg-black/20">
              {memory.photos.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  onClick={() => setActivePhoto(i)}
                  className={`w-16 h-16 rounded-lg object-cover cursor-pointer transition-all ${i === activePhoto ? 'ring-2 ring-violet-500 opacity-100' : 'opacity-50 hover:opacity-80'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Memory content */}
      <div className="glass-card rounded-2xl p-8">
        {/* Mood + Title */}
        <div className="flex items-start gap-4 mb-6">
          {(!memory.photos?.length) && (
            <div className="text-5xl">{memory.mood || '💭'}</div>
          )}
          <div className="flex-1">
            <h1 className="text-white text-2xl font-bold mb-2">{memory.title}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${catStyle}`}>{memory.category}</span>
              <span className="text-violet-400/60 text-sm">
                📅 {format(new Date(memory.memory_date), 'MMMM d, yyyy')}
              </span>
              {memory.photos?.length > 0 && (
                <span className="text-violet-400/60 text-sm">{memory.mood}</span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {memory.description && (
          <div className="mb-6">
            <p className="text-violet-200/80 leading-relaxed text-sm whitespace-pre-wrap">{memory.description}</p>
          </div>
        )}

        {/* Tags */}
        {memory.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {memory.tags.map(tag => (
              <span key={tag} className="bg-violet-500/10 text-violet-300/70 text-xs px-3 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <p className="text-violet-500/40 text-xs border-t border-white/5 pt-4">
          Saved {format(new Date(memory.created_at), 'MMM d, yyyy · h:mm a')}
        </p>
      </div>
    </div>
  );
}
