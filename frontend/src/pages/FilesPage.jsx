import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useVault } from '../context/VaultContext';
import {
  Upload,
  FolderPlus,
  Folder,
  File,
  FileText,
  Image,
  Archive,
  Download,
  Trash2,
  Edit2,
  Search,
  Lock,
  X,
  Loader2,
} from 'lucide-react';

export default function FilesPage() {
  const { addToast, fetchDashboardStats } = useVault();
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileCategory, setFileCategory] = useState('General');
  const [uploading, setUploading] = useState(false);

  // Rename modal
  const [renameFileId, setRenameFileId] = useState(null);
  const [renameFileName, setRenameFileName] = useState('');

  const loadFiles = async () => {
    setLoading(true);
    try {
      const res = await API.get('/files', {
        params: {
          folderId: currentFolderId,
          search: search.trim(),
          category,
        },
      });
      setFiles(res.data.files || []);
      setFolders(res.data.folders || []);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [currentFolderId, category]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadFiles();
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('folderId', currentFolderId);
      formData.append('category', fileCategory);

      await API.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      addToast(`File '${selectedFile.name}' uploaded & AES-256-GCM encrypted successfully!`, 'success');
      setIsUploadOpen(false);
      setSelectedFile(null);
      loadFiles();
      fetchDashboardStats();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await API.post('/files/folders', {
        name: newFolderName.trim(),
        parentId: currentFolderId === 'root' ? null : currentFolderId,
      });

      addToast(`Folder '${newFolderName}' created.`, 'success');
      setIsFolderModalOpen(false);
      setNewFolderName('');
      loadFiles();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDownload = async (file) => {
    try {
      const response = await API.get(`/files/${file.id}/download`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.original_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      addToast(`Decrypted and downloaded '${file.original_name}'`, 'success');
    } catch (err) {
      addToast('Download failed or permission denied.', 'error');
    }
  };

  const handleDeleteFile = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete '${name}'?`)) return;

    try {
      await API.delete(`/files/${id}`);
      addToast(`Deleted file '${name}'`, 'info');
      loadFiles();
      fetchDashboardStats();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!renameFileName.trim()) return;

    try {
      await API.put(`/files/${renameFileId}/rename`, { name: renameFileName.trim() });
      addToast('File renamed successfully.', 'success');
      setRenameFileId(null);
      loadFiles();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const getFileIcon = (mimeType = '', name = '') => {
    const ext = name.split('.').pop().toLowerCase();
    if (mimeType.includes('image') || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      return <Image className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    }
    if (mimeType.includes('pdf') || ext === 'pdf') {
      return <FileText className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return <Archive className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
    }
    return <File className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <span>Encrypted File Vault 📁</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Files are encrypted with AES-256-GCM before persistent storage.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsFolderModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 transition shadow-xs"
          >
            <FolderPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>New Folder</span>
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 transition"
          >
            <Upload className="w-4 h-4" />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files by name..."
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
          <option value="Personal">Personal</option>
          <option value="Work">Work</option>
          <option value="Financial">Financial</option>
        </select>
      </div>

      {/* Folders List */}
      {folders.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Folders</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {folders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => setCurrentFolderId(folder.id)}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 transition cursor-pointer flex items-center space-x-3 group shadow-xs"
              >
                <Folder className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">{folder.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-12 flex justify-center items-center text-slate-400 space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs">Securing your file vault... 🔐</span>
          </div>
        ) : files.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="inline-flex p-3 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400">
              <File className="w-8 h-8" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Your file vault is empty.</p>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center space-x-1"
            >
              <span>Upload your first file now</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Name</th>
                  <th className="py-3.5 px-4 font-bold">Size</th>
                  <th className="py-3.5 px-4 font-bold">Upload Date</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white flex items-center space-x-3">
                      {getFileIcon(file.mime_type, file.original_name)}
                      <span className="truncate max-w-xs">{file.original_name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono">{formatBytes(file.file_size)}</td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono">
                      {new Date(file.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-mono font-semibold">
                        <Lock className="w-3 h-3" />
                        <span>AES-256-GCM</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => handleDownload(file)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 border border-slate-200 dark:border-slate-700 transition"
                        title="Decrypted Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setRenameFileId(file.id);
                          setRenameFileName(file.original_name);
                        }}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 border border-slate-200 dark:border-slate-700 transition"
                        title="Rename"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteFile(file.id, file.original_name)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-rose-600 border border-slate-200 dark:border-slate-700 transition"
                        title="Delete File"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload File Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Upload File to Vault</h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Select File</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <select
                  value={fileCategory}
                  onChange={(e) => setFileCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                >
                  <option value="General">General</option>
                  <option value="Personal">Personal</option>
                  <option value="Work">Work</option>
                  <option value="Financial">Financial</option>
                </select>
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

      {/* New Folder Modal */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New Folder</h3>
              <button onClick={() => setIsFolderModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Folder Name</label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Confidential Reports"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFolderModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename File Modal */}
      {renameFileId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Rename File</h3>
              <button onClick={() => setRenameFileId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRenameSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">File Name</label>
                <input
                  type="text"
                  required
                  value={renameFileName}
                  onChange={(e) => setRenameFileName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRenameFileId(null)}
                  className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
