import React, { useState } from 'react';
import { useVault } from '../../context/VaultContext';
import { useAuth } from '../../context/AuthContext';
import { Lock, KeyRound, LogOut, Loader2 } from 'lucide-react';

export default function LockOverlay() {
  const { isLocked, unlockVault } = useVault();
  const { user, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isLocked || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError('');

    const success = await unlockVault(password, user.email);
    setLoading(false);
    if (success) {
      setPassword('');
    } else {
      setError('Incorrect master password. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all duration-300">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in duration-200">
        <div className="inline-flex p-4 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
          <Lock className="w-10 h-10 animate-pulse" />
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Vault Locked 🔒</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Session locked for security. Enter your master password to unlock.
          </p>
          <div className="mt-2 text-xs font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 py-1 px-3 rounded-full inline-block border border-emerald-200 dark:border-emerald-500/30 font-semibold">
            {user.email}
          </div>
        </div>

        {error && (
          <div className="p-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-500/30 rounded-2xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Master Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center space-x-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <span>Unlock Vault</span>}
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={logout}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-rose-600 transition inline-flex items-center space-x-1 font-semibold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Or Sign Out of Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
