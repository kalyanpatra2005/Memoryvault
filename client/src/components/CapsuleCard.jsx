import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow, isPast, differenceInDays } from 'date-fns';

const categoryIcons = {
  'Future Self': '🔮',
  Family:        '👨‍👩‍👧',
  Milestones:    '🏆',
  Travel:        '✈️',
  Love:          '❤️',
  Other:         '📦',
};

export default function CapsuleCard({ capsule, onClick, onDelete }) {
  const navigate = useNavigate();
  const unlockDate = new Date(capsule.unlock_date);
  const isUnlocked = isPast(unlockDate) || capsule.is_opened;
  const daysLeft = differenceInDays(unlockDate, new Date());
  const catIcon = categoryIcons[capsule.category] || '📦';

  const handleClick = () => {
    if (onClick) onClick(capsule);
    else navigate(`/capsules`);
  };

  return (
    <div
      onClick={handleClick}
      className={`glass-card rounded-2xl p-5 cursor-pointer transition-all hover-lift animate-fade-in ${
        isUnlocked
          ? 'border-amber-500/30 hover:border-amber-400/60 hover:shadow-amber-500/15 hover:shadow-lg'
          : 'hover:border-violet-500/40 hover:shadow-violet-500/10 hover:shadow-lg'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-all ${
          isUnlocked
            ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/20'
            : 'bg-violet-500/15'
        }`}>
          {isUnlocked ? '🔓' : '🔒'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm mb-0.5 truncate">{capsule.title}</h3>
          <p className="text-violet-400/70 text-xs mb-2">{catIcon} {capsule.category}</p>

          {isUnlocked ? (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-400 text-xs font-medium">Ready to open!</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-500" />
              <span className="text-violet-300/70 text-xs">
                {daysLeft > 0 ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining` : 'Opening soon…'}
              </span>
            </div>
          )}
        </div>

        {/* Date */}
        <div className="text-right flex-shrink-0">
          <p className={`text-sm font-bold ${isUnlocked ? 'text-amber-400' : 'text-violet-300'}`}>
            {format(unlockDate, 'MMM d')}
          </p>
          <p className="text-violet-500 text-xs">{format(unlockDate, 'yyyy')}</p>
          {onDelete && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(capsule.id); }}
              className="mt-1 text-xs text-red-400/50 hover:text-red-400 transition-colors"
            >
              🗑
            </button>
          )}
        </div>
      </div>

      {/* Progress bar for locked capsules */}
      {!isUnlocked && (
        <div className="mt-4">
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-purple-400 rounded-full transition-all"
              style={{
                width: `${Math.min(100, Math.max(5, 100 - (daysLeft / 365) * 100))}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
