import { useEffect, useRef, useState } from 'react';
import { getAttendance } from '../../services/attendance';
import { useUnit } from '../../hooks/useUnit';

/**
 * Picks the number of attendees to persist on the Ata.
 *
 * Pulls counts stored under `units/{unitId}/attendance/{date}`:
 *  - simpleCount: quick tally from the counter role
 *  - detailedTotal: members + visitors from the detailed flow
 *
 * Layout: a number input with an inline compact dropdown. Selecting
 * "Detalhada" or "Simples" copies that value into the input; "Manual"
 * keeps the current number editable and doesn't change it.
 */
export default function AttendancePicker({ date, value, onChange }) {
  const { unitId } = useUnit();
  const [loading, setLoading] = useState(false);
  const [attendance, setAttendance] = useState(null);
  const [source, setSource] = useState('manual');
  const lastSyncedSourceValue = useRef(null);

  useEffect(() => {
    if (!unitId || !date) {
      setAttendance(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const doc = await getAttendance(unitId, date);
        if (cancelled) return;
        setAttendance(doc);
      } catch (err) {
        console.error('AttendancePicker load failed:', err);
        if (!cancelled) setAttendance(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [unitId, date]);

  const hasSimple = Number.isFinite(attendance?.simpleCount);
  const hasDetailed = Number.isFinite(attendance?.detailedTotal);

  // If the selected source's count gets updated server-side (e.g. counter
  // saves a new simpleCount), reflect that in the input automatically.
  useEffect(() => {
    if (source === 'manual') return;
    const next =
      source === 'simple' && hasSimple
        ? attendance.simpleCount
        : source === 'detailed' && hasDetailed
          ? attendance.detailedTotal
          : null;
    if (next == null) return;
    if (lastSyncedSourceValue.current === next) return;
    lastSyncedSourceValue.current = next;
    onChange(String(next));
  }, [source, hasSimple, hasDetailed, attendance, onChange]);

  function handleSelectSource(next) {
    setSource(next);
    lastSyncedSourceValue.current = null;
    if (next === 'simple' && hasSimple) {
      onChange(String(attendance.simpleCount));
    } else if (next === 'detailed' && hasDetailed) {
      onChange(String(attendance.detailedTotal));
    }
  }

  const sourceOptions = [];
  if (hasDetailed) {
    sourceOptions.push({
      value: 'detailed',
      label: `Detalhada (${attendance.detailedTotal})`,
    });
  }
  if (hasSimple) {
    sourceOptions.push({
      value: 'simple',
      label: `Simples (${attendance.simpleCount})`,
    });
  }
  sourceOptions.push({ value: 'manual', label: 'Manual' });

  const showDropdown = !loading && (hasSimple || hasDetailed);

  return (
    <div className="attendance-picker">
      <div className="attendance-picker-row">
        <input
          type="number"
          min="0"
          placeholder="ex: 28"
          value={value}
          onChange={(e) => {
            setSource('manual');
            lastSyncedSourceValue.current = null;
            onChange(e.target.value);
          }}
        />
        {showDropdown && (
          <select
            className="attendance-picker-select"
            value={source}
            onChange={(e) => handleSelectSource(e.target.value)}
            aria-label="Fonte da contagem"
          >
            {sourceOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>
      {loading && (
        <p className="attendance-picker-hint">Carregando contagens salvas...</p>
      )}
      {!loading && !hasSimple && !hasDetailed && date && (
        <p className="attendance-picker-hint">
          Nenhuma contagem registrada para esta data.
        </p>
      )}
    </div>
  );
}
