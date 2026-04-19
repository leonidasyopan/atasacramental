import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import PrintDocument from '../components/print/PrintDocument';
import { useUnit } from '../hooks/useUnit';
import { getAta } from '../services/atas';

export default function AtaViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { unitId, unit, unitType } = useUnit();
  const [ata, setAta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fontSizePt, setFontSizePt] = useState(() => {
    const stored = Number(localStorage.getItem('ata:fontSizePt'));
    return Number.isFinite(stored) && stored >= 6 && stored <= 14 ? stored : 8;
  });

  useEffect(() => {
    if (!unitId || !id) return;
    (async () => {
      setLoading(true);
      try {
        const doc = await getAta(unitId, id);
        setAta(doc);
      } finally {
        setLoading(false);
      }
    })();
  }, [unitId, id]);

  function onFontSizeChange(delta) {
    setFontSizePt((p) => {
      const next = Math.min(14, Math.max(6, p + delta));
      localStorage.setItem('ata:fontSizePt', String(next));
      return next;
    });
  }

  const ataForPrint = useMemo(
    () => (ata ? { ...(ata.data || ata), unitType } : null),
    [ata, unitType],
  );

  return (
    <>
      <AppHeader
        fontSizePt={fontSizePt}
        onFontSizeChange={onFontSizeChange}
        onPrint={() => window.print()}
      />
      <div className="app-content">
        <div className="form-wrap">
          <div style={{ marginBottom: 12 }}>
            <button className="btn btn-ghost" onClick={() => navigate('/historico')}>
              ← Voltar ao histórico
            </button>
          </div>
          {loading && <p>Carregando...</p>}
          {!loading && !ata && <p>Ata não encontrada.</p>}
          {!loading && ata && (
            <div className="card">
              <div className="card-header">
                <div className="card-header-left">
                  <h2>Ata Finalizada</h2>
                </div>
              </div>
              <div className="card-body">
                <p style={{ color: '#6b7280' }}>
                  Esta ata está em modo somente-leitura. Use o botão &quot;Imprimir / PDF&quot; para
                  gerar o documento.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      {ataForPrint && <PrintDocument ata={ataForPrint} unit={unit} fontSizePt={fontSizePt} />}
    </>
  );
}
