import React from 'react';
import { ArrowLeft, Clock, Heart, Shield, Sparkles } from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';
import Button from '../../components/ui/Button';

export default function AboutPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 px-4 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate?.('/')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="h-4 w-px bg-slate-200 dark:border-slate-800" />
            <div className="flex items-center gap-2">
              <BrandLogo size={20} />
              <span className="font-bold text-sm">TimeMemory</span>
            </div>
          </div>
          <Button size="sm" onClick={() => onNavigate?.('/register')}>
            Get Started
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-3 border border-indigo-200 dark:border-indigo-800">
            <Clock className="w-3.5 h-3.5" />
            <span>Our Philosophy</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Preserving What Truly Matters</h1>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            In an era where personal moments are scattered across noisy social feeds, ephemeral stories, and endless camera rolls, <strong className="text-slate-900 dark:text-white">TimeMemory</strong> was created as a peaceful antidote.
          </p>
        </div>

        <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 text-sm leading-relaxed">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Why TimeMemory?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              We believe a memory vault should feel calm, respectful, and timeless. No gamification badges, no notifications demanding your attention, no social pressure. Just a quiet, beautiful library of your life: family celebrations, travel adventures, quiet mornings, and personal milestones.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-rose-500" />
              Built for Generations
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              By separating memories into clean chronological timelines (Year &rarr; Month &rarr; Day) and storing high-resolution photographs alongside your reflections, TimeMemory ensures that ten, twenty, or fifty years from now, you can re-experience your journey with the exact clarity and warmth with which it happened.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              Privacy as a Constitutional Right
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              Every design decision in TimeMemory reflects our respect for user autonomy. We leverage PostgreSQL Row Level Security to make data leaks architecturally impossible.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
