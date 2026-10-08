import { useEffect, useRef } from 'react';
import { useVault } from '../context/VaultContext';
import { useAuth } from '../context/AuthContext';

export function useAutoLock() {
  const { user } = useAuth();
  const { isLocked, lockVault } = useVault();
  const timerRef = useRef(null);

  useEffect(() => {
    if (!user || isLocked) return;

    const lockMinutes = user.auto_lock_minutes || 15;
    if (lockMinutes === 0) return; // 0 means Never lock automatically

    const timeoutMs = lockMinutes * 60 * 1000;

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        lockVault();
      }, timeoutMs);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [user, isLocked]);
}
