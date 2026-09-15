import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import useAuthStore from '../store/authStore';
import { 
  Bell, Lock, Plus, Image as ImageIcon, Film, 
  Feather, Clock, Globe, ArrowRight, Sparkles 
} from 'lucide-react';

export default function Dashboard() {
  const { user, lockVault } = useAuthStore();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    memories: 12,
    photos: 48,
    videos: 8,
    diary: 5,
  });
  const [loading, setLoading] = useState(true);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Kalyan';
  const initials = user?.name ? user.name[0].toUpperCase() : 'K';

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [memRes, capRes, diaryRes] = await Promise.all([
          api.get('/memories/stats'),
          api.get('/capsules/stats'),
          api.get('/diary'),
        ]);

        setStats({
          memories: memRes.data.total || 12,
          photos: memRes.data.photos || 48,
          videos: memRes.data.videos || 8,
          diary: diaryRes.data.length || 5,
        });
      } catch (e) {
        console.warn('Using default demo stats:', e);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  return (
    <div className="p-4 sm:p-5 animate-fade-in space-y-5">
      {/* ===================== TOP PROFILE HEADER ===================== */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#cda869] to-[#8f7446] text-[#14110e] font-bold text-base flex items-center justify-center border-2 border-[#3d3224] shadow-md">
            {initials}
          </div>
          <div>
            <h2 className="text-base font-serif font-bold text-[#f4ede2] leading-tight">
              Hello, {firstName}
            </h2>
            <p className="text-[11px] font-serif italic text-[#baa995] leading-tight mt-0.5">
              "Some memories never fade..."
            </p>
          </div>
        </div>

        {/* Top Right: Security Lock & Bell */}
        <div className="flex items-center gap-2">
          <button
            onClick={lockVault}
            className="w-9 h-9 rounded-full bg-[#1e1a15] border border-[#31291e] flex items-center justify-center text-[#cda869] hover:text-white transition-all active:scale-95 shadow-sm"
            title="Lock Vault"
          >
            <Lock className="w-4 h-4" />
          </button>
          <button
            onClick={() => alert('Notifications: All your private archives are secured.')}
            className="w-9 h-9 rounded-full bg-[#1e1a15] border border-[#31291e] flex items-center justify-center text-[#baa995] hover:text-[#cda869] transition-all relative"
          >
            <Bell className="w-4 h-4" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#cda869] absolute top-2 right-2" />
          </button>
        </div>
      </div>

      {/* ===================== STATS ROW (4 Rounded Cards) ===================== */}
      <div className="grid grid-cols-4 gap-2">
        {/* Memories */}
        <div 
          onClick={() => navigate('/memories')}
          className="bg-[#1b1713] border border-[#2b241c] hover:border-[#cda869]/40 rounded-2xl p-2.5 text-center cursor-pointer transition-all active:scale-95"
        >
          <span className="text-sm">💭</span>
          <p className="text-sm font-serif font-bold text-[#f4ede2] mt-0.5">{stats.memories}</p>
          <p className="text-[9px] font-serif text-[#8f7e69] leading-tight">Memories</p>
        </div>

        {/* Photos */}
        <div 
          onClick={() => navigate('/photos')}
          className="bg-[#1b1713] border border-[#2b241c] hover:border-[#cda869]/40 rounded-2xl p-2.5 text-center cursor-pointer transition-all active:scale-95"
        >
          <span className="text-sm">📷</span>
          <p className="text-sm font-serif font-bold text-[#f4ede2] mt-0.5">{stats.photos}</p>
          <p className="text-[9px] font-serif text-[#8f7e69] leading-tight">Photos</p>
        </div>

        {/* Videos */}
        <div 
          onClick={() => navigate('/videos')}
          className="bg-[#1b1713] border border-[#2b241c] hover:border-[#cda869]/40 rounded-2xl p-2.5 text-center cursor-pointer transition-all active:scale-95"
        >
          <span className="text-sm">🎥</span>
          <p className="text-sm font-serif font-bold text-[#f4ede2] mt-0.5">{stats.videos}</p>
          <p className="text-[9px] font-serif text-[#8f7e69] leading-tight">Videos</p>
        </div>

        {/* Diary */}
        <div 
          onClick={() => navigate('/diary')}
          className="bg-[#1b1713] border border-[#2b241c] hover:border-[#cda869]/40 rounded-2xl p-2.5 text-center cursor-pointer transition-all active:scale-95"
        >
          <span className="text-sm">📖</span>
          <p className="text-sm font-serif font-bold text-[#f4ede2] mt-0.5">{stats.diary}</p>
          <p className="text-[9px] font-serif text-[#8f7e69] leading-tight">Diary</p>
        </div>
      </div>

      {/* ===================== HERO BANNER ("Capture what matters") ===================== */}
      <div 
        onClick={() => navigate('/memories/new')}
        className="w-full h-36 rounded-3xl overflow-hidden border border-[#31281e] relative cursor-pointer group shadow-xl active:scale-[0.99] transition-all"
      >
        <img
          src="/images/dashboard_hero.jpg"
          alt="Capture what matters"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 flex flex-col justify-end">
          <p className="font-serif italic font-bold text-lg text-[#f7f0e4] leading-tight">
            Capture<br />
            what matters
          </p>
          <span className="text-[10px] font-serif text-[#cda869] mt-1 flex items-center gap-1">
            <span>Preserve new moment</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* ===================== QUICK ACTIONS (3x2 Grid) ===================== */}
      <div>
        <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-[#cda869] mb-3">
          Quick Actions
        </h3>

        <div className="grid grid-cols-3 gap-2.5">
          {/* Action 1: Add Memory */}
          <button
            type="button"
            onClick={() => navigate('/memories/new')}
            className="bg-[#1b1713] border border-[#2c241c] hover:border-[#cda869]/50 p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all active:scale-95 shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-[#cda869]/10 text-[#cda869] flex items-center justify-center mb-1.5">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-serif font-semibold text-[#e8ded1] leading-tight">
              Add Memory
            </span>
          </button>

          {/* Action 2: Upload Photo */}
          <button
            type="button"
            onClick={() => navigate('/memories/new')}
            className="bg-[#1b1713] border border-[#2c241c] hover:border-[#cda869]/50 p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all active:scale-95 shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-[#cda869]/10 text-[#cda869] flex items-center justify-center mb-1.5">
              <ImageIcon className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-serif font-semibold text-[#e8ded1] leading-tight">
              Upload Photo
            </span>
          </button>

          {/* Action 3: Upload Video */}
          <button
            type="button"
            onClick={() => navigate('/memories/new')}
            className="bg-[#1b1713] border border-[#2c241c] hover:border-[#cda869]/50 p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all active:scale-95 shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-[#cda869]/10 text-[#cda869] flex items-center justify-center mb-1.5">
              <Film className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-serif font-semibold text-[#e8ded1] leading-tight">
              Upload Video
            </span>
          </button>

          {/* Action 4: Write Diary */}
          <button
            type="button"
            onClick={() => navigate('/diary')}
            className="bg-[#1b1713] border border-[#2c241c] hover:border-[#cda869]/50 p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all active:scale-95 shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-[#cda869]/10 text-[#cda869] flex items-center justify-center mb-1.5">
              <Feather className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-serif font-semibold text-[#e8ded1] leading-tight">
              Write in Diary
            </span>
          </button>

          {/* Action 5: Time Capsule */}
          <button
            type="button"
            onClick={() => navigate('/capsules')}
            className="bg-[#1b1713] border border-[#2c241c] hover:border-[#cda869]/50 p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all active:scale-95 shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-[#cda869]/10 text-[#cda869] flex items-center justify-center mb-1.5">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-serif font-semibold text-[#e8ded1] leading-tight">
              Time Capsule
            </span>
          </button>

          {/* Action 6: Secret Vault */}
          <button
            type="button"
            onClick={lockVault}
            className="bg-[#1b1713] border border-[#2c241c] hover:border-[#cda869]/50 p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all active:scale-95 shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-[#cda869]/10 text-[#cda869] flex items-center justify-center mb-1.5">
              <Lock className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-serif font-semibold text-[#e8ded1] leading-tight">
              Secret Vault
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
