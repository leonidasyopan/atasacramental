import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import PrintInviteLetter from '../print/PrintInviteLetter';

export default function InviteLetterPreview({ invite, leaders, unit, onClose }) {
  const secretaries = useMemo(() => {
    if (!leaders) return [];
    return leaders.filter(l => {
      const calling = (l.calling || '').toLowerCase();
      return ['secretário', 'secretária', 'secretario', 'secretaria'].some(kw => calling.includes(kw));
    });
  }, [leaders]);

  const presidents = useMemo(() => {
    if (!leaders) return [];
    return leaders.filter(l => {
      const calling = (l.calling || '').toLowerCase();
      const isPresiding = calling.includes('presidente') || calling.includes('bispo');
      const isCounselor = calling.includes('conselheiro');
      return isPresiding && !isCounselor;
    });
  }, [leaders]);

  // Initialise once on mount — this component is always freshly mounted (conditionally
  // rendered in InviteManager), so lazy initialisers are safe and avoid useEffect loops.
  const [selectedSecretaryId, setSelectedSecretaryId] = useState(() => secretaries[0]?.id ?? '');
  const [selectedPresidentId, setSelectedPresidentId] = useState(() => presidents[0]?.id ?? '');
  const [fontSizePt, setFontSizePt] = useState(11);

  const activeSecretary = secretaries.find(s => s.id === selectedSecretaryId) || secretaries[0] || {};
  const activePresident = presidents.find(p => p.id === selectedPresidentId) || presidents[0] || {};

  function handlePrint() {
    const cls = 'printing-invite-letter';
    document.body.classList.add(cls);
    const cleanup = () => {
      document.body.classList.remove(cls);
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
    // Fallback in case afterprint doesn't fire (some browsers)
    setTimeout(cleanup, 1000);
  }

  return (
    <>
      <div className="invite-form-overlay" onClick={onClose}>
        <div
          className="invite-form"
          style={{ maxWidth: 540 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3>Pré-visualização da Carta-Convite</h3>

          <div className="field" style={{ marginBottom: 12 }}>
            <label>Secretário</label>
            {secretaries.length > 1 ? (
              <select 
                value={selectedSecretaryId} 
                onChange={(e) => setSelectedSecretaryId(e.target.value)}
              >
                {secretaries.map(s => (
                  <option key={s.id} value={s.id}>{s.name} - {s.calling}</option>
                ))}
              </select>
            ) : secretaries.length === 1 ? (
              <div style={{ padding: '8px 12px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 4, fontSize: '0.95rem' }}>
                {secretaries[0].name} - {secretaries[0].calling}
              </div>
            ) : (
              <div style={{ color: '#6b7280', fontSize: '0.9rem', fontStyle: 'italic', marginTop: 4 }}>
                Nenhum secretário cadastrado nas configurações da unidade.
              </div>
            )}
          </div>

          <div className="field" style={{ marginBottom: 12 }}>
            <label>Presidente / Bispo</label>
            {presidents.length > 1 ? (
              <select 
                value={selectedPresidentId} 
                onChange={(e) => setSelectedPresidentId(e.target.value)}
              >
                {presidents.map(p => (
                  <option key={p.id} value={p.id}>{p.name} - {p.calling}</option>
                ))}
              </select>
            ) : presidents.length === 1 ? (
              <div style={{ padding: '8px 12px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 4, fontSize: '0.95rem' }}>
                {presidents[0].name} - {presidents[0].calling}
              </div>
            ) : (
              <div style={{ color: '#6b7280', fontSize: '0.9rem', fontStyle: 'italic', marginTop: 4 }}>
                Nenhum líder (presidente/bispo) cadastrado nas configurações da unidade.
              </div>
            )}
          </div>
          <div className="field" style={{ marginBottom: 16 }}>
            <label>Tamanho da fonte: {fontSizePt}pt</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-ghost-dark btn-sm"
                onClick={() => setFontSizePt((s) => Math.max(8, s - 0.5))}
              >
                A−
              </button>
              <input
                type="range"
                min="8"
                max="14"
                step="0.5"
                value={fontSizePt}
                onChange={(e) => setFontSizePt(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-ghost-dark btn-sm"
                onClick={() => setFontSizePt((s) => Math.min(14, s + 0.5))}
              >
                A+
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost-dark" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={handlePrint}>
              Imprimir / PDF
            </button>
          </div>
        </div>
      </div>

      {createPortal(
        <PrintInviteLetter
          invite={invite}
          unit={unit}
          leaderName={activePresident.name || ''}
          leaderCalling={activePresident.calling || ''}
          secretaryName={activeSecretary.name || ''}
          secretaryCalling={activeSecretary.calling || ''}
          secretaryPhone={activeSecretary.phone || ''}
          fontSizePt={fontSizePt}
        />,
        document.body,
      )}
    </>
  );
}
