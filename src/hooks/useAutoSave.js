import { useEffect, useRef, useState } from 'react';

/**
 * Debounced auto-save.
 *
 * Writes to localStorage immediately (instant cache) and invokes the async
 * remote-save callback after `delay` ms of inactivity.
 *
 * Returns status: 'idle' | 'saving' | 'saved' | 'error'.
 */
export function useAutoSave({
  value,
  onSave,
  delay = 1500,
  localStorageKey = null,
  enabled = true,
}) {
  const [status, setStatus] = useState('idle');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);
  const lastSerialized = useRef(null);

  useEffect(() => () => {
    mountedRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const serialized = JSON.stringify(value);
    if (serialized === lastSerialized.current) return;
    lastSerialized.current = serialized;

    if (localStorageKey) {
      try {
        localStorage.setItem(localStorageKey, serialized);
      } catch {
        /* quota / private mode */
      }
    }

    if (!onSave) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus('saving');
    timerRef.current = setTimeout(async () => {
      try {
        await onSave(value);
        if (mountedRef.current) {
          setStatus('saved');
          setLastSavedAt(new Date());
        }
      } catch (err) {
        console.error('Auto-save failed:', err);
        if (mountedRef.current) setStatus('error');
      }
    }, delay);
  }, [value, onSave, delay, localStorageKey, enabled]);

  return { status, lastSavedAt };
}
