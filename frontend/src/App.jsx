import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useVault } from './context/VaultContext';
import { useAutoLock } from './hooks/useAutoLock';

import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import FilesPage from './pages/FilesPage';
import PasswordsPage from './pages/PasswordsPage';
import NotesPage from './pages/NotesPage';
import DocumentsPage from './pages/DocumentsPage';
import SecurityPage from './pages/SecurityPage';
import SettingsPage from './pages/SettingsPage';
import SearchPage from './pages/SearchPage';

import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import LockOverlay from './components/common/LockOverlay';
import Toast from './components/common/Toast';
import { Loader2, Shield } from 'lucide-react';

function AuthenticatedApp() {
  const { activeTab } = useVault();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Enforce auto-lock timer
  useAutoLock();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'files':
        return <FilesPage />;
      case 'passwords':
        return <PasswordsPage />;
      case 'notes':
        return <NotesPage />;
      case 'documents':
        return <DocumentsPage />;
      case 'activity':
      case 'security':
        return <SecurityPage />;
      case 'settings':
        return <SettingsPage />;
      case 'search':
        return <SearchPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        isMobileOpen={isMobileSidebarOpen}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Main Container */}
      <div className="flex flex-1 relative">
        {/* Navigation Sidebar */}
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Content Area */}
        <main className="flex-1 lg:pl-64 p-4 sm:p-6 lg:p-8 min-w-0">
          <div className="max-w-7xl mx-auto">
            {renderTabContent()}
          </div>
        </main>
      </div>

      {/* Auto-Lock Overlay */}
      <LockOverlay />

      {/* Floating Toasts */}
      <Toast />
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 cyber-glow-cyan animate-pulse">
          <Shield className="w-10 h-10" />
        </div>
        <div className="flex items-center space-x-2 text-cyan-400 font-mono text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Securing your vault... 🔐</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthPage />
        <Toast />
      </>
    );
  }

  return <AuthenticatedApp />;
}
