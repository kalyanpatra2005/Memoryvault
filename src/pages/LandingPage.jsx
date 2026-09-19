import React from 'react';
import { 
  ShieldCheck, Lock, Clock, Calendar, Heart, 
  ArrowRight, CheckCircle2, Search, Smartphone, 
  Layers, Sparkles, FolderLock, Cloud
} from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import Button from '../components/ui/Button';

export default function LandingPage({ onOpenAuth, onGuestEnter }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 lg:pb-24 border-b border-slate-200/80 dark:border-slate-800/80">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-50/60 via-violet-50/30 to-transparent dark:from-indigo-950/20 dark:via-slate-900/10 dark:to-transparent pointer-events-none blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/70 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Private Personal Memory Vault • Supabase Powered</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.15]">
            Your moments. Your story. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent">
              Your memory.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            TimeMemory is a calm, private space where you can securely save life moments, photos, dates, and milestones. Stored with PostgreSQL Row Level Security so only you can access them.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => onOpenAuth?.('register')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <Button
              size="lg"
              variant="secondary"
              onClick={() => onOpenAuth?.('login')}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4 text-indigo-500" />
              <span>Sign In</span>
            </Button>

            <button
              onClick={onGuestEnter}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition"
            >
              Try Instant Demo &rarr;
            </button>
          </div>

          {/* Value Highlights */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Strict Account Isolation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Cross-Device Cloud Sync</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Zero Tracking or Ads</span>
            </div>
          </div>

          {/* Product UI Preview Mockup */}
          <div className="mt-14 relative mx-auto max-w-4xl rounded-2xl p-2 bg-gradient-to-b from-slate-200/60 to-slate-300/40 dark:from-slate-800 dark:to-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl">
            <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800/80 p-5 sm:p-6 text-left">
              {/* Mockup Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <BrandLogo size={24} />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Timeline & Vault</h2>
                    <p className="text-[11px] text-slate-500">Encrypted personal storage</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>RLS Active</span>
                </span>
              </div>

              {/* Mockup Cards Grid */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">Travel</span>
                    <span>July 2026</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Trip to the Swiss Alps</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">Morning hike through Grindelwald with crystal clear views of the peaks...</p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-semibold text-rose-500">Family</span>
                    <span>May 2026</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Graduation Celebration</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">Family gathered around for dinner. A huge milestone achieved after four years...</p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-semibold text-amber-500">Milestone</span>
                    <span>January 2026</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">First Apartment Keys</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">Finally unlocked our first home. Unpacked the boxes and celebrated with pizza...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES */}
      <section className="py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Designed for longevity</h2>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Built with uncompromising privacy and calm aesthetics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
              <FolderLock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">PostgreSQL Row Level Security</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Every database query and storage download checks your authenticated identity. Even if someone inspects API calls or attempts URL tampering, other user accounts are mathematically inaccessible.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Chronological Timeline</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Browse your life moments grouped neatly by Year, Month, and Day. Rediscover what you were doing years ago with smooth scrolling and category filtering.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
              <Cloud className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Cross-Device Synchronization</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Upload a moment from your phone and view it immediately on your laptop or desktop. Log out safely knowing your data remains in your private cloud vault.
            </p>
          </div>
        </div>
      </section>

      {/* 3-STEP PROCESS */}
      <section className="py-16 bg-slate-100/70 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">How TimeMemory Works</h2>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">Three simple steps to build your permanent legacy.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-lg mb-4">
                1
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1.5 text-sm">Create Your Vault</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Sign up with your email. Your personal encryption key and database space are provisioned instantly.</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-lg mb-4">
                2
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1.5 text-sm">Add Moments & Stories</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Save photos, stories, dates, and locations. Tag favorites for instant access whenever you need them.</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-lg mb-4">
                3
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1.5 text-sm">Access on Any Device</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Log in securely anywhere. Your memories stay intact, beautifully formatted, and strictly confidential.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2.5">
          <BrandLogo size={22} />
          <span className="font-bold text-slate-800 dark:text-slate-200">TimeMemory</span>
          <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
        </div>

        <div className="flex items-center gap-6">
          <a href="#/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Privacy Policy</a>
          <a href="#/about" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">About</a>
          <button onClick={() => onOpenAuth?.('login')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Sign In</button>
        </div>
      </footer>
    </div>
  );
}
