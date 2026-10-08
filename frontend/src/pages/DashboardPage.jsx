import React, { useEffect, useState } from 'react';
import { useVault } from '../context/VaultContext';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import {
  FolderLock,
  KeyRound,
  FileText,
  FileSpreadsheet,
  HardDrive,
  Upload,
  Plus,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { setActiveTab, stats, fetchDashboardStats } = useVault();
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await fetchDashboardStats();
      const res = await API.get('/dashboard/stats');
      setRecentActivity(res.data.recentActivity || []);
    } catch (e) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const totalVaultItems =
    (stats.filesCount || 0) +
    (stats.passwordsCount || 0) +
    (stats.notesCount || 0) +
    (stats.documentsCount || 0);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 text-xs font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Vault Status: Encrypted & Isolated</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome back to your secure vault.
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Authenticated session: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{user?.email}</span>
          </p>
        </div>

        {/* Quick actions top bar */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('files')}
            className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-emerald-700 dark:text-emerald-400 flex items-center space-x-1.5 transition shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
          <button
            onClick={() => setActiveTab('passwords')}
            className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-emerald-700 dark:text-emerald-400 flex items-center space-x-1.5 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Password</span>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-emerald-700 dark:text-emerald-400 flex items-center space-x-1.5 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Note</span>
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-emerald-700 dark:text-emerald-400 flex items-center space-x-1.5 transition shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Add Document</span>
          </button>
        </div>
      </div>

      {/* New User Empty Vault Banner */}
      {totalVaultItems === 0 && !loading && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-500/30 text-center space-y-5 shadow-lg">
          <div className="inline-flex p-4 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
            <ShieldCheck className="w-12 h-12" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              🔐 Welcome to SecureVault
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Your private vault is ready. Start securely storing your important information.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('files')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-600/20"
            >
              Upload File
            </button>
            <button
              onClick={() => setActiveTab('passwords')}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-xl transition"
            >
              Add Password
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-xl transition"
            >
              Create Note
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-xl transition"
            >
              Add Document
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Files */}
        <div
          onClick={() => setActiveTab('files')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 transition cursor-pointer group shadow-sm"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Files</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 group-hover:scale-110 transition">
              <FolderLock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-3">{stats.filesCount}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Encrypted files</span>
        </div>

        {/* Saved Passwords */}
        <div
          onClick={() => setActiveTab('passwords')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 transition cursor-pointer group shadow-sm"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Passwords</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 group-hover:scale-110 transition">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-3">{stats.passwordsCount}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Credentials safe</span>
        </div>

        {/* Private Notes */}
        <div
          onClick={() => setActiveTab('notes')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 transition cursor-pointer group shadow-sm"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Notes</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 group-hover:scale-110 transition">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-3">{stats.notesCount}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Private notes</span>
        </div>

        {/* Secure Documents */}
        <div
          onClick={() => setActiveTab('documents')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 transition cursor-pointer group shadow-sm"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Documents</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 group-hover:scale-110 transition">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-3">{stats.documentsCount}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Identity & Records</span>
        </div>

        {/* Storage Used */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Storage Used</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-3">{formatBytes(stats.totalStorageBytes)}</div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">AES-256-GCM Payload</span>
        </div>
      </div>

      {/* Recent Activity Trail */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Recent Safe Activity</span>
          </h3>
          <button
            onClick={() => setActiveTab('activity')}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
          >
            View Full Audit Log →
          </button>
        </div>

        {recentActivity.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No recent activity recorded.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentActivity.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{log.details}</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
