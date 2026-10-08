import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useVault } from '../context/VaultContext';
import {
  FileSpreadsheet,
  Upload,
  Search,
  Lock,
  Download,
  Trash2,
  Edit2,
  FileCheck,
  X,
  Loader2,
} from 'lucide-react';

export default function DocumentsPage() {
  const { addToast, fetchDashboardStats } = useVault();
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [docCategory, setDocCategory] = useState('Identity');
  const [uploading, setUploading] = useState(false);

  // Edit / Rename modal
  const [editingDoc, setEditingDoc] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Identity');

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await API.get('/documents', {
        params: {
          category,
          search: search.trim(),
        },
      });
      setDocuments(res.data.documents || []);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [category]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadDocuments();
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || !title.trim()) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title.trim());
      formData.append('category', docCategory);

      await API.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      addToast(`Sensitive document '${title}' encrypted & uploaded!`, 'success');
      setIsUploadOpen(false);
      setSelectedFile(null);
      setTitle('');
      loadDocuments();
      fetchDashboardStats();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const response = await API.get(`/documents/${doc.id}/download`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.original_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      addToast(`Decrypted & downloaded document '${doc.title}'`, 'success');
    } catch (err) {
      addToast('Download failed or permission denied.', 'error');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Permanently delete document '${title}'?`)) return;

    try {
      await API.delete(`/documents/${id}`);
      addToast(`Deleted document '${title}'`, 'info');
      loadDocuments();
      fetchDashboardStats();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    try {
      await API.put(`/documents/${editingDoc.id}/rename`, {
        title: editTitle.trim(),
        category: editCategory,
      });

      addToast('Document metadata updated.', 'success');
      setEditingDoc(null);
      loadDocuments();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const categories = ['Identity', 'Certificates', 'Legal', 'Financial', 'Personal'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <span>Sensitive Documents Vault 📄</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dedicated vault for identity passports, legal contracts, and financial records.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 transition"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setCategory('')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            category === ''
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          All Documents
        </button>

        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              category === cat
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents by title or file name..."
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none transition shadow-xs"
        />
      </form>

      {/* Documents Grid */}
      {loading ? (
        <div className="py-12 flex justify-center items-center text-slate-400 space-x-2">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs">Securing document vault... 📄</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-xs">
          <div className="inline-flex p-3 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400">
            <FileCheck className="w-8 h-8" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No sensitive documents uploaded yet.</p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center space-x-1"
          >
            <span>Upload your first document</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 transition flex flex-col justify-between space-y-4 shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-semibold">
                    {doc.category || 'Identity'}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{doc.title}</h3>
                  <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">{doc.original_name}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] block">
                    {formatBytes(doc.file_size)}
                  </span>
                  <span className="inline-flex items-center space-x-1 text-emerald-700 dark:text-emerald-400 text-[10px] font-mono font-semibold">
                    <Lock className="w-2.5 h-2.5" />
                    <span>AES-256-GCM</span>
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 border border-slate-200 dark:border-slate-700 transition"
                    title="Download Decrypted"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      setEditingDoc(doc);
                      setEditTitle(doc.title);
                      setEditCategory(doc.category || 'Identity');
                    }}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 border border-slate-200 dark:border-slate-700 transition"
                    title="Edit Metadata"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(doc.id, doc.title)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-rose-600 border border-slate-200 dark:border-slate-700 transition"
                    title="Delete Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Upload Sensitive Document</h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Passport Identity Page"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                >
                  <option value="Identity">Identity (Passport, License, SSN)</option>
                  <option value="Certificates">Certificates & Diplomas</option>
                  <option value="Legal">Legal & Contracts</option>
                  <option value="Financial">Financial & Tax Records</option>
                  <option value="Personal">Personal Records</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">File Document *</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md flex items-center justify-center space-x-1"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <span>Upload & Encrypt</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Document Details</h3>
              <button onClick={() => setEditingDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none"
                >
                  <option value="Identity">Identity</option>
                  <option value="Certificates">Certificates</option>
                  <option value="Legal">Legal</option>
                  <option value="Financial">Financial</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
