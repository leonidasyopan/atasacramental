import { useState } from 'react';
import { saveDiscourseTopics } from '../../services/topics';
import { useUnit } from '../../hooks/useUnit';
import { useToast } from '../../contexts/ToastContext';

export default function TopicManager({ topics, reload }) {
  const { unitId } = useUnit();
  const { showToast } = useToast();
  const [newTopics, setNewTopics] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!newTopics.trim()) return;
    setSaving(true);
    try {
      const lines = newTopics
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      const existing = new Set(topics.map((t) => t.toLowerCase()));
      const merged = [
        ...topics,
        ...lines.filter((l) => !existing.has(l.toLowerCase())),
      ];
      await saveDiscourseTopics(unitId, merged);
      setNewTopics('');
      showToast(`${lines.length} tema(s) processado(s).`);
      await reload();
    } catch (e) {
      console.error(e);
      showToast('Erro ao salvar temas.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(index) {
    const updated = topics.filter((_, i) => i !== index);
    await saveDiscourseTopics(unitId, updated);
    showToast('Tema removido.');
    await reload();
  }

  async function handleClearAll() {
    if (!confirm('Remover todos os temas? Esta ação não pode ser desfeita.')) return;
    await saveDiscourseTopics(unitId, []);
    showToast('Todos os temas foram removidos.');
    await reload();
  }

  return (
    <div>
      <div className="speakers-section">
        <div className="speakers-section-header">
          <h3>Adicionar temas</h3>
        </div>
        <div className="field" style={{ marginBottom: 12 }}>
          <textarea
            value={newTopics}
            onChange={(e) => setNewTopics(e.target.value)}
            placeholder="Cole os temas aqui, um por linha..."
            rows={5}
          />
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!newTopics.trim() || saving}
          onClick={handleAdd}
        >
          {saving ? 'Salvando...' : 'Adicionar'}
        </button>
      </div>

      <div className="speakers-section" style={{ marginTop: 24 }}>
        <div className="speakers-section-header">
          <h3>Temas atuais</h3>
          <span className="speakers-badge">{topics.length}</span>
          {topics.length > 0 && (
            <button
              type="button"
              className="btn btn-ghost-dark btn-sm"
              style={{ marginLeft: 'auto' }}
              onClick={handleClearAll}
            >
              Limpar todos
            </button>
          )}
        </div>
        {topics.length === 0 ? (
          <p style={{ color: '#9ca3af', fontStyle: 'italic', padding: '12px 0' }}>
            Nenhum tema cadastrado.
          </p>
        ) : (
          <ul className="topic-list">
            {topics.map((t, i) => (
              <li key={i} className="topic-item">
                <span>{t}</span>
                <button
                  type="button"
                  className="del-btn"
                  onClick={() => handleRemove(i)}
                  title="Remover tema"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
