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
              {loading && <p>Carregando...</p>}
              {error && <p className="auth-error">Erro ao carregar histórico.</p>}
              {!loading && atas.length === 0 && (
                <p style={{ color: '#6b7280' }}>Nenhuma ata finalizada ainda.</p>
              )}
              {!loading && atas.length > 0 && (
                <table className="dyn-table">
                  <thead>
                    <tr>
                      <th style={{ width: '20%' }}>Data</th>
                      <th>Presidida por</th>
                      <th>Dirigida por</th>
                      <th style={{ width: '10%' }}>Freq.</th>
                      <th style={{ width: '12%' }} />
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
                          <td>{formatDate(data)}</td>
                          <td>{pres || ''}</td>
                          <td>{dir || ''}</td>
                          <td>{a.frequencia || ''}</td>
                          <td>
                            <Link className="btn btn-ghost btn-sm" to={`/historico/${a.id}`}>
                              Ver
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
