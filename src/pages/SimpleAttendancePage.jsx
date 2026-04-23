import { useCallback, useEffect, useMemo, useState } from 'react';
import AppHeader from '../components/layout/AppHeader';
import { useAuth } from '../hooks/useAuth';
import { useUnit } from '../hooks/useUnit';
import { useToast } from '../contexts/ToastContext';
import { getAttendance, saveSimpleCount } from '../services/attendance';
import { currentSundayIso, formatPtBrDate } from '../utils/attendanceDate';

export default function SimpleAttendancePage() {
  const { firebaseUser } = useAuth();
  const { unitId, loading: unitLoading } = useUnit();
  const { showToast } = useToast();

  const todayDate = useMemo(() => currentSundayIso(), []);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(null);

  useEffect(() => {
    if (!unitId || unitLoading) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const existing = await getAttendance(unitId, todayDate);
        if (cancelled) return;
        const loaded = Number.isFinite(existing?.simpleCount)
          ? existing.simpleCount
          : 0;
        setCount(loaded);
        setSavedCount(existing?.simpleCount ?? null);
      } catch (err) {
        console.error('Falha ao carregar contagem simples:', err);
        showToast('Erro ao carregar contagem.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [unitId, unitLoading, todayDate, showToast]);

  const increment = useCallback(() => {
    navigator.vibrate?.(40);
    setCount((prev) => prev + 1);
  }, []);

  const decrement = useCallback(() => {
    navigator.vibrate?.(40);
    setCount((prev) => (prev > 0 ? prev - 1 : 0));
  }, []);

  async function handleSave() {
    if (!unitId) return;
    setSaving(true);
    try {
      await saveSimpleCount(unitId, todayDate, count, firebaseUser?.uid);
      setSavedCount(count);
      showToast('Contagem salva.');
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar contagem.');
    } finally {
      setSaving(false);
    }
  }

  const isDirty = savedCount === null || savedCount !== count;
  const statusLabel = saving
    ? 'Salvando...'
    : !isDirty && savedCount !== null
      ? 'Salvo'
      : 'Não salvo';

  return (
    <>
      <AppHeader />
      <div className="app-content">
        <div className="attendance-simple">
          <div className="attendance-simple-header">
            <h2>Contagem de Frequência</h2>
            <p className="attendance-date">{formatPtBrDate(todayDate)}</p>
          </div>

          {loading ? (
            <div className="attendance-simple-loading">Carregando...</div>
          ) : (
            <>
              <div
                className="attendance-counter-display"
                aria-live="polite"
                aria-label={`Total atual: ${count}`}
              >
                {count}
              </div>

              <div className="attendance-counter-controls">
                <button
                  type="button"
                  className="attendance-btn-minus"
                  onClick={decrement}
                  disabled={count === 0}
                  aria-label="Diminuir contagem"
                >
                  −
                </button>
                <button
                  type="button"
                  className="attendance-btn-plus"
                  onClick={increment}
                  aria-label="Aumentar contagem"
                >
                  +
                </button>
              </div>

              <div className="attendance-save-row">
                <button
                  type="button"
                  className="btn btn-primary attendance-save-btn"
                  onClick={handleSave}
                  disabled={saving || !isDirty}
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
                <span
                  className="attendance-save-status"
                  data-status={isDirty ? 'dirty' : 'saved'}
                >
                  {statusLabel}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
