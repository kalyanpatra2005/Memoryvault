import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const categoryStyles = {
  Personal:  { bg: 'bg-violet-500/20', text: 'text-violet-300', dot: 'bg-violet-400' },
  Travel:    { bg: 'bg-sky-500/20',    text: 'text-sky-300',    dot: 'bg-sky-400' },
  Work:      { bg: 'bg-emerald-500/20',text: 'text-emerald-300',dot: 'bg-emerald-400' },
  Family:    { bg: 'bg-pink-500/20',   text: 'text-pink-300',   dot: 'bg-pink-400' },
  Milestone: { bg: 'bg-amber-500/20',  text: 'text-amber-300',  dot: 'bg-amber-400' },
  Other:     { bg: 'bg-gray-500/20',   text: 'text-gray-300',   dot: 'bg-gray-400' },
};

export default function MemoryCard({ memory, onDelete, compact = false }) {
  const navigate = useNavigate();
  const photo = memory.photos?.[0];
  const style = categoryStyles[memory.category] || categoryStyles.Other;

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(memory.id);
  };

  if (compact) {
    return (
      <div
        onClick={() => navigate(`/memories/${memory.id}`)}
        className="flex items-center gap-4 glass-card rounded-2xl p-4 cursor-pointer hover:border-violet-500/40 hover-lift group transition-all"
      >
        {photo ? (
          <img src={photo} alt={memory.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-800/60 to-purple-900/60 flex items-center justify-center text-2xl flex-shrink-0">
            {memory.mood || '💭'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm truncate">{memory.title}</h3>
          <p className="text-violet-300/70 text-xs mt-0.5 line-clamp-1">{memory.description}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-xs px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>{memory.category}</span>
            <span className="text-violet-500 text-xs">{format(new Date(memory.memory_date), 'MMM d, yyyy')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => navigate(`/memories/${memory.id}`)}
      className="glass-card rounded-2xl overflow-hidden cursor-pointer hover:border-violet-500/40 hover-lift group transition-all animate-fade-in"
    >
      {/* Photo / Mood cover */}
      {photo ? (
        <div className="h-44 overflow-hidden relative">
          <img
            src={photo}
            alt={memory.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute top-3 right-3 text-2xl">{memory.mood}</div>
        </div>
      ) : (
        <div className="h-44 bg-gradient-to-br from-violet-900/50 to-indigo-900/50 flex items-center justify-center relative">
          <span className="text-5xl opacity-60">{memory.mood || '💭'}</span>
          <div className="absolute inset-0 opacity-5" style={{backgroundImage:'radial-gradient(circle at 50% 50%, #7c3aed 1px, transparent 1px)', backgroundSize:'24px 24px'}} />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <h3 className="text-white font-semibold text-sm mb-1 line-clamp-1">{memory.title}</h3>
        {memory.description && (
          <p className="text-violet-300/60 text-xs mb-3 line-clamp-2 leading-relaxed">{memory.description}</p>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${style.bg} ${style.text}`}>
            {memory.category}
          </span>
          <span className="text-violet-400/60 text-xs">
            {format(new Date(memory.memory_date), 'MMM d, yyyy')}
          </span>
        </div>
        {onDelete && (
          <button
            onClick={handleDelete}
            className="mt-2 w-full text-xs text-red-400/60 hover:text-red-400 py-1 rounded-lg hover:bg-red-500/10 transition-all"
          >
            🗑 Delete
          </button>
        )}
      </div>
    </div>
  );
}
