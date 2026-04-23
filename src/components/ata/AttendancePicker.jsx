import { useEffect, useState } from 'react';
import { getAttendance } from '../../services/attendance';
import { useUnit } from '../../hooks/useUnit';

/**
 * Picks the number of attendees to persist on the Ata.
 *
 * Pulls counts stored under `units/{unitId}/attendance/{date}`:
 *  - simpleCount: quick tally from the counter role
 *  - detailedTotal: members + visitors from the detailed flow
 *
 * When both exist, the secretary picks which value to copy onto the Ata;
 * the input always remains editable as a manual override.
 */
export default function AttendancePicker({ date, value, onChange }) {
  const { unitId } = useUnit();
  const [loading, setLoading] = useState(false);
  const [attendance, setAttendance] = useState(null);
  const [source, setSource] = useState('manual');

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

  function applyValue(raw) {
    const str = raw === null || raw === undefined ? '' : String(raw);
    onChange(str);
  }

  function handleSelectSource(next) {
    setSource(next);
    if (next === 'simple' && hasSimple) applyValue(attendance.simpleCount);
    else if (next === 'detailed' && hasDetailed)
      applyValue(attendance.detailedTotal);
  }

  return (
    <div className="attendance-picker">
      <input
        type="number"
        min="0"
        placeholder="ex: 28"
        value={value}
        onChange={(e) => {
          setSource('manual');
          onChange(e.target.value);
        }}
      />
      {loading && (
        <p className="attendance-picker-hint">Carregando contagens salvas...</p>
      )}
      {!loading && (hasSimple || hasDetailed) && (
        <div className="attendance-picker-options">
          {hasSimple && (
            <label className="attendance-picker-option">
              <input
                type="radio"
                name="attendance-picker"
                checked={source === 'simple'}
                onChange={() => handleSelectSource('simple')}
              />
              Contagem simples: <strong>{attendance.simpleCount}</strong>
            </label>
          )}
          {hasDetailed && (
            <label className="attendance-picker-option">
              <input
                type="radio"
                name="attendance-picker"
                checked={source === 'detailed'}
                onChange={() => handleSelectSource('detailed')}
              />
              Contagem detalhada: <strong>{attendance.detailedTotal}</strong>
            </label>
          )}
          <label className="attendance-picker-option">
            <input
              type="radio"
              name="attendance-picker"
              checked={source === 'manual'}
              onChange={() => setSource('manual')}
            />
            Manual
          </label>
        </div>
      )}
      {!loading && !hasSimple && !hasDetailed && date && (
        <p className="attendance-picker-hint">
          Nenhuma contagem registrada para esta data.
        </p>
      )}
    </div>
  );
}
