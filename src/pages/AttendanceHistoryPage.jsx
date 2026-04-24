import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import { useUnit } from '../hooks/useUnit';
import { getRecentAttendances } from '../services/attendance';
import { formatPtBrDate } from '../utils/attendanceDate';

export default function AttendanceHistoryPage() {
  const { unitId } = useUnit();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!unitId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await getRecentAttendances(unitId, 30);
        if (!cancelled) setRows(list);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [unitId]);

  return (
    <>
      <AppHeader />
      <div className="app-content">
        <div className="form-wrap">
          <div className="card">
            <div className="card-header">
              <div className="card-header-left">
                <h2>Histórico de Frequência</h2>
              </div>
            </div>
            <div className="card-body">
              {loading && <p>Carregando...</p>}
              {error && (
                <p className="auth-error">Erro ao carregar histórico.</p>
              )}
              {!loading && rows.length === 0 && !error && (
                <p style={{ color: '#6b7280' }}>
                  Nenhuma contagem registrada ainda.
                </p>
              )}
              {!loading && rows.length > 0 && (
                <div className="attendance-history-table-wrap">
                  <table className="dyn-table attendance-history-table">
                    <thead>
                      <tr>
                        <th>Domingo</th>
                        <th style={{ width: '14%' }}>Simples</th>
                        <th style={{ width: '14%' }}>Detalhada</th>
                        <th style={{ width: '32%' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => {
                        const simple = Number.isFinite(Number(r.simpleCount))
                          ? r.simpleCount
                          : null;
                        const detailed = Number.isFinite(
                          Number(r.detailedTotal),
                        )
                          ? r.detailedTotal
                          : null;
                        return (
                          <tr key={r.id}>
                            <td className="attendance-history-date">
                              {formatPtBrDate(r.date)}
                            </td>
                            <td>{simple ?? '—'}</td>
                            <td>{detailed ?? '—'}</td>
                            <td>
                              <div className="attendance-history-actions">
                                <Link
                                  className="btn btn-ghost-dark btn-sm"
                                  to={`/frequencia/simples?date=${r.date}`}
                                >
                                  Editar simples
                                </Link>
                                <Link
                                  className="btn btn-primary btn-sm"
                                  to={`/frequencia/detalhado?date=${r.date}`}
                                >
                                  Editar detalhada
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
