import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import { useUnit } from '../hooks/useUnit';
import { getAtaHistory } from '../services/atas';

function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y) return iso;
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

export default function AtaHistoryPage() {
  const { unitId } = useUnit();
  const [atas, setAtas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!unitId) return;
    (async () => {
      setLoading(true);
      try {
        const list = await getAtaHistory(unitId);
        setAtas(list);
      } catch (e) {
        console.error(e);
        setError(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [unitId]);

  return (
    <>
      <AppHeader />
      <div className="app-content">
        <div className="form-wrap">
          <div className="card">
            <div className="card-header">
              <div className="card-header-left">
                <h2>Histórico de Atas</h2>
              </div>
            </div>
            <div className="card-body">
              {loading && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                  <div className="spinner" style={{ margin: '0 auto 16px', width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  <p>Carregando histórico...</p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}
              {error && <p className="auth-error">Erro ao carregar histórico.</p>}
              {!loading && atas.length === 0 && !error && (
                <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed var(--border)', margin: '10px 0' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📄</div>
                  <h3 style={{ color: 'var(--navy)', marginBottom: '8px', fontSize: '1.1rem' }}>Nenhuma ata finalizada</h3>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', maxWidth: '300px', margin: '0 auto' }}>Você ainda não possui atas cadastradas no histórico. Quando finalizar uma ata, ela aparecerá aqui.</p>
                </div>
              )}
              {!loading && atas.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table className="dyn-table table-history">
                    <thead>
                      <tr>
                        <th style={{ width: '20%' }}>Data</th>
                        <th>Presidida por</th>
                        <th>Dirigida por</th>
                        <th style={{ width: '10%', textAlign: 'center' }}>Freq.</th>
                        <th style={{ width: '12%', textAlign: 'right' }} />
                      </tr>
                    </thead>
                    <tbody>
                      {atas.map((a) => {
                        const data = a.data || a.data_ata || a.date || '';
                        const pres =
                          a.presidida === '__outro__' ? a.presididaOutro : a.presidida;
                        const dir =
                          a.dirigida === '__outro__' ? a.dirigidaOutro : a.dirigida;
                        return (
                          <tr key={a.id}>
                            <td style={{ fontWeight: '600' }}>{formatDate(data)}</td>
                            <td>{pres || '-'}</td>
                            <td>{dir || '-'}</td>
                            <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--navy)' }}>{a.frequencia || '-'}</td>
                            <td style={{ textAlign: 'right' }}>
                              <Link
                                className="btn btn-ghost-dark btn-sm"
                                to={`/historico/${a.id}/editar`}
                              >
                                Editar
                              </Link>
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
