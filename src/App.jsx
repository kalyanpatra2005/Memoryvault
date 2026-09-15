import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import DiaryPage from './pages/DiaryPage';
import MediaVaultPage from './pages/MediaVaultPage';
import TimeCapsulePage from './pages/TimeCapsulePage';
import SettingsPage from './pages/SettingsPage';

function VaultContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  const handleOpenAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-vault-950 flex items-center justify-center text-stone-400">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
          <p className="font-antique text-lg text-amber-200">Unlocking Vault Gateway...</p>
        </div>
      </div>
    );
  }

  // If user is not logged in, render the landing experience
  if (!user) {
    return (
      <div className="min-h-screen bg-vault-950 text-stone-100 flex flex-col">
        <Navbar 
          activeTab="landing" 
          setActiveTab={() => {}} 
          onOpenAuth={handleOpenAuth} 
        />
        <main className="flex-1">
          <LandingPage onOpenAuth={handleOpenAuth} />
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
    <div className="min-h-screen bg-vault-950 text-stone-100 flex flex-col selection:bg-amber-900/60 selection:text-amber-100">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenAuth={handleOpenAuth} 
      />

      <main className="flex-1">
        {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
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
