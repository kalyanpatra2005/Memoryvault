import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { memoryService } from './services/memoryService';

// Navigation & Layout
import PublicNavbar from './components/PublicNavbar';
import AppSidebar from './components/AppSidebar';
import AppHeader from './components/AppHeader';
import MobileNav from './components/MobileNav';

// Modals
import AuthModal from './components/AuthModal';
import AddMemoryModal from './components/AddMemoryModal';
import MemoryDetailModal from './components/MemoryDetailModal';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import ResetPasswordPage from './pages/public/ResetPasswordPage';
import PrivacyPage from './pages/public/PrivacyPage';
import AboutPage from './pages/public/AboutPage';

// App Pages
import DashboardPage from './pages/app/DashboardPage';
import MemoriesPage from './pages/app/MemoriesPage';
import TimelinePage from './pages/app/TimelinePage';
import FavoritesPage from './pages/app/FavoritesPage';
import ProfilePage from './pages/app/ProfilePage';
import SettingsPage from './pages/app/SettingsPage';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(() => {
    const hash = window.location.hash.replace(/^#/, '');
    return hash || '/';
  });

  // Modal states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState(null);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Hash route listener
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '');
      setCurrentPath(hash || '/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path) => {
    window.location.hash = '#' + path;
    setCurrentPath(path);
  };

  const handleOpenAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleOpenAddModal = (memoryToEdit = null) => {
    setEditingMemory(memoryToEdit);
    setIsAddModalOpen(true);
  };

  const handleSaveSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteMemory = async (id) => {
    try {
      await memoryService.deleteMemory(id);
      setSelectedMemory(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const handleToggleFavorite = async (id, newFavState) => {
    try {
      await memoryService.toggleFavorite(id, newFavState);
      if (selectedMemory && selectedMemory.id === id) {
        setSelectedMemory(prev => ({ ...prev, is_favorite: newFavState }));
      }
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Favorite toggle error', err);
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 rounded-2xl border-2 border-indigo-600 border-t-transparent animate-spin" />
          <p className="font-sans text-xs text-slate-500 font-semibold tracking-wider uppercase">
            Loading TimeMemory...
          </p>
        </div>
      </div>
    );
  }

  // --- UNAUTHENTICATED FLOW ---
  if (!user) {
    // If user explicitly navigated to a login/register page
    if (currentPath === '/login') {
      return <LoginPage onNavigate={navigate} />;
    }
    if (currentPath === '/register') {
      return <RegisterPage onNavigate={navigate} />;
    }
    if (currentPath === '/forgot-password') {
      return <ForgotPasswordPage onNavigate={navigate} />;
    }
    if (currentPath === '/reset-password') {
      return <ResetPasswordPage onNavigate={navigate} />;
    }
    if (currentPath === '/privacy') {
      return <PrivacyPage onNavigate={navigate} />;
    }
    if (currentPath === '/about') {
      return <AboutPage onNavigate={navigate} />;
    }

    // Default: Public Landing Page
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-indigo-500/20">
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
          onSuccess={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  // --- AUTHENTICATED VAULT APPLICATION ---
  // Redirect unauthenticated paths (like /login or /) to /dashboard
  const activeAppPath = (currentPath === '/' || currentPath === '/login' || currentPath === '/register')
    ? '/dashboard'
    : currentPath;

  const getPageTitle = () => {
    switch (activeAppPath) {
      case '/dashboard': return 'Dashboard';
      case '/memories': return 'All Memories';
      case '/timeline': return 'Chronological Timeline';
      case '/favorites': return 'Favorites';
      case '/profile': return 'Profile';
      case '/settings': return 'Settings';
      case '/privacy': return 'Privacy Policy';
      case '/about': return 'About TimeMemory';
      default: return 'Memory Vault';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 flex selection:bg-indigo-500/20">
      {/* Desktop App Sidebar */}
      <div className="hidden md:block">
        <AppSidebar
          currentPath={activeAppPath}
          onNavigate={navigate}
          onOpenAddModal={() => handleOpenAddModal(null)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
        <AppHeader
          title={getPageTitle()}
          onOpenAddModal={() => handleOpenAddModal(null)}
        />

        <main className="flex-1">
          {activeAppPath === '/dashboard' && (
            <DashboardPage
              key={refreshTrigger}
              onOpenAddModal={() => handleOpenAddModal(null)}
              onSelectMemory={setSelectedMemory}
              onNavigate={navigate}
            />
          )}
          {activeAppPath === '/memories' && (
            <MemoriesPage
              key={refreshTrigger}
              onOpenAddModal={() => handleOpenAddModal(null)}
              onSelectMemory={setSelectedMemory}
            />
          )}
          {activeAppPath === '/timeline' && (
            <TimelinePage
              key={refreshTrigger}
              onOpenAddModal={() => handleOpenAddModal(null)}
              onSelectMemory={setSelectedMemory}
            />
          )}
          {activeAppPath === '/favorites' && (
            <FavoritesPage
              key={refreshTrigger}
              onOpenAddModal={() => handleOpenAddModal(null)}
              onSelectMemory={setSelectedMemory}
              onNavigate={navigate}
            />
          )}
          {activeAppPath === '/profile' && <ProfilePage />}
          {activeAppPath === '/settings' && <SettingsPage />}
          {activeAppPath === '/privacy' && <PrivacyPage onNavigate={navigate} />}
          {activeAppPath === '/about' && <AboutPage onNavigate={navigate} />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentPath={activeAppPath}
        onNavigate={navigate}
        onOpenAddModal={() => handleOpenAddModal(null)}
      />

      {/* Add / Edit Memory Modal */}
      <AddMemoryModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingMemory(null);
        }}
        initialData={editingMemory}
        onSuccess={handleSaveSuccess}
      />

      {/* View Memory Details Modal */}
      <MemoryDetailModal
        isOpen={Boolean(selectedMemory)}
        onClose={() => setSelectedMemory(null)}
        memory={selectedMemory}
        onEdit={(mem) => {
          setSelectedMemory(null);
          handleOpenAddModal(mem);
        }}
        onDelete={handleDeleteMemory}
        onToggleFavorite={handleToggleFavorite}
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
