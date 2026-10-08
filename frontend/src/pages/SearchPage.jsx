import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { useVault } from '../context/VaultContext';
import { Search, FolderLock, KeyRound, FileText, FileSpreadsheet, Loader2, ArrowRight } from 'lucide-react';

export default function SearchPage() {
  const { searchQuery, setActiveTab, addToast } = useVault();
  const [results, setResults] = useState({ files: [], passwords: [], notes: [], documents: [] });
  const [loading, setLoading] = useState(false);

  const executeSearch = async () => {
    if (!searchQuery.trim()) {
      setResults({ files: [], passwords: [], notes: [], documents: [] });
      return;
    }

    setLoading(true);
    try {
      const res = await API.get('/search', { params: { q: searchQuery.trim() } });
      setResults(res.data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, [searchQuery]);

  const totalResults =
    results.files.length +
    results.passwords.length +
    results.notes.length +
    results.documents.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
          <span>Global Vault Search 🔍</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Searching for <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">"{searchQuery}"</span> across your isolated vault modules.
        </p>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center items-center text-slate-400 space-x-2">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs">Searching vault database...</span>
        </div>
      ) : totalResults === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-xs">
          <div className="inline-flex p-3 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400">
            <Search className="w-8 h-8" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No matching items found for "{searchQuery}".</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Files Section */}
          {results.files.length > 0 && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
                  <FolderLock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Files ({results.files.length})</span>
                </h3>
                <button
                  onClick={() => setActiveTab('files')}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1 font-semibold"
                >
                  <span>Go to Files</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {results.files.map((file) => (
                  <div key={file.id} className="py-2.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white">{file.original_name}</span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {new Date(file.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Passwords Section */}
          {results.passwords.length > 0 && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
                  <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Password Credentials ({results.passwords.length})</span>
                </h3>
                <button
                  onClick={() => setActiveTab('passwords')}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1 font-semibold"
                >
                  <span>Go to Passwords</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {results.passwords.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{p.title}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{p.username}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]">
                      {p.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes Section */}
          {results.notes.length > 0 && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Private Notes ({results.notes.length})</span>
                </h3>
                <button
                  onClick={() => setActiveTab('notes')}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1 font-semibold"
                >
                  <span>Go to Notes</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {results.notes.map((n) => (
                  <div key={n.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{n.title}</span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-md block">{n.preview}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents Section */}
          {results.documents.length > 0 && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Sensitive Documents ({results.documents.length})</span>
                </h3>
                <button
                  onClick={() => setActiveTab('documents')}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1 font-semibold"
                >
                  <span>Go to Documents</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {results.documents.map((doc) => (
                  <div key={doc.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{doc.title}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{doc.original_name}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]">
                      {doc.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
