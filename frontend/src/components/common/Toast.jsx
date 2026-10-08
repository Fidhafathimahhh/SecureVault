import React from 'react';
import { useVault } from '../../context/VaultContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toasts, removeToast } = useVault();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-sm w-full">
      {toasts.map((toast) => {
        let bgClass = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white';
        let icon = <Info className="w-5 h-5 text-sky-500" />;

        if (toast.type === 'success') {
          bgClass = 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-100';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
        } else if (toast.type === 'error') {
          bgClass = 'bg-rose-50 dark:bg-rose-950/90 border-rose-200 dark:border-rose-500/40 text-rose-900 dark:text-rose-100';
          icon = <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
        } else if (toast.type === 'warning') {
          bgClass = 'bg-amber-50 dark:bg-amber-950/90 border-amber-200 dark:border-amber-500/40 text-amber-900 dark:text-amber-100';
          icon = <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
        }

        return (
          <div
            key={toast.id}
            className={`p-4 rounded-2xl border backdrop-blur-md shadow-lg flex items-start space-x-3 animate-in slide-in-from-bottom-5 duration-200 ${bgClass}`}
          >
            <div className="shrink-0 mt-0.5">{icon}</div>
            <div className="flex-1 text-xs font-semibold leading-relaxed">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition p-0.5 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
