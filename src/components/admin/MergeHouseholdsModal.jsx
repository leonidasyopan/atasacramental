import { useState, useEffect, useMemo } from 'react';
import { normalizeForSearch } from '../../utils/textSearch';

export default function MergeHouseholdsModal({
  households = [],
  members = [],
  isOpen,
  onClose,
  onMerge,
  initialSourceId = '',
}) {
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [searchSource, setSearchSource] = useState('');
  const [searchTarget, setSearchTarget] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setSourceId(initialSourceId || '');
    setTargetId('');
    setSearchSource('');
    setSearchTarget('');
    setError(null);
  }, [isOpen, initialSourceId]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !saving) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, saving, onClose]);

  const activeHouseholds = useMemo(
    () => households.filter((h) => h.active !== false),
    [households],
  );

  const filteredSource = useMemo(() => {
    const term = normalizeForSearch(searchSource.trim());
    if (!term) return activeHouseholds;
    return activeHouseholds.filter((h) => {
      const text = normalizeForSearch(
        [h.name, h.displayName, h.headNames].filter(Boolean).join(' '),
      );
      return text.includes(term);
    });
  }, [activeHouseholds, searchSource]);

  const filteredTarget = useMemo(() => {
    const term = normalizeForSearch(searchTarget.trim());
    const candidates = activeHouseholds.filter((h) => h.id !== sourceId);
    if (!term) return candidates;
    return candidates.filter((h) => {
      const text = normalizeForSearch(
        [h.name, h.displayName, h.headNames].filter(Boolean).join(' '),
      );
      return text.includes(term);
    });
  }, [activeHouseholds, sourceId, searchTarget]);

  const sourceMembers = useMemo(() => {
    if (!sourceId) return [];
    return members.filter((m) => m.householdId === sourceId && m.active !== false);
  }, [members, sourceId]);

  const targetMembers = useMemo(() => {
    if (!targetId) return [];
    return members.filter((m) => m.householdId === targetId && m.active !== false);
  }, [members, targetId]);

  const sourceHousehold = useMemo(
    () => activeHouseholds.find((h) => h.id === sourceId),
    [activeHouseholds, sourceId],
  );

  const targetHousehold = useMemo(
    () => activeHouseholds.find((h) => h.id === targetId),
    [activeHouseholds, targetId],
  );

  if (!isOpen) return null;

  async function handleConfirm(e) {
    e.preventDefault();
    if (!sourceId || !targetId) {
      setError('Selecione as duas famílias.');
      return;
    }
    if (sourceId === targetId) {
      setError('A família de origem e de destino devem ser diferentes.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onMerge(sourceId, targetId);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Erro ao unificar famílias.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          width: '100%',
          maxWidth: 620,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>
              🔗 Unificar / Mesclar Famílias
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Transfira todos os membros de uma família secundária ou duplicada para a família principal.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            disabled={saving}
            style={{ fontSize: '1.1rem', padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', overflowY: 'auto' }}>
          {error && (
            <div
              style={{
                background: '#fee2e2',
                color: '#991b1b',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: '0.86rem',
                marginBottom: 16,
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* Source Column */}
            <div
              style={{
                border: '1px solid #fecaca',
                background: '#fff5f5',
                padding: 12,
                borderRadius: 8,
              }}
            >
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#991b1b', marginBottom: 6 }}>
                1. Família de Origem (será desativada)
              </label>
              <input
                type="text"
                value={searchSource}
                onChange={(e) => setSearchSource(e.target.value)}
                placeholder="🔍 Filtrar família origem..."
                style={{ width: '100%', padding: '6px 8px', fontSize: '0.8rem', borderRadius: 6, border: '1px solid #fca5a5', marginBottom: 6 }}
              />
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                style={{ width: '100%', padding: '7px 8px', fontSize: '0.84rem', borderRadius: 6, border: '1px solid #fca5a5' }}
              >
                <option value="">Selecione a família de origem...</option>
                {filteredSource.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.displayName || h.name}
                  </option>
                ))}
              </select>

              {sourceHousehold && (
                <div style={{ marginTop: 10, fontSize: '0.78rem', color: '#7f1d1d' }}>
                  <strong>Membros ({sourceMembers.length}):</strong>
                  {sourceMembers.length === 0 ? (
                    <p style={{ margin: '4px 0 0', fontStyle: 'italic', color: '#991b1b' }}>Nenhum membro ativo.</p>
                  ) : (
                    <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
                      {sourceMembers.map((m) => (
                        <li key={m.id}>{m.name}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Target Column */}
            <div
              style={{
                border: '1px solid #bbf7d0',
                background: '#f0fdf4',
                padding: 12,
                borderRadius: 8,
              }}
            >
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#166534', marginBottom: 6 }}>
                2. Família de Destino (receberá todos)
              </label>
              <input
                type="text"
                value={searchTarget}
                onChange={(e) => setSearchTarget(e.target.value)}
                placeholder="🔍 Filtrar família destino..."
                style={{ width: '100%', padding: '6px 8px', fontSize: '0.8rem', borderRadius: 6, border: '1px solid #86efac', marginBottom: 6 }}
              />
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                style={{ width: '100%', padding: '7px 8px', fontSize: '0.84rem', borderRadius: 6, border: '1px solid #86efac' }}
              >
                <option value="">Selecione a família de destino...</option>
                {filteredTarget.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.displayName || h.name}
                  </option>
                ))}
              </select>

              {targetHousehold && (
                <div style={{ marginTop: 10, fontSize: '0.78rem', color: '#14532d' }}>
                  <strong>Membros atuais ({targetMembers.length}):</strong>
                  {targetMembers.length === 0 ? (
                    <p style={{ margin: '4px 0 0', fontStyle: 'italic', color: '#166534' }}>Família atualmente sem membros.</p>
                  ) : (
                    <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
                      {targetMembers.map((m) => (
                        <li key={m.id}>{m.name}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action explanation summary */}
          {sourceHousehold && targetHousehold && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                fontSize: '0.84rem',
                color: '#1e40af',
                marginBottom: 16,
              }}
            >
              <strong>Resumo da operação:</strong>
              <p style={{ margin: '6px 0 0' }}>
                Todos os <strong>{sourceMembers.length} membro(s)</strong> de{' '}
                <em>&quot;{sourceHousehold.displayName || sourceHousehold.name}&quot;</em> serão
                transferidos para a família{' '}
                <em>&quot;{targetHousehold.displayName || targetHousehold.name}&quot;</em>.
                A família de origem será desativada.
              </p>
            </div>
          )}

          {/* Footer buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirm}
              disabled={saving || !sourceId || !targetId || sourceId === targetId}
              style={{
                background: '#4f46e5',
                borderColor: '#4338ca',
              }}
            >
              {saving ? 'Unificando...' : 'Confirmar Unificação'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
