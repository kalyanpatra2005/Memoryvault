import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Layers, ChevronDown, ChevronUp, Check, ExternalLink } from 'lucide-react';

const SCREENS = [
  { id: 1, name: '1. Splash / Welcome', path: '/?screen=1', authRequired: false },
  { id: 2, name: '2. Login', path: '/?screen=2', authRequired: false },
  { id: 3, name: '3. Register', path: '/?screen=3', authRequired: false },
  { id: 4, name: '4. OTP Verification', path: '/?screen=4', authRequired: false },
  { id: 5, name: '5. Home Dashboard', path: '/dashboard', authRequired: true },
  { id: 6, name: '6. Memories Feed', path: '/memories?screen=6', authRequired: true },
  { id: 7, name: '7. Add Memory', path: '/memories/new', authRequired: true },
  { id: 8, name: '8. Photos / Albums', path: '/memories?mode=albums&screen=8', authRequired: true },
  { id: 9, name: '9. Photo Viewer Lightbox', path: '/memories?screen=9', authRequired: true },
  { id: 10, name: '10. Videos Archive', path: '/memories?mode=videos&screen=10', authRequired: true },
  { id: 11, name: '11. Video Player', path: '/memories?screen=11', authRequired: true },
  { id: 12, name: '12. Personal Diary Feed', path: '/diary?screen=12', authRequired: true },
  { id: 13, name: '13. Antique Diary Editor', path: '/diary?screen=13', authRequired: true },
  { id: 14, name: '14. Antique Diary Reader View', path: '/diary?screen=14', authRequired: true },
  { id: 15, name: '15. Time Capsule Feed', path: '/capsules?screen=15', authRequired: true },
  { id: 16, name: '16. Wax-Sealed Capsule Detail', path: '/capsules?screen=16', authRequired: true },
  { id: 17, name: '17. Profile & Settings', path: '/profile', authRequired: true },
];

export default function ScreenSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSelectScreen = (screen) => {
    if (screen.authRequired && !isAuthenticated) {
      // Auto-authenticate as Kalyan Patra for instant screen demo preview
      login('demo_token', {
        id: 4,
        name: 'Kalyan Patra',
        email: 'kalyan@example.com',
        phone: '+91 98765 43210',
        dob: '1998-04-12',
        hasVaultPin: true,
      });
    } else if (!screen.authRequired && isAuthenticated) {
      // When navigating to splash/login/register/otp, clear auth so public landing shows
      useAuthStore.getState().logout();
    }

    navigate(screen.path);
    setIsOpen(false);
  };

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
      {/* Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-3.5 py-1.5 rounded-full bg-[#1c1813]/95 border border-[#cda869]/50 text-[#f5ede0] shadow-2xl backdrop-blur-xl flex items-center gap-2 text-xs font-serif hover:border-[#cda869] active:scale-95 transition-all"
      >
        <Layers className="w-3.5 h-3.5 text-[#cda869]" />
        <span className="font-bold text-[#cda869]">17 Screens Navigator</span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-[#baa995]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#baa995]" />}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="mt-2 w-[340px] max-h-[70vh] overflow-y-auto bg-[#14110e]/98 border border-[#3d3224] rounded-2xl shadow-2xl backdrop-blur-2xl p-2 space-y-1 animate-fade-in divide-y divide-[#221c15]">
          <div className="p-2 text-center pb-1">
            <p className="text-[10px] font-serif uppercase tracking-widest text-[#cda869] font-bold">
              Exact 17 Design Screens
            </p>
            <p className="text-[9px] font-serif text-[#8f7e69]">Click any screen to jump directly</p>
          </div>

          <div className="pt-1 space-y-1">
            {SCREENS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectScreen(s)}
                className="w-full px-3 py-2 rounded-xl text-left font-serif text-xs text-[#d8cfc4] hover:bg-[#201b15] hover:text-[#cda869] flex items-center justify-between transition-colors group"
              >
                <span>{s.name}</span>
                <span className="text-[10px] font-mono text-[#786c5c] group-hover:text-[#cda869]">
                  Jump →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
