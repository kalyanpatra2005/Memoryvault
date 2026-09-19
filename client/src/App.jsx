import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { vaultEngine } from './services/vaultEngine';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import AddMemoryModal from './components/AddMemoryModal';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import TimelinePage from './pages/TimelinePage';
import DiaryPage from './pages/DiaryPage';
import MediaVaultPage from './pages/MediaVaultPage';
import TimeCapsulePage from './pages/TimeCapsulePage';
import SettingsPage from './pages/SettingsPage';

function VaultContent() {
  const { user, login, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [isGlobalAddModalOpen, setIsGlobalAddModalOpen] = useState(false);

  const handleOpenAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleGuestEnter = () => {
    const session = vaultEngine.createGuestSession();
    login(session.token, session.user);
    setActiveTab('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-400">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-2xl border-2 border-amber-500 border-t-transparent animate-spin" />
          <p className="font-sans text-sm text-amber-200 tracking-wider uppercase font-mono">Unlocking TimeMemory...</p>
        </div>
      </div>
    );
  }

  // If user is not logged in, render the landing experience
  if (!user) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
        <Navbar 
          activeTab="landing" 
          setActiveTab={() => {}} 
          onOpenAuth={handleOpenAuth} 
          onGuestEnter={handleGuestEnter}
        />
        <main className="flex-1">
          <LandingPage 
            onOpenAuth={handleOpenAuth} 
            onGuestEnter={handleGuestEnter}
          />
        </main>
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authModalMode}
          onSuccess={() => setActiveTab('dashboard')}
        />
      </div>
    );
  }

  // Authenticated Vault Application
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200 pb-20 md:pb-0">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenAuth={handleOpenAuth}
        onOpenAddMemory={() => setIsGlobalAddModalOpen(true)}
      />

      <main className="flex-1">
        {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
        {activeTab === 'timeline' && <TimelinePage />}
        {activeTab === 'diary' && <DiaryPage />}
        {activeTab === 'media' && <MediaVaultPage />}
        {activeTab === 'capsules' && <TimeCapsulePage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      <AddMemoryModal
        isOpen={isGlobalAddModalOpen}
        onClose={() => setIsGlobalAddModalOpen(false)}
        onSuccess={() => {
          // If on timeline or media or dashboard, triggering tab will update
          if (activeTab === 'landing') setActiveTab('dashboard');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <VaultContent />
    </AuthProvider>
  );
}
