import React from 'react';
import { Shield, Lock, BookOpen, Clock, Film, Heart, Sparkles, KeyRound, EyeOff, CheckCircle } from 'lucide-react';

export default function LandingPage({ onOpenAuth, onGuestEnter }) {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Subtle atmospheric background gradient & vignette */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40 bg-[radial-gradient(circle_at_50%_20%,rgba(180,83,9,0.15),transparent_70%)]" />
      
      {/* HERO SECTION */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 relative z-10 text-center">
        
        {/* Security / Privacy Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-950/60 border border-amber-800/60 text-amber-300 text-xs tracking-wider uppercase mb-8 shadow-sm">
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>Strictly Private • 100% Free • Permanent Storage</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold font-antique text-stone-100 tracking-tight max-w-4xl mx-auto leading-[1.15]">
          A Sanctuary for Your Memories, <br />
          <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent italic font-serif">
            A Time Capsule for Your Soul.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-xl text-stone-400 max-w-2xl mx-auto font-serif leading-relaxed">
          Some memories are too precious to be lost to time. Others are too tragic to speak aloud.
          Vault your photographs, timeless videos, and heartfelt personal diaries in an unbreakable, forever-free private archive.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onOpenAuth('login')}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-stone-950 font-bold text-base shadow-xl shadow-amber-950/70 hover:brightness-110 hover:scale-[1.02] transition-all border border-amber-300/40 flex items-center justify-center space-x-2"
          >
            <KeyRound className="w-5 h-5 text-stone-900" />
            <span>Unlock Vault (Sign In)</span>
          </button>
          <button
            onClick={() => onOpenAuth('register')}
            className="w-full sm:w-auto px-6 py-4 rounded-xl bg-stone-900/90 text-amber-200 hover:text-amber-100 font-semibold text-base border border-amber-800/60 hover:border-amber-600/80 transition-all flex items-center justify-center space-x-2"
          >
            <span>Create New Vault</span>
          </button>
          <button
            onClick={onGuestEnter}
            className="w-full sm:w-auto px-6 py-4 rounded-xl bg-stone-900/80 hover:bg-stone-800/90 text-stone-300 hover:text-amber-200 font-medium text-base border border-stone-700/60 hover:border-amber-700/60 transition-all flex items-center justify-center space-x-2"
          >
            <Shield className="w-5 h-5 text-emerald-400" />
            <span>Instant Vault (No Login Needed)</span>
          </button>
        </div>

        {/* Privacy Promise Banner */}
        <div className="mt-14 max-w-xl mx-auto p-4 rounded-xl bg-stone-900/70 border border-stone-800 text-stone-300 text-xs flex items-center justify-around flex-wrap gap-3">
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-stone-300 font-medium">No Subscription Ever</span>
          </div>
          <div className="flex items-center space-x-1.5 text-amber-400">
            <EyeOff className="w-4 h-4" />
            <span className="text-stone-300 font-medium">Only You Can See Your Uploads</span>
          </div>
          <div className="flex items-center space-x-1.5 text-blue-400">
            <Lock className="w-4 h-4" />
            <span className="text-stone-300 font-medium">Permanent Retention</span>
          </div>
        </div>
      </div>

      {/* THREE PILLARS / KEY FEATURES */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-stone-800/80">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold font-antique text-amber-100">
            The Three Chambers of Your Vault
          </h2>
          <p className="text-stone-400 text-sm mt-2 max-w-lg mx-auto">
            Engineered with uncompromising security to safeguard your most intimate moments for decades to come.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Feature 1: The Tragic & Beautiful Diary */}
          <div className="relative group p-6 rounded-2xl bg-gradient-to-b from-stone-900/90 to-stone-950 border border-amber-900/40 hover:border-amber-600/60 transition-all duration-300 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-700/50 flex items-center justify-center text-amber-300 mb-5 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="text-xs font-mono uppercase tracking-widest text-amber-500 mb-1">Antique & Poignant</div>
            <h3 className="text-xl font-bold font-antique text-stone-100 mb-3">
              The Tragic & Beautiful Diary
            </h3>
            <p className="text-stone-400 text-sm leading-relaxed mb-4">
              Step into an evocative, vintage parchment writing desk. Featuring nostalgic candlelight flicker, ambient rain soundscapes, and mood seals to express raw thoughts, bittersweet heartbreaks, and unspoken truths.
            </p>
            <div className="inline-flex items-center space-x-1 text-xs text-amber-400/90 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Vintage parchment & ambient vibe</span>
            </div>
          </div>

          {/* Feature 2: Photo & Video Vault */}
          <div className="relative group p-6 rounded-2xl bg-gradient-to-b from-stone-900/90 to-stone-950 border border-amber-900/40 hover:border-amber-600/60 transition-all duration-300 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-700/50 flex items-center justify-center text-amber-300 mb-5 group-hover:scale-110 transition-transform">
              <Film className="w-6 h-6" />
            </div>
            <div className="text-xs font-mono uppercase tracking-widest text-amber-500 mb-1">Permanent Visual Archive</div>
            <h3 className="text-xl font-bold font-antique text-stone-100 mb-3">
              Photo & Video Vault
            </h3>
            <p className="text-stone-400 text-sm leading-relaxed mb-4">
              Store high-definition photographs and family/personal videos permanently. Isolated strictly to your user account so no outside eyes can ever see them unless you choose to share.
            </p>
            <div className="inline-flex items-center space-x-1 text-xs text-amber-400/90 font-medium">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Stays permanent until you delete</span>
            </div>
          </div>

          {/* Feature 3: Time Capsule */}
          <div className="relative group p-6 rounded-2xl bg-gradient-to-b from-stone-900/90 to-stone-950 border border-amber-900/40 hover:border-amber-600/60 transition-all duration-300 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-700/50 flex items-center justify-center text-amber-300 mb-5 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <div className="text-xs font-mono uppercase tracking-widest text-amber-500 mb-1">Future Messages</div>
            <h3 className="text-xl font-bold font-antique text-stone-100 mb-3">
              Sealed Time Capsules
            </h3>
            <p className="text-stone-400 text-sm leading-relaxed mb-4">
              Seal letters, media, and promises into the future with an unlock date. Live countdown timers keep the mystery guarded until the exact day arrives to unseal your memory.
            </p>
            <div className="inline-flex items-center space-x-1 text-xs text-amber-400/90 font-medium">
              <Lock className="w-3.5 h-3.5" />
              <span>Tamper-proof time lock</span>
            </div>
          </div>

        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-stone-900 py-8 text-center text-xs text-stone-500">
        <p>Memory Vault &copy; Kalyan 2026. Private, Permanent, and Sacred Personal Archives.</p>
        <p className="mt-1 text-stone-600">All rights reserved. Your data stays strictly yours.</p>
      </footer>
    </div>
  );
}
