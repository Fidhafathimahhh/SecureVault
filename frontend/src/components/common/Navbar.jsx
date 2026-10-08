import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useVault } from '../../context/VaultContext';
import { useTheme } from '../../context/ThemeContext';
import { Shield, Search, Lock, Sun, Moon, LogOut, User, Menu, X } from 'lucide-react';

export default function Navbar({ onToggleMobileSidebar, isMobileOpen }) {
  const { user, logout } = useAuth();
  const { lockVault, activeTab, setActiveTab, searchQuery, setSearchQuery } = useVault();
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim() && activeTab !== 'search') {
      setActiveTab('search');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 flex items-center justify-between shadow-sm transition-colors duration-200">
      {/* Left section: Logo & Mobile Toggle */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition duration-200 shadow-sm">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
              SecureVault
            </span>
            <span className="ml-1 text-xs text-emerald-600 dark:text-emerald-400 font-mono">🔐</span>
          </div>
        </div>
      </div>

      {/* Middle section: Global Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search vault (files, passwords, notes, documents)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 dark:focus:border-emerald-500 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/10 outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                if (activeTab === 'search') setActiveTab('dashboard');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-semibold"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Right section: Controls & Profile */}
      <div className="flex items-center space-x-2.5">
        {/* Status indicator */}
        <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
          <span>Vault Secure</span>
        </div>

        {/* Lock Vault button */}
        <button
          onClick={lockVault}
          title="Lock Vault Now"
          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 transition flex items-center space-x-1.5 text-xs font-medium shadow-xs"
        >
          <Lock className="w-4 h-4" />
          <span className="hidden sm:inline">Lock Vault</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'White/Light' : 'Dark'} Theme`}
          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-amber-500 transition shadow-xs flex items-center space-x-1 text-xs font-semibold"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-500" />
              <span className="hidden md:inline">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-600" />
              <span className="hidden md:inline">Dark</span>
            </>
          )}
        </button>

        {/* User Account Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 transition"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </div>
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
              onMouseLeave={() => setShowUserMenu(false)}
            >
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Signed In User</p>
                <p className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 truncate mt-0.5">
                  {user?.email}
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveTab('settings');
                  setShowUserMenu(false);
                }}
                className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-2"
              >
                <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Account Settings</span>
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
