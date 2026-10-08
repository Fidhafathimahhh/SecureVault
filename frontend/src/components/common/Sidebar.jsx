import React from 'react';
import { useVault } from '../../context/VaultContext';
import {
  LayoutDashboard,
  FolderLock,
  KeyRound,
  FileText,
  FileSpreadsheet,
  Activity,
  ShieldCheck,
  Settings,
} from 'lucide-react';

export default function Sidebar({ isMobileOpen, onCloseMobile }) {
  const { activeTab, setActiveTab } = useVault();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'files', label: 'Files', icon: FolderLock },
    { id: 'passwords', label: 'Passwords', icon: KeyRound },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'documents', label: 'Documents', icon: FileSpreadsheet },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelect = (id) => {
    setActiveTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 transition-transform duration-300 shadow-xs lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
            Vault Modules
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom Security Banner */}
        <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
          <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">AES-256-GCM Hardware</span>
          </div>
        </div>
      </aside>
    </>
  );
}
