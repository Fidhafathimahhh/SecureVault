import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useVault } from '../context/VaultContext';
import {
  FileText,
  Plus,
  Search,
  Star,
  Edit2,
  Trash2,
  X,
  Loader2,
  Clock,
} from 'lucide-react';

export default function NotesPage() {
  const { addToast, fetchDashboardStats } = useVault();
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
  });

  const loadNotes = async () => {
    setLoading(true);
    try {
      const res = await API.get('/notes', {
        params: {
          search: search.trim(),
          tag: tagFilter,
          favorite: favoriteOnly ? 'true' : 'false',
        },
      });
      setNotes(res.data.notes || []);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [tagFilter, favoriteOnly]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadNotes();
  };

  const handleToggleFavorite = async (id) => {
    try {
      const res = await API.post(`/notes/${id}/favorite`);
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_favorite: res.data.is_favorite } : n))
      );
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || formData.content === undefined) {
      addToast('Title and content are required.', 'error');
      return;
    }

    try {
      if (editingId) {
        await API.put(`/notes/${editingId}`, formData);
        addToast('Encrypted note updated.', 'success');
      } else {
        await API.post('/notes', formData);
        addToast('Private note created & encrypted.', 'success');
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ title: '', content: '', tags: '' });
      loadNotes();
      fetchDashboardStats();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleEdit = (note) => {
    setEditingId(note.id);
    setFormData({
      title: note.title,
      content: note.content,
      tags: Array.isArray(note.tags) ? note.tags.join(', ') : note.tags || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete private note '${title}'?`)) return;

    try {
      await API.delete(`/notes/${id}`);
      addToast(`Deleted note '${title}'`, 'info');
      loadNotes();
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
            <span>Encrypted Private Notes 📝</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Note contents are encrypted before persistent storage. Zero plaintext logs.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ title: '', content: '', tags: '' });
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create Note</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes by title or tag..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none transition shadow-xs"
          />
        </form>

        <button
          onClick={() => setFavoriteOnly(!favoriteOnly)}
          className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition ${
            favoriteOnly
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-400'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${favoriteOnly ? 'fill-amber-500 text-amber-500' : ''}`} />
          <span>Favorites Only</span>
        </button>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="py-12 flex justify-center items-center text-slate-400 space-x-2">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs">Decrypting notes payload... 📝</span>
        </div>
      ) : notes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-xs">
          <div className="inline-flex p-3 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400">
            <FileText className="w-8 h-8" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No private notes found.</p>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({ title: '', content: '', tags: '' });
              setIsModalOpen(true);
            }}
            className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center space-x-1"
          >
            <span>Create your first private note now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 transition flex flex-col justify-between space-y-4 shadow-xs group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate pr-2">{note.title}</h3>
                  <button
                    onClick={() => handleToggleFavorite(note.id)}
                    className="text-slate-300 dark:text-slate-600 hover:text-amber-500 transition"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        note.is_favorite ? 'fill-amber-500 text-amber-500' : ''
                      }`}
                    />
                  </button>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-4 whitespace-pre-wrap leading-relaxed font-sans">
                  {note.content}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        onClick={() => setTagFilter(tag)}
                        className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-mono font-semibold cursor-pointer hover:bg-emerald-100"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center space-x-1 font-mono">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{new Date(note.updated_at).toLocaleDateString()}</span>
                  </span>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEdit(note)}
                      className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition"
                      title="Edit Note"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id, note.title)}
                      className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 transition"
                      title="Delete Note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingId ? 'Edit Encrypted Note' : 'Create Private Note'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Master Vault Security Backup Codes"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g. security, backup, confidential"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Note Content *</label>
                <textarea
                  rows="6"
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your private note content here..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md"
                >
                  Encrypt & Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
