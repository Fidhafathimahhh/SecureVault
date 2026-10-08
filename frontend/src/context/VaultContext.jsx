import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const VaultContext = createContext();

export function VaultProvider({ children }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [stats, setStats] = useState({
    filesCount: 0,
    passwordsCount: 0,
    notesCount: 0,
    documentsCount: 0,
    totalStorageBytes: 0,
  });

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const lockVault = () => {
    setIsLocked(true);
    addToast('Vault locked automatically for your security', 'warning');
  };

  const unlockVault = async (password, userEmail) => {
    try {
      // Re-authenticate user password to unlock
      await API.post('/auth/login', { email: userEmail, password });
      setIsLocked(false);
      addToast('Vault unlocked successfully', 'success');
      return true;
    } catch (err) {
      addToast('Invalid password. Vault remains locked.', 'error');
      return false;
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await API.get('/dashboard/stats');
      setStats(res.data.stats);
    } catch (e) {
      // Ignore initial stats load errors
    }
  };

  return (
    <VaultContext.Provider
      value={{
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        isLocked,
        lockVault,
        unlockVault,
        toasts,
        addToast,
        removeToast,
        stats,
        fetchDashboardStats,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  return useContext(VaultContext);
}
