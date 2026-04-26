import { useState, useMemo } from 'react';
import PrintInviteLetter from '../print/PrintInviteLetter';

const POSITION_OPTIONS = [
  { value: '', label: '—' },
  { value: '1', label: '1º Orador' },
  { value: '2', label: '2º Orador' },
  { value: '3', label: '3º Orador' },
];

const DURATION_OPTIONS = [
  { value: '', label: '—' },
  { value: '5', label: '5 min' },
  { value: '10', label: '10 min' },
  { value: '15', label: '15 min' },
  { value: '20', label: '20 min' },
];

function findLeaderByRole(leaders, keywords) {
  if (!leaders || !leaders.length) return null;
  const lower = keywords.map((k) => k.toLowerCase());
  return leaders.find((l) => {
    const calling = (l.calling || '').toLowerCase();
    return lower.some((kw) => calling.includes(kw));
  }) || null;
}

export default function InviteLetterPreview({ invite, leaders, unit, onClose }) {
  const secretary = useMemo(
    () => findLeaderByRole(leaders, ['secretário', 'secretária', 'secretario', 'secretaria']),
    [leaders],
  );
  const president = useMemo(
    () => findLeaderByRole(leaders, ['presidente', 'bispo']),
    [leaders],
  );

  const [memberName, setMemberName] = useState(invite?.memberName || '');
  const [dataAlvo, setDataAlvo] = useState(invite?.dataAlvo || '');
  const [topic, setTopic] = useState(invite?.topic || '');
  const [position, setPosition] = useState(invite?.position || '');
  const [duration, setDuration] = useState(invite?.duration ? String(invite.duration) : '');
  const [secretaryName, setSecretaryName] = useState(secretary?.name || '');
  const [secretaryCalling, setSecretaryCalling] = useState(secretary?.calling || '');
  const [secretaryPhone, setSecretaryPhone] = useState(secretary?.phone || '');
  const [leaderName, setLeaderName] = useState(president?.name || '');
  const [leaderCalling, setLeaderCalling] = useState(president?.calling || '');
  const [fontSizePt, setFontSizePt] = useState(11);

  const previewInvite = {
    ...invite,
    memberName,
    dataAlvo,
    topic,
    position,
    duration: duration ? Number(duration) : null,
  };

  function handlePrint() {
    window.print();
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
            <label>Nome do discursante</label>
            <input
              type="text"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
            />
          </div>

          <div className="field-row" style={{ marginBottom: 12, gap: 12 }}>
            <div className="field">
              <label>Data</label>
              <input
                type="date"
                value={dataAlvo}
                onChange={(e) => setDataAlvo(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Posição</label>
              <select value={position} onChange={(e) => setPosition(e.target.value)}>
                {POSITION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Duração</label>
              <select value={duration} onChange={(e) => setDuration(e.target.value)}>
                {DURATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field" style={{ marginBottom: 12 }}>
            <label>Tema</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Tema do discurso"
            />
          </div>

          <div className="field-row" style={{ marginBottom: 12, gap: 12 }}>
            <div className="field">
              <label>Nome do Secretário</label>
              <input
                type="text"
                value={secretaryName}
                onChange={(e) => setSecretaryName(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Chamado do Secretário</label>
              <input
                type="text"
                value={secretaryCalling}
                onChange={(e) => setSecretaryCalling(e.target.value)}
              />
            </div>
          </div>

          <div className="field" style={{ marginBottom: 12 }}>
            <label>WhatsApp do Secretário</label>
            <input
              type="text"
              value={secretaryPhone}
              onChange={(e) => setSecretaryPhone(e.target.value)}
              placeholder="(99) 99999-9999"
            />
          </div>

          <div className="field-row" style={{ marginBottom: 12, gap: 12 }}>
            <div className="field">
              <label>Nome do Presidente/Bispo</label>
              <input
                type="text"
                value={leaderName}
                onChange={(e) => setLeaderName(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Chamado do Presidente/Bispo</label>
              <input
                type="text"
                value={leaderCalling}
                onChange={(e) => setLeaderCalling(e.target.value)}
              />
            </div>
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

      <PrintInviteLetter
        invite={previewInvite}
        unit={unit}
        leaderName={leaderName}
        leaderCalling={leaderCalling}
        secretaryName={secretaryName}
        secretaryCalling={secretaryCalling}
        secretaryPhone={secretaryPhone}
        fontSizePt={fontSizePt}
      />
    </>
  );
}
