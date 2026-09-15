import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import VaultSecurityLock from './VaultSecurityLock';
import { 
  Home, Image as ImageIcon, Feather, BookOpen, 
  User, Plus, Lock, LogOut, Bell
} from 'lucide-react';

export default function Layout() {
  const { user, logout, lockVault } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'K';

  return (
    <div className="min-h-screen bg-[#0e0c0a] text-[#f5ede0] flex items-center justify-center p-0 sm:p-4 select-none">
      {/* Smartphone Viewport Container */}
      <div className="w-full max-w-[412px] h-[100dvh] sm:h-[844px] bg-[#14110e] border border-[#26211a] sm:rounded-[44px] shadow-2xl relative overflow-hidden flex flex-col justify-between">
        {/* High-Security PIN Lock Overlay */}
        <VaultSecurityLock />

        {/* Main Scrolling Content Area */}
        <main className="flex-1 overflow-y-auto pb-20 relative overscroll-contain">
          <Outlet />
        </main>

        {/* ==============================================================
            SCREEN 5 BOTTOM NAVIGATION BAR (Exact Match to Design Board)
        ============================================================== */}
        <nav className="absolute bottom-0 left-0 right-0 bg-[#171410]/95 backdrop-blur-xl border-t border-[#262018] px-3 py-2 z-30 flex items-center justify-around sm:rounded-b-[44px]">
          {/* Tab 1: Home */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 transition-colors ${
                isActive ? 'text-[#cda869]' : 'text-[#7d705f] hover:text-[#baa995]'
              }`
            }
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-serif font-medium">Home</span>
          </NavLink>

          {/* Tab 2: Memories */}
          <NavLink
            to="/memories"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 transition-colors ${
                isActive || location.pathname.startsWith('/photos') || location.pathname.startsWith('/videos')
                  ? 'text-[#cda869]' 
                  : 'text-[#7d705f] hover:text-[#baa995]'
              }`
            }
          >
            <ImageIcon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-serif font-medium">Memories</span>
          </NavLink>

          {/* Tab 3: Center Golden FAB (+) */}
          <NavLink
            to="/memories/new"
            className="w-11 h-11 rounded-full bg-[#cda869] hover:bg-[#bfa058] text-[#120f0b] flex items-center justify-center shadow-lg shadow-black/60 -mt-5 border-2 border-[#14110e] active:scale-95 transition-transform"
            title="Add New Memory"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </NavLink>

          {/* Tab 4: Diary */}
          <NavLink
            to="/diary"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 transition-colors ${
                isActive ? 'text-[#cda869]' : 'text-[#7d705f] hover:text-[#baa995]'
              }`
            }
          >
            <BookOpen className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-serif font-medium">Diary</span>
          </NavLink>

          {/* Tab 5: Profile */}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 transition-colors ${
                isActive ? 'text-[#cda869]' : 'text-[#7d705f] hover:text-[#baa995]'
              }`
            }
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-serif font-medium">Profile</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
}
