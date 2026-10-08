import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useVault } from '../context/VaultContext';
import PasswordGeneratorModal from '../components/passwords/PasswordGeneratorModal';
import {
  KeyRound,
  Plus,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  Star,
  ExternalLink,
  Edit2,
  Trash2,
  Wand2,
  X,
  Loader2,
} from 'lucide-react';

export default function PasswordsPage() {
  const { addToast, fetchDashboardStats } = useVault();
  const [passwords, setPasswords] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Revealed password cache object { [id]: 'decrypted_string' }
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
    category: 'General',
    notes: '',
  });

  const loadPasswords = async () => {
    setLoading(true);
    try {
      const res = await API.get('/passwords', {
        params: {
          category,
          search: search.trim(),
          favorite: favoriteOnly ? 'true' : 'false',
        },
      });
      setPasswords(res.data.passwords || []);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPasswords();
  }, [category, favoriteOnly]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadPasswords();
  };

  const handleToggleReveal = async (id) => {
    if (revealedPasswords[id]) {
      setRevealedPasswords((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }

    try {
      const res = await API.get(`/passwords/${id}/reveal`);
      setRevealedPasswords((prev) => ({ ...prev, [id]: res.data.password }));
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleCopyPassword = async (entry) => {
    try {
      let passToCopy = revealedPasswords[entry.id];
      if (!passToCopy) {
        const res = await API.get(`/passwords/${entry.id}/reveal`);
        passToCopy = res.data.password;
      }

      await navigator.clipboard.writeText(passToCopy);
      setCopiedId(entry.id);
      addToast(`Password for '${entry.title}' copied to clipboard.`, 'success');

      setTimeout(() => {
        setCopiedId(null);
      }, 3000);
    } catch (err) {
      addToast('Failed to copy password.', 'error');
    }
  };

  const handleToggleFavorite = async (id) => {
    try {
      const res = await API.post(`/passwords/${id}/favorite`);
      setPasswords((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_favorite: res.data.is_favorite } : p))
      );
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.password) {
      addToast('Title and password are required.', 'error');
      return;
    }

    try {
      if (editingId) {
        await API.put(`/passwords/${editingId}`, formData);
        addToast('Password entry updated successfully.', 'success');
      } else {
        await API.post('/passwords', formData);
        addToast('Password entry created & encrypted.', 'success');
      }

      setIsFormOpen(false);
      setEditingId(null);
      setFormData({ title: '', username: '', password: '', url: '', category: 'General', notes: '' });
      loadPasswords();
      fetchDashboardStats();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleEditClick = async (entry) => {
    setEditingId(entry.id);
    try {
      const res = await API.get(`/passwords/${entry.id}/reveal`);
      setFormData({
        title: res.data.title,
        username: res.data.username || '',
        password: res.data.password,
        url: res.data.url || '',
        category: res.data.category || 'General',
        notes: res.data.notes || '',
      });
      setIsFormOpen(true);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete credential for '${title}'?`)) return;
    try {
      await API.delete(`/passwords/${id}`);
      addToast(`Deleted password entry '${title}'`, 'info');
      loadPasswords();
      fetchDashboardStats();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <span>Password Manager 🔑</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Encrypted credentials vault with zero plaintext storage.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsGeneratorOpen(true)}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-emerald-700 dark:text-emerald-400 flex items-center space-x-1.5 transition shadow-xs"
          >
            <Wand2 className="w-4 h-4" />
            <span>Generate Password</span>
          </button>

          <button
            onClick={() => {
              setEditingId(null);
              setFormData({ title: '', username: '', password: '', url: '', category: 'General', notes: '' });
              setIsFormOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Password</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search credentials by title, username, or URL..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none transition shadow-xs"
          />
        </form>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500 shadow-xs"
        >
          <option value="">All Categories</option>
          <option value="General">General</option>
          <option value="Work">Work</option>
          <option value="Social">Social</option>
          <option value="Finance">Finance</option>
          <option value="Email">Email</option>
        </select>

        <button
          onClick={() => setFavoriteOnly(!favoriteOnly)}
          className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition ${
            favoriteOnly
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-400'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${favoriteOnly ? 'fill-amber-500 text-amber-500' : ''}`} />
          <span>Favorites</span>
        </button>
      </div>

      {/* Passwords Grid / List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-12 flex justify-center items-center text-slate-400 space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs">Decrypting password index... 🔑</span>
          </div>
        ) : passwords.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="inline-flex p-3 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400">
              <KeyRound className="w-8 h-8" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No saved passwords found.</p>
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({ title: '', username: '', password: '', url: '', category: 'General', notes: '' });
                setIsFormOpen(true);
              }}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center space-x-1"
            >
              <span>Add your first password credential</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {passwords.map((entry) => {
              const isRevealed = !!revealedPasswords[entry.id];
              const revealedValue = revealedPasswords[entry.id] || '••••••••••••••••';

              return (
                <div
                  key={entry.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition"
                >
                  <div className="flex items-start space-x-3.5 min-w-0">
                    <button
                      onClick={() => handleToggleFavorite(entry.id)}
                      className="mt-1 text-slate-300 dark:text-slate-600 hover:text-amber-500 transition"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          entry.is_favorite ? 'fill-amber-500 text-amber-500' : ''
                        }`}
                      />
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{entry.title}</h4>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-medium">
                          {entry.category || 'General'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        {entry.username && <span className="font-mono text-slate-700 dark:text-slate-300">{entry.username}</span>}
                        {entry.url && (
                          <a
                            href={entry.url.startsWith('http') ? entry.url : `https://${entry.url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1 font-mono text-[11px]"
                          >
                            <span>{entry.url}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {/* Password Field Row */}
                      <div className="flex items-center space-x-2 pt-1">
                        <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400 bg-slate-50 dark:bg-slate-950 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 tracking-wider font-semibold">
                          {revealedValue}
                        </span>

                        <button
                          onClick={() => handleToggleReveal(entry.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
                          title={isRevealed ? 'Hide Password' : 'Show Password'}
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => handleCopyPassword(entry)}
                          className="p-1 text-slate-400 hover:text-emerald-600 transition"
                          title="Copy Password"
                        >
                          {copiedId === entry.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1.5 self-end sm:self-center">
                    <button
                      onClick={() => handleEditClick(entry)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 border border-slate-200 dark:border-slate-700 transition"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id, entry.title)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-rose-600 border border-slate-200 dark:border-slate-700 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Password Generator Modal */}
      <PasswordGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onUsePassword={(p) => {
          setFormData((prev) => ({ ...prev, password: p }));
          setIsFormOpen(true);
        }}
      />

      {/* Add / Edit Password Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingId ? 'Edit Credential' : 'Add Password Entry'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Title / App Name *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. GitHub Account"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Username / Email</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. alex@vault.domain"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Password *</label>
                  <button
                    type="button"
                    onClick={() => setIsGeneratorOpen(true)}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline text-[11px] font-bold flex items-center space-x-1"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>Generate Secure</span>
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Website URL</label>
                <input
                  type="text"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://github.com/login"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                >
                  <option value="General">General</option>
                  <option value="Work">Work</option>
                  <option value="Social">Social</option>
                  <option value="Finance">Finance</option>
                  <option value="Email">Email</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Private Notes (Encrypted)</label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional secret recovery codes..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md"
                >
                  Save Credential
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
