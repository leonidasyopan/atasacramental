import { useState, useMemo } from 'react';
import { findMemberId, getNextSunday } from '../../utils/speakerHelpers';

export default function InviteForm({ onSave, onCancel, invite, members, topics }) {
  const isEdit = !!invite;

  const [isExternal, setIsExternal] = useState(invite?.isExternal || false);
  const [memberName, setMemberName] = useState(invite?.memberName || '');
  const [dataAlvo, setDataAlvo] = useState(invite?.dataAlvo || getNextSunday());
  const [topic, setTopic] = useState(invite?.topic || '');
  const [notes, setNotes] = useState(invite?.notes || '');
  const [saving, setSaving] = useState(false);

  const sorted = useMemo(() => {
    if (!members) return [];
    const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });
    return [...members]
      .filter((m) => m.active !== false)
      .sort((a, b) => collator.compare(a.name || '', b.name || ''));
  }, [members]);

  async function handleSave() {
    if (!memberName.trim()) return;
    setSaving(true);
    try {
      const memberId = isExternal ? null : findMemberId(memberName, members);
      await onSave({
        ...(invite || {}),
        memberId: memberId || null,
        memberName: memberName.trim(),
        dataAlvo,
        topic: topic.trim() || null,
        notes: notes.trim() || null,
        isExternal,
      });
    } finally {
      setSaving(false);
    }
  }

  const topicsListId = 'speaker-topics-datalist';

  return (
    <div className="invite-form-overlay" onClick={onCancel}>
      <div className="invite-form" onClick={(e) => e.stopPropagation()}>
        <h3>{isEdit ? 'Editar convite' : 'Novo convite'}</h3>

        <div className="field" style={{ marginBottom: 14 }}>
          <label>Tipo</label>
          <div className="mode-toggle">
            <button
              type="button"
              className={`mode-btn${!isExternal ? ' active' : ''}`}
              onClick={() => setIsExternal(false)}
            >
              Membro da unidade
            </button>
            <button
              type="button"
              className={`mode-btn${isExternal ? ' active' : ''}`}
              onClick={() => setIsExternal(true)}
            >
              Visitante externo
            </button>
          </div>
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <label>{isExternal ? 'Nome do visitante' : 'Membro'}</label>
          {isExternal ? (
            <input
              type="text"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="Nome do visitante"
            />
          ) : (
            <select
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
            >
              <option value="">— Selecione um membro —</option>
              {sorted.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <label>Data alvo</label>
          <input
            type="date"
            value={dataAlvo}
            onChange={(e) => setDataAlvo(e.target.value)}
          />
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <label>Tema sugerido</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Tema do discurso"
            list={topicsListId}
          />
          <datalist id={topicsListId}>
            {(topics || []).map((t, i) => (
              <option key={i} value={t} />
            ))}
          </datalist>
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <label>Observações</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações opcionais"
            rows={3}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost-dark" onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!memberName.trim() || saving}
            onClick={handleSave}
          >
            {saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar convite'}
          </button>
        </div>
      </div>
    </div>
  );
}
