import React from 'react';
import { 
  ShieldCheck, Lock, Clock, BookOpen, Film, Heart, 
  Sparkles, KeyRound, EyeOff, CheckCircle, ArrowRight, 
  Calendar, Layers, Zap, Smartphone, ChevronRight
} from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

export default function LandingPage({ onOpenAuth, onGuestEnter }) {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden text-stone-200">
      
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-amber-500/10 via-amber-600/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* HERO SECTION */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-20 text-center">
        
        {/* Top Innovation Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-900/90 border border-amber-500/30 text-amber-300 text-xs font-mono tracking-wider uppercase mb-8 shadow-lg shadow-amber-950/20 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Private Cloud Archive • Permanent & Always Free</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold font-sans text-stone-100 tracking-tight max-w-4xl mx-auto leading-[1.12]">
          Every Moment Deserves <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
            An Eternal Home.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-xl text-stone-400 max-w-2xl mx-auto font-sans leading-relaxed">
          Time passes in an instant, but your memories don't have to fade. 
          <strong className="text-stone-200 font-semibold"> TimeMemory</strong> is your private sanctuary for photographs, milestone timelines, heartfelt diaries, and future time capsules.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
          <button
            onClick={() => onOpenAuth('register')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-stone-950 font-bold text-base shadow-xl shadow-amber-950/60 hover:brightness-110 hover:scale-[1.02] transition border border-amber-400/40 flex items-center justify-center gap-2 group"
          >
            <span>Start Preserving Free</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => onOpenAuth('login')}
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-stone-900/90 hover:bg-stone-800 text-stone-200 hover:text-amber-200 font-semibold text-base border border-stone-700/80 hover:border-amber-500/50 transition flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>Sign In to Vault</span>
          </button>

          <button
            onClick={onGuestEnter}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-stone-950/60 hover:bg-stone-900/80 text-stone-400 hover:text-stone-200 font-medium text-base border border-stone-800/80 transition flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Instant Guest Demo</span>
          </button>
        </div>

        {/* Trust & Guarantee Indicators */}
        <div className="mt-12 max-w-xl mx-auto flex items-center justify-center flex-wrap gap-5 text-xs text-stone-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>100% Free Forever</span>
          </div>
          <span className="text-stone-700 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Strict User Account Privacy</span>
          </div>
          <span className="text-stone-700 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-sky-400" />
            <span>Access on Mobile & Laptop</span>
          </div>
        </div>

        {/* HERO VISUAL MOCKUP: Floating Memory Showcase */}
        <div className="mt-14 relative max-w-4xl mx-auto">
          <div className="p-3 sm:p-4 rounded-3xl bg-stone-900/40 border border-white/10 shadow-2xl backdrop-blur-md">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              
              {/* Mockup Card 1: Visual Memory */}
              <div className="glass-card rounded-2xl p-4 border border-amber-500/20 hover:border-amber-500/40 transition">
                <div className="h-32 rounded-xl bg-stone-950 overflow-hidden relative mb-3 border border-stone-800">
                  <img 
                    src="/images/mountain_lake.jpg" 
                    alt="Sample Memory" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80";
                    }}
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-stone-950/80 text-[10px] font-mono text-amber-300 border border-amber-500/30">
                    Travel
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono mb-1">
                  <span>August 14, 2026</span>
                  <Heart className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </div>
                <h4 className="text-sm font-bold text-stone-100">Sunset at Lake Tahoe</h4>
                <p className="text-xs text-stone-400 line-clamp-2 mt-1">
                  Campfire by the shore with everyone. The golden light over the mountains felt surreal.
                </p>
              </div>

              {/* Mockup Card 2: Antique Diary Writing */}
              <div className="glass-card rounded-2xl p-4 border border-amber-500/30 shadow-lg relative bg-gradient-to-b from-stone-900/90 to-amber-950/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono">
                    <BookOpen className="w-4 h-4" />
                    <span>Secret Diary</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/40">
                    🥀 Nostalgia
                  </span>
                </div>
                <h4 className="text-sm font-bold text-stone-100 font-antique">Midnight Reflections</h4>
                <p className="text-xs text-stone-300 font-serif italic mt-2 leading-relaxed">
                  "Some words are too delicate to speak aloud. They belong on this digital parchment, kept safe under the candlelight..."
                </p>
                <div className="mt-4 pt-3 border-t border-stone-800 text-[10px] text-stone-400 font-mono flex items-center justify-between">
                  <span>Candlelit Audio Desk</span>
                  <span className="text-emerald-400">Locked & Private</span>
                </div>
              </div>

              {/* Mockup Card 3: Time Capsule */}
              <div className="glass-card rounded-2xl p-4 border border-amber-500/20 hover:border-amber-500/40 transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono">
                    <Clock className="w-4 h-4" />
                    <span>Time Capsule</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/40">
                    Sealed
                  </span>
                </div>
                <h4 className="text-sm font-bold text-stone-100">Letter to Future Self</h4>
                <p className="text-xs text-stone-400 mt-1">
                  Promises made at age 22. Unlocking on New Year's Eve with sealed photo and memories.
                </p>
                <div className="mt-4 p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 text-[11px] font-mono text-amber-300 flex items-center justify-between">
                  <span>Countdown:</span>
                  <span className="text-amber-400 font-bold">142d : 08h : 31m</span>
                </div>
              </div>

            </div>

          </div>
        </div>

      </section>

      {/* THREE PILLARS / HOW TIME MEMORY WORKS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-stone-800/80">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold font-sans text-stone-100 tracking-tight">
            Designed Around the Essence of Time
          </h2>
          <p className="text-stone-400 text-sm sm:text-base mt-2 max-w-xl mx-auto">
            Traditional cloud drives dump files in cold folders. TimeMemory organizes your life chronologically so you can relive milestones exactly as they happened.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Pillar 1: Chronological Timeline */}
          <div className="p-8 rounded-3xl bg-stone-900/60 border border-stone-800 hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-300 mb-6 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-semibold">
                Chronological Memory Stream
              </span>
              <h3 className="text-xl font-bold text-stone-100 mt-2 mb-3">
                The Milestone Timeline
              </h3>
              <p className="text-stone-400 text-xs sm:text-sm leading-relaxed">
                Relive your years and months in clean sequence. Every photo, milestone, or celebration is placed onto an interactive spine with instant search and category filters.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-800/80 text-xs text-amber-400 font-medium flex items-center gap-1">
              <span>Explore by Year & Month</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Pillar 2: High-Definition Media Vault */}
          <div className="p-8 rounded-3xl bg-stone-900/60 border border-stone-800 hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-300 mb-6 group-hover:scale-110 transition-transform">
                <Film className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-semibold">
                Uncompressed Media Vault
              </span>
              <h3 className="text-xl font-bold text-stone-100 mt-2 mb-3">
                Photos & Personal Videos
              </h3>
              <p className="text-stone-400 text-xs sm:text-sm leading-relaxed">
                Upload your favorite high-resolution memories without worrying about monthly storage fees. Client-side canvas optimization guarantees fast uploads from mobile devices.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-800/80 text-xs text-amber-400 font-medium flex items-center gap-1">
              <span>Stream & Download Anytime</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Pillar 3: Reflective Secret Diary & Time Capsules */}
          <div className="p-8 rounded-3xl bg-stone-900/60 border border-stone-800 hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-300 mb-6 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-semibold">
                Nostalgia & Reflection
              </span>
              <h3 className="text-xl font-bold text-stone-100 mt-2 mb-3">
                Diary & Time Capsules
              </h3>
              <p className="text-stone-400 text-xs sm:text-sm leading-relaxed">
                A serene candlelit writing sanctuary with ambient rain soundscapes. Seal letters to your future self with countdown locks that keep your thoughts guarded until the day comes.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-800/80 text-xs text-amber-400 font-medium flex items-center gap-1">
              <span>Time-Locked & Tamper-Proof</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS (3 STEPS) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-100">
            How TimeMemory Works
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Preserving a lifetime of moments in three effortless steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-stone-900/50 border border-stone-800 relative">
            <span className="text-3xl font-bold font-mono text-amber-500/30">01</span>
            <h4 className="text-base font-bold text-stone-100 mt-2 mb-1">Upload or Write</h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              Deposit your favorite photo, video, or write your inner feelings into the candlelit diary.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-stone-900/50 border border-stone-800 relative">
            <span className="text-3xl font-bold font-mono text-amber-500/30">02</span>
            <h4 className="text-base font-bold text-stone-100 mt-2 mb-1">Time Tag & Organize</h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              Tag by category (Travel, Family, Milestone) and date. Moments automatically sort onto your timeline.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-stone-900/50 border border-stone-800 relative">
            <span className="text-3xl font-bold font-mono text-amber-500/30">03</span>
            <h4 className="text-base font-bold text-stone-100 mt-2 mb-1">Access on Any Device</h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              Log in from your phone, laptop, or tablet. Your memories are backed up permanently to the cloud.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950 border border-amber-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <BrandLogo size="lg" className="justify-center mb-6" />

          <h2 className="text-2xl sm:text-4xl font-bold text-stone-100 tracking-tight">
            Begin Preserving Your Life's Moments Today.
          </h2>
          <p className="text-stone-400 text-xs sm:text-sm mt-3 max-w-md mx-auto">
            Free forever. No subscription fees. Your personal memories remain private to you alone.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-stone-950 font-bold text-sm shadow-lg shadow-amber-950/60 hover:brightness-110 transition"
            >
              Create Free Account
            </button>
            <button
              onClick={() => onOpenAuth('login')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-200 border border-stone-700 text-sm font-medium transition"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-stone-900 py-8 text-center text-xs text-stone-500">
        <p>TimeMemory &copy; 2026. Private, Permanent, and Sacred Personal Archives.</p>
        <p className="mt-1 text-stone-600">Built with uncompromising privacy and eternal retention.</p>
      </footer>

    </div>
  );
}
