import React from 'react';
import { BookOpen, Camera, Video, Heart, Clock, X } from 'lucide-react';

export default function ActionSheetModal({ isOpen, onClose, onSelectAction }) {
  if (!isOpen) return null;

  const actions = [
    {
      id: 'diary',
      title: 'Write Diary',
      subtitle: 'Pour thoughts into your notebook',
      icon: BookOpen,
      color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300/60'
    },
    {
      id: 'photo',
      title: 'Add Photo',
      subtitle: 'Capture a picture or moment',
      icon: Camera,
      color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300/60'
    },
    {
      id: 'video',
      title: 'Add Video',
      subtitle: 'Keep a live motion memory',
      icon: Video,
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300/60'
    },
    {
      id: 'memory',
      title: 'Create Memory',
      subtitle: 'Stories, dates, locations & tags',
      icon: Heart,
      color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300/60'
    },
    {
      id: 'capsule',
      title: 'Time Capsule',
      subtitle: 'Countdown to a future milestone',
      icon: Clock,
      color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300/60'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-md bg-paper-50 dark:bg-paper-900 rounded-t-3xl sm:rounded-3xl border-t sm:border border-stone-200/90 dark:border-stone-800 shadow-2xl p-6 space-y-4 animate-in slide-in-from-bottom-6 duration-200"
      >
        <div className="flex items-center justify-between pb-2 border-b border-stone-200/60 dark:border-stone-800">
          <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
            Create a New Moment
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={() => {
                  onSelectAction(act.id);
                  onClose();
                }}
                className="w-full flex items-center gap-4 p-3.5 rounded-2xl bg-white dark:bg-stone-800/60 hover:bg-paper-200 dark:hover:bg-stone-800 border border-stone-200/70 dark:border-stone-700/60 text-left transition group shadow-sm"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${act.color} group-hover:scale-105 transition`}>
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition">
                    {act.title}
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                    {act.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
