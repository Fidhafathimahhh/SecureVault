import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useVault } from '../context/VaultContext';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Lock,
  Smartphone,
  LogOut,
  KeyRound,
  Clock,
  Activity,
  X,
  Loader2,
} from 'lucide-react';

export default function SecurityPage() {
  const { user, logoutAll, updateUserSetting } = useAuth();
  const { lockVault, addToast } = useVault();

  const [statusData, setStatusData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auto-lock state
  const [autoLockMinutes, setAutoLockMinutes] = useState(user?.auto_lock_minutes || 15);

  // Change password modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [changingPass, setChangingPass] = useState(false);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      const [statusRes, sessRes, logRes] = await Promise.all([
        API.get('/security/status'),
        API.get('/security/sessions'),
        API.get('/security/activity'),
      ]);

      setStatusData(statusRes.data);
      setSessions(sessRes.data.sessions || []);
      setActivityLogs(logRes.data.logs || []);
      setAutoLockMinutes(statusRes.data.autoLockMinutes ?? 15);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityData();
  }, []);

  const handleUpdateAutoLock = async (minutes) => {
    try {
      await API.post('/security/auto-lock', { minutes });
      setAutoLockMinutes(minutes);
      updateUserSetting({ auto_lock_minutes: minutes });
      addToast(`Auto-lock timeout set to ${minutes === 0 ? 'Never' : `${minutes} minutes`}.`, 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await API.delete(`/security/sessions/${sessionId}`);
      addToast('Remote session terminated successfully.', 'success');
      loadSecurityData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmNewPassword) {
      addToast('New passwords do not match.', 'error');
      return;
    }

    setChangingPass(true);
    try {
      await API.post('/auth/change-password', passData);
      addToast('Master password updated successfully.', 'success');
      setIsPasswordModalOpen(false);
      setPassData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      loadSecurityData();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Vault Security Health Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                🟢 Vault Secure
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">AES-256-GCM Hardware Encrypted</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
              Account Security Center
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Last login: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{statusData ? new Date(statusData.lastLogin).toLocaleString() : 'Loading...'}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 flex items-center space-x-1.5 transition"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Change Password</span>
          </button>

          <button
            onClick={lockVault}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-amber-700 dark:text-amber-400 flex items-center space-x-1.5 transition"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Vault</span>
          </button>

          <button
            onClick={logoutAll}
            className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 border border-rose-200 dark:border-rose-500/40 text-xs font-semibold rounded-xl text-rose-700 dark:text-rose-300 flex items-center space-x-1.5 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout All Devices</span>
          </button>
        </div>
      </div>

      {/* Auto-Lock Settings Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Auto-Lock Timeout Configuration</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Automatically locks your vault screen after a designated period of inactivity.
        </p>

        <div className="flex flex-wrap gap-3">
          {[5, 10, 15, 30, 0].map((mins) => (
            <button
              key={mins}
              onClick={() => handleUpdateAutoLock(mins)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                autoLockMinutes === mins
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {mins === 0 ? 'Never' : `${mins} Minutes`}
            </button>
          ))}
        </div>
      </div>

      {/* Active Sessions Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Active Sessions ({sessions.length})</span>
          </h3>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {sessions.map((sess) => (
            <div key={sess.id} className="py-3 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-900 dark:text-white truncate max-w-xs">{sess.user_agent}</span>
                  {sess.is_current && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                      Current Device
                    </span>
                  )}
                </div>
                <div className="text-slate-400 font-mono text-[11px]">
                  IP: {sess.ip_address} | Signed in: {new Date(sess.created_at).toLocaleString()}
                </div>
              </div>

              {!sess.is_current && (
                <button
                  onClick={() => handleRevokeSession(sess.id)}
                  className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[11px] font-semibold rounded-xl transition"
                >
                  Terminate
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Security Event Audit Log */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
          <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Security Audit Log</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-bold">Event Type</th>
                <th className="py-2.5 px-3 font-bold">Safe Description</th>
                <th className="py-2.5 px-3 font-bold">IP Address</th>
                <th className="py-2.5 px-3 font-bold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
              {activityLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                  <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">{log.event_type}</td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-sans font-medium">{log.details}</td>
                  <td className="py-2.5 px-3 text-slate-400">{log.ip_address || '127.0.0.1'}</td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Change Master Password</h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Master Password</label>
                <input
                  type="password"
                  required
                  value={passData.currentPassword}
                  onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">New Master Password</label>
                <input
                  type="password"
                  required
                  value={passData.newPassword}
                  onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm New Master Password</label>
                <input
                  type="password"
                  required
                  value={passData.confirmNewPassword}
                  onChange={(e) => setPassData({ ...passData, confirmNewPassword: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPass}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center space-x-1"
                >
                  {changingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Update Password</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
