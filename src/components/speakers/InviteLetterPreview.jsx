import { useState, useMemo, useEffect } from 'react';
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
      return ['presidente', 'bispo'].some(kw => calling.includes(kw));
    });
  }, [leaders]);

  const [selectedSecretaryId, setSelectedSecretaryId] = useState('');
  const [selectedPresidentId, setSelectedPresidentId] = useState('');
  const [fontSizePt, setFontSizePt] = useState(11);

  // Auto-select first available options when lists change
  useEffect(() => {
    if (secretaries.length > 0 && !selectedSecretaryId) {
      setSelectedSecretaryId(secretaries[0].id);
    }
  }, [secretaries, selectedSecretaryId]);

  useEffect(() => {
    if (presidents.length > 0 && !selectedPresidentId) {
      setSelectedPresidentId(presidents[0].id);
    }
  }, [presidents, selectedPresidentId]);

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
            {secretaries.length > 0 ? (
              <select 
                value={selectedSecretaryId} 
                onChange={(e) => setSelectedSecretaryId(e.target.value)}
              >
                {secretaries.map(s => (
                  <option key={s.id} value={s.id}>{s.name} - {s.calling}</option>
                ))}
              </select>
            ) : (
              <div style={{ color: '#6b7280', fontSize: '0.9rem', fontStyle: 'italic', marginTop: 4 }}>
                Nenhum secretário cadastrado nas configurações da unidade.
              </div>
            )}
          </div>

          <div className="field" style={{ marginBottom: 12 }}>
            <label>Presidente / Bispo</label>
            {presidents.length > 0 ? (
              <select 
                value={selectedPresidentId} 
                onChange={(e) => setSelectedPresidentId(e.target.value)}
              >
                {presidents.map(p => (
                  <option key={p.id} value={p.id}>{p.name} - {p.calling}</option>
                ))}
              </select>
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
