import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useVault } from '../context/VaultContext';
import { useTheme } from '../context/ThemeContext';
import { Shield, Lock, Mail, KeyRound, Eye, EyeOff, Loader2, ArrowRight, Sun, Moon } from 'lucide-react';

export default function AuthPage() {
  const { login, register } = useAuth();
  const { addToast } = useVault();
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        await register(email, password, confirmPassword);
        addToast('Account created successfully! Please log in.', 'success');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      } else {
        await login(email, password);
        addToast('Welcome back to your private vault 🔐', 'success');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculatePasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = calculatePasswordStrength(password);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden transition-colors duration-200">
      {/* Absolute Theme Switcher Top Right */}
      <div className="absolute top-5 right-5 z-20">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm hover:border-emerald-400 transition flex items-center space-x-1.5 text-xs font-semibold"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-500" />
              <span>White Theme</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-600" />
              <span>Dark Theme</span>
            </>
          )}
        </button>
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-sm">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">SecureVault</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Zero-knowledge encrypted digital vault for files, passwords, notes, and documents.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          {/* Tab Switcher */}
          <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
                mode === 'login'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
                mode === 'register'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs font-medium leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@vault.domain"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/10 outline-none transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Master Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/10 outline-none transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {mode === 'register' && password && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span>Password Strength:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {strength <= 2 ? 'Weak' : strength <= 4 ? 'Strong' : 'Very Strong'}
                    </span>
                  </div>
                  <div className="flex h-1 gap-1">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <div
                        key={lvl}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                          lvl <= strength
                            ? strength <= 2
                              ? 'bg-rose-500'
                              : strength <= 4
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                            : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Confirm Master Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/10 outline-none transition font-mono"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center space-x-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Unlock Personal Vault' : 'Create Encrypted Vault'}</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </form>

          {/* Footer Note */}
          <div className="text-center pt-2 text-[11px] text-slate-400 dark:text-slate-500">
            🔒 Protected by AES-256-GCM hardware encryption.
          </div>
        </div>
      </div>
    </div>
  );
}
