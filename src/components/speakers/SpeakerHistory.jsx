import { useMemo, useState } from 'react';
import PeriodFilter from './PeriodFilter';
import { filterLogByPeriod, formatDateBR } from '../../utils/speakerHelpers';

export default function SpeakerHistory({ speakerLog }) {
  const [period, setPeriod] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let result = filterLogByPeriod(speakerLog, period);
    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      result = result.filter(
        (e) =>
          (e.name || '').toLowerCase().includes(needle) ||
          (e.topic || '').toLowerCase().includes(needle),
      );
    }
    return result;
  }, [speakerLog, period, search]);

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <PeriodFilter value={period} onChange={setPeriod} />
        <div className="field" style={{ flex: '1 1 200px', minWidth: 180 }}>
          <input
            type="text"
            placeholder="Buscar por nome ou tema..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: '#9ca3af', fontStyle: 'italic', padding: '20px 0' }}>
          Nenhum registro encontrado.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="dyn-table table-history">
            <thead>
              <tr>
                <th style={{ width: '18%' }}>Data</th>
                <th>Discursante</th>
                <th>Tema</th>
                <th style={{ width: '12%', textAlign: 'center' }}>Duração</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id}>
                  <td style={{ fontWeight: 600 }}>{formatDateBR(entry.data)}</td>
                  <td>{entry.name || '-'}</td>
                  <td>{entry.topic || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    {entry.duration ? `${entry.duration} min` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
