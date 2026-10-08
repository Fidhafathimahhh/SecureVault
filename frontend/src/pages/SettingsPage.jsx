import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useVault } from '../context/VaultContext';
import { useTheme } from '../context/ThemeContext';
import API from '../services/api';
import {
  User,
  Sun,
  Moon,
  Download,
  AlertTriangle,
  X,
  Loader2,
  Check,
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { addToast } = useVault();
  const { theme, setTheme } = useTheme();

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleExportVault = async () => {
    try {
      const [filesRes, passRes, notesRes, docRes] = await Promise.all([
        API.get('/files'),
        API.get('/passwords'),
        API.get('/notes'),
        API.get('/documents'),
      ]);

      const exportData = {
        vaultVersion: '1.0.0',
        exportedAt: new Date().toISOString(),
        userEmail: user?.email,
        files: filesRes.data.files,
        passwords: passRes.data.passwords,
        notes: notesRes.data.notes,
        documents: docRes.data.documents,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `securevault_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      addToast('Vault data backup JSON generated & downloaded.', 'success');
    } catch (err) {
      addToast('Export failed.', 'error');
    }
  };

  const handleDeleteAccountSubmit = async (e) => {
    e.preventDefault();
    if (!deletePassword) return;
    setDeleting(true);

    try {
      await API.post('/auth/delete-account', { password: deletePassword });
      addToast('Account and all vault data permanently deleted.', 'info');
      window.location.reload();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
          <span>Vault Preferences & Settings ⚙️</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage your account profile, theme selection, backups, and data.
        </p>
      </div>

      {/* Account Profile Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
          <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Account Profile</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-slate-500 dark:text-slate-400 block font-semibold">User Email</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-sm">{user?.email}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Account Registered</span>
            <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold text-sm">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Appearance Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
          <Sun className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Theme & Visual Styling</span>
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setTheme('light')}
            className={`p-5 rounded-2xl border flex items-center justify-between transition ${
              theme === 'light'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center space-x-3 text-left">
              <Sun className="w-6 h-6 text-amber-500" />
              <div>
                <span className="font-bold text-xs block text-slate-900 dark:text-white">White / Light Theme</span>
                <span className="text-[10px] text-slate-500">Ultra-clean white interface</span>
              </div>
            </div>
            {theme === 'light' && <Check className="w-5 h-5 text-emerald-600" />}
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-5 rounded-2xl border flex items-center justify-between transition ${
              theme === 'dark'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center space-x-3 text-left">
              <Moon className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              <div>
                <span className="font-bold text-xs block text-slate-900 dark:text-white">Dark Theme</span>
                <span className="text-[10px] text-slate-500">Cybersecurity slate mode</span>
              </div>
            </div>
            {theme === 'dark' && <Check className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Data Backup Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
          <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Data Export & Backup</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Download a complete JSON backup of your encrypted files, passwords, notes, and documents index.
        </p>

        <button
          onClick={handleExportVault}
          className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-emerald-700 dark:text-emerald-400 flex items-center space-x-2 transition shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>Export Vault Data Package</span>
        </button>
      </div>

      {/* Danger Zone */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-500/30 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <span>Danger Zone</span>
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/20">
          <div>
            <span className="font-bold text-xs text-rose-800 dark:text-rose-200 block">Delete Account & Permanent Vault Purge</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Permanently deletes your account and wipes all encrypted files from disk. Cannot be undone.
            </span>
          </div>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition shrink-0"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-500/40 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Confirm Account Deletion</span>
              </h3>
              <button onClick={() => setIsDeleteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This action is <strong className="text-rose-600 dark:text-rose-400">irreversible</strong>. All your stored files, passwords, notes, and documents will be permanently erased. Enter your master password to confirm.
            </p>

            <form onSubmit={handleDeleteAccountSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Master Password</label>
                <input
                  type="password"
                  required
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl flex items-center justify-center space-x-1"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <span>Permanently Delete</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
