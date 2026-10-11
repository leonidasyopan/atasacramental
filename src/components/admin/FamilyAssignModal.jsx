import { useState, useEffect, useMemo } from 'react';
import { normalizeForSearch } from '../../utils/textSearch';

const ROLES = [
  { value: 'head', label: 'Chefe de família' },
  { value: 'spouse', label: 'Cônjuge' },
  { value: 'child', label: 'Filho(a)' },
  { value: 'other', label: 'Outro' },
];

export default function FamilyAssignModal({
  member,
  households = [],
  isOpen,
  onClose,
  onSave,
}) {
  const [selectedHouseholdId, setSelectedHouseholdId] = useState('');
  const [selectedRole, setSelectedRole] = useState('other');
  const [memberName, setMemberName] = useState('');
  const [searchHousehold, setSearchHousehold] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!member || !isOpen) return;
    setMemberName(member.name || '');
    setSelectedHouseholdId(member.householdId || '');
    setSelectedRole(member.householdRole || 'other');
    setSearchHousehold('');
    setIsCreatingNew(false);
    setNewHouseholdName('');
  }, [member, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !saving) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, saving, onClose]);

  const filteredHouseholds = useMemo(() => {
    const term = normalizeForSearch(searchHousehold.trim());
    if (!term) return households;
    return households.filter((h) => {
      const text = normalizeForSearch(
        [h.name, h.displayName, h.headNames].filter(Boolean).join(' '),
      );
      return text.includes(term);
    });
  }, [households, searchHousehold]);

  if (!isOpen || !member) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!memberName.trim()) return;
    setSaving(true);
    try {
      await onSave({
        memberId: member.id,
        name: memberName.trim(),
        householdId: isCreatingNew ? null : selectedHouseholdId || null,
        newHouseholdName: isCreatingNew ? newHouseholdName.trim() : null,
        householdRole: selectedRole,
      });
      onClose();
    } catch (err) {
      console.error(err);
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
          maxWidth: 520,
          maxHeight: '90vh',
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
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b' }}>
              🏠 Vincular / Alterar Família
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Defina a família e o papel deste membro na unidade.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', overflowY: 'auto' }}>
          {/* Member Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Nome do Membro
            </label>
            <input
              type="text"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="Nome completo do membro"
              required
              style={{ width: '100%', padding: '8px 12px', fontSize: '0.9rem', borderRadius: 6, border: '1px solid #cbd5e1' }}
            />
            <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginTop: 4 }}>
              Você pode corrigir a grafia ou ordem do nome aqui (ex: colocar o sufixo no final).
            </span>
          </div>

          {/* Household Selector Mode */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>
                Família
              </label>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsCreatingNew((prev) => !prev)}
                style={{ fontSize: '0.78rem', color: '#2563eb', padding: '2px 6px' }}
              >
                {isCreatingNew ? '← Escolher existente' : '＋ Criar nova família'}
              </button>
            </div>

            {isCreatingNew ? (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: 12, borderRadius: 8 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#166534', marginBottom: 4 }}>
                  Nome da Nova Família
                </label>
                <input
                  type="text"
                  value={newHouseholdName}
                  onChange={(e) => setNewHouseholdName(e.target.value)}
                  placeholder="Ex: Paz, Ronaldo Rocha & Natália Vicari Faleiro"
                  required
                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.88rem', borderRadius: 6, border: '1px solid #86efac' }}
                />
                <span style={{ fontSize: '0.72rem', color: '#15803d', display: 'block', marginTop: 4 }}>
                  A nova família será criada e este membro será associado a ela imediatamente.
                </span>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={searchHousehold}
                  onChange={(e) => setSearchHousehold(e.target.value)}
                  placeholder="🔍 Filtrar famílias..."
                  style={{ width: '100%', padding: '6px 10px', fontSize: '0.84rem', borderRadius: 6, border: '1px solid #cbd5e1', marginBottom: 8 }}
                />
                <select
                  value={selectedHouseholdId}
                  onChange={(e) => setSelectedHouseholdId(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '0.88rem', borderRadius: 6, border: '1px solid #cbd5e1' }}
                >
                  <option value="">(Sem família cadastrada)</option>
                  {filteredHouseholds.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.displayName || h.name}
                    </option>
                  ))}
                </select>
                {selectedHouseholdId && (
                  <button
                    type="button"
                    onClick={() => setSelectedHouseholdId('')}
                    style={{
                      marginTop: 6,
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                    }}
                  >
                    Desvincular deste membro (deixar sem família)
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Role Selector */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Papel na Família
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {ROLES.map((r) => (
                <label
                  key={r.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: selectedRole === r.value ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                    background: selectedRole === r.value ? '#eff6ff' : '#ffffff',
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                    fontWeight: selectedRole === r.value ? 600 : 400,
                    color: selectedRole === r.value ? '#1d4ed8' : '#334155',
                  }}
                >
                  <input
                    type="radio"
                    name="memberRole"
                    value={r.value}
                    checked={selectedRole === r.value}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  />
                  {r.label}
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
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
              type="submit"
              className="btn btn-primary"
              disabled={saving || (isCreatingNew && !newHouseholdName.trim())}
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
