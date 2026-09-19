import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { memoryService } from './services/memoryService';

// Splash & Navigation
import SplashScreen from './components/SplashScreen';
import PublicNavbar from './components/PublicNavbar';
import AppSidebar from './components/AppSidebar';
import AppHeader from './components/AppHeader';
import MobileNav from './components/MobileNav';

// Modals
import ActionSheetModal from './components/ActionSheetModal';
import AddMemoryModal from './components/AddMemoryModal';
import CreateCapsuleModal from './components/CreateCapsuleModal';
import MemoryDetailModal from './components/MemoryDetailModal';
import SearchModal from './components/SearchModal';
import AuthModal from './components/AuthModal';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import ResetPasswordPage from './pages/public/ResetPasswordPage';
import PrivacyPage from './pages/public/PrivacyPage';
import AboutPage from './pages/public/AboutPage';

// Authenticated Pages
import HomePage from './pages/app/HomePage';
import DiaryPage from './pages/app/DiaryPage';
import MemoriesPage from './pages/app/MemoriesPage';
import TimeCapsulesPage from './pages/app/TimeCapsulesPage';
import TimelinePage from './pages/app/TimelinePage';
import FavoritesPage from './pages/app/FavoritesPage';
import ProfilePage from './pages/app/ProfilePage';
import SettingsPage from './pages/app/SettingsPage';

function MainApp() {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  const [currentPath, setCurrentPath] = useState(() => {
    const hash = window.location.hash.replace(/^#/, '');
    return hash || '/home';
  });

  // Modals state
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isAddMemoryOpen, setIsAddMemoryOpen] = useState(false);
  const [isCreateCapsuleOpen, setIsCreateCapsuleOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  
  const [editingMemory, setEditingMemory] = useState(null);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Hash listener
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#/, '');
      setCurrentPath(hash || '/home');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigate = (path) => {
    window.location.hash = '#' + path;
    setCurrentPath(path);
  };

  const handleActionSelect = (actionId) => {
    if (actionId === 'diary') {
      navigate('/diary');
    } else if (actionId === 'photo' || actionId === 'video' || actionId === 'memory') {
      setEditingMemory(null);
      setIsAddMemoryOpen(true);
    } else if (actionId === 'capsule') {
      setIsCreateCapsuleOpen(true);
    }
  };

  const handleOpenAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleDeleteMemory = async (id) => {
    try {
      await memoryService.deleteMemory(id);
      setSelectedMemory(null);
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const handleToggleFavorite = async (id, isFav) => {
    try {
      await memoryService.toggleFavorite(id, isFav);
      if (selectedMemory && selectedMemory.id === id) {
        setSelectedMemory(prev => ({ ...prev, is_favorite: isFav }));
      }
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error('Fav error', err);
    }
  };

  // Splash Screen on initial open
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Auth Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-paper-100 dark:bg-paper-950 flex items-center justify-center text-stone-500">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-700 border-t-transparent animate-spin" />
          <p className="font-serif italic text-xs tracking-wider">Unlocking TimeMemory...</p>
        </div>
      </div>
    );
  }

  // --- UNAUTHENTICATED FLOW ---
  if (!user) {
    if (currentPath === '/login') return <LoginPage onNavigate={navigate} />;
    if (currentPath === '/register') return <RegisterPage onNavigate={navigate} />;
    if (currentPath === '/forgot-password') return <ForgotPasswordPage onNavigate={navigate} />;
    if (currentPath === '/reset-password') return <ResetPasswordPage onNavigate={navigate} />;
    if (currentPath === '/privacy') return <PrivacyPage onNavigate={navigate} />;
    if (currentPath === '/about') return <AboutPage onNavigate={navigate} />;

    return (
      <div className="min-h-screen bg-paper-100 dark:bg-paper-950 text-stone-900 dark:text-stone-100 flex flex-col">
        <PublicNavbar onNavigate={navigate} />
        <main className="flex-1">
          <LandingPage
            onOpenAuth={handleOpenAuth}
            onGuestEnter={() => navigate('/login')}
          />
        </main>
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authModalMode}
          onSuccess={() => navigate('/home')}
        />
      </div>
    );
  }

  // --- AUTHENTICATED PERSONAL MEMORY BOOK ---
  const activePath = (currentPath === '/' || currentPath === '/login' || currentPath === '/register' || currentPath === '/dashboard')
    ? '/home'
    : currentPath;

  const getPageTitle = () => {
    switch (activePath) {
      case '/home': return 'TimeMemory';
      case '/diary': return 'Digital Diary';
      case '/memories': return 'Memory Album';
      case '/capsules': return 'Time Capsules';
      case '/timeline': return 'Life Timeline';
      case '/favorites': return 'Favorites';
      case '/profile': return 'Personal Profile';
      case '/settings': return 'Settings';
      case '/privacy': return 'Privacy Policy';
      case '/about': return 'About TimeMemory';
      default: return 'TimeMemory';
    }
  };

  return (
    <div className="min-h-screen bg-paper-100 dark:bg-paper-950 text-stone-900 dark:text-stone-100 flex flex-col md:flex-row">
      {/* Desktop App Sidebar */}
      <div className="hidden md:block">
        <AppSidebar
          currentPath={activePath}
          onNavigate={navigate}
          onOpenActionSheet={() => setIsActionSheetOpen(true)}
        />
      </div>

      {/* Main Experience Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title={getPageTitle()}
          onOpenActionSheet={() => setIsActionSheetOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onNavigate={navigate}
        />

        <main className="flex-1">
          {activePath === '/home' && (
            <HomePage
              key={refreshKey}
              onNavigate={navigate}
              onOpenAddModal={() => {
                setEditingMemory(null);
                setIsAddMemoryOpen(true);
              }}
              onOpenActionSheet={() => setIsActionSheetOpen(true)}
              onSelectMemory={setSelectedMemory}
            />
          )}
          {activePath === '/diary' && <DiaryPage key={refreshKey} />}
          {activePath === '/memories' && (
            <MemoriesPage
              key={refreshKey}
              onOpenAddModal={() => {
                setEditingMemory(null);
                setIsAddMemoryOpen(true);
              }}
              onSelectMemory={setSelectedMemory}
            />
          )}
          {activePath === '/capsules' && (
            <TimeCapsulesPage
              key={refreshKey}
              onOpenCreateCapsule={() => setIsCreateCapsuleOpen(true)}
            />
          )}
          {activePath === '/timeline' && (
            <TimelinePage
              key={refreshKey}
              onOpenAddModal={() => {
                setEditingMemory(null);
                setIsAddMemoryOpen(true);
              }}
              onSelectMemory={setSelectedMemory}
            />
          )}
          {activePath === '/favorites' && (
            <FavoritesPage
              key={refreshKey}
              onOpenAddModal={() => {
                setEditingMemory(null);
                setIsAddMemoryOpen(true);
              }}
              onSelectMemory={setSelectedMemory}
              onNavigate={navigate}
            />
          )}
          {activePath === '/profile' && <ProfilePage />}
          {activePath === '/settings' && <SettingsPage />}
          {activePath === '/privacy' && <PrivacyPage onNavigate={navigate} />}
          {activePath === '/about' && <AboutPage onNavigate={navigate} />}
        </main>
      </div>

      {/* Mobile Bottom Navigation (4 items + central + button) */}
      <MobileNav
        currentPath={activePath}
        onNavigate={navigate}
        onOpenActionSheet={() => setIsActionSheetOpen(true)}
      />

      {/* Central + Action Sheet */}
      <ActionSheetModal
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        onSelectAction={handleActionSelect}
      />

      {/* Add / Edit Memory Modal */}
      <AddMemoryModal
        isOpen={isAddMemoryOpen}
        onClose={() => {
          setIsAddMemoryOpen(false);
          setEditingMemory(null);
        }}
        initialData={editingMemory}
        onSuccess={() => setRefreshKey(k => k + 1)}
      />

      {/* Create Time Capsule Modal */}
      <CreateCapsuleModal
        isOpen={isCreateCapsuleOpen}
        onClose={() => setIsCreateCapsuleOpen(false)}
        onSuccess={() => {
          setRefreshKey(k => k + 1);
          navigate('/capsules');
        }}
      />

      {/* Memory Detail Modal */}
      <MemoryDetailModal
        isOpen={Boolean(selectedMemory)}
        onClose={() => setSelectedMemory(null)}
        memory={selectedMemory}
        onEdit={(m) => {
          setSelectedMemory(null);
          setEditingMemory(m);
          setIsAddMemoryOpen(true);
        }}
        onDelete={handleDeleteMemory}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectMemory={setSelectedMemory}
        onSelectDiary={() => navigate('/diary')}
        onSelectCapsule={() => navigate('/capsules')}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
