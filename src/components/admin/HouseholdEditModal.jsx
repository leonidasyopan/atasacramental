import { useState, useEffect } from 'react';

export default function HouseholdEditModal({
  household,
  isOpen,
  onClose,
  onSave,
}) {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(household && household.id);

  useEffect(() => {
    if (!isOpen) return;
    if (household) {
      setName(household.name || '');
      setDisplayName(household.displayName || '');
      setPhone(household.phone || '');
      setAddress(household.address || '');
    } else {
      setName('');
      setDisplayName('');
      setPhone('');
      setAddress('');
    }
  }, [household, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !saving) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, saving, onClose]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSave({
        id: household?.id,
        name: name.trim(),
        displayName: (displayName || name).trim(),
        phone: phone.trim(),
        address: address.trim(),
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
          maxWidth: 480,
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
              {isEditing ? '✏️ Editar Família' : '＋ Nova Família'}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              {isEditing
                ? 'Atualize os dados cadastrais da família.'
                : 'Cadastre uma nova família na unidade.'}
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
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Nome da Família (obrigatório)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Paz, Ronaldo Rocha & Natália Vicari Faleiro"
              required
              style={{ width: '100%', padding: '8px 10px', fontSize: '0.88rem', borderRadius: 6, border: '1px solid #cbd5e1' }}
            />
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: 4 }}>
              Padrão LCR: &quot;Sobrenome, Nome Chefe &amp; Nome Cônjuge&quot;
            </span>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Nome de Exibição Amigável (opcional)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ex: Família Paz"
              style={{ width: '100%', padding: '8px 10px', fontSize: '0.88rem', borderRadius: 6, border: '1px solid #cbd5e1' }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Telefone (opcional)
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(XX) XXXXX-XXXX"
              style={{ width: '100%', padding: '8px 10px', fontSize: '0.88rem', borderRadius: 6, border: '1px solid #cbd5e1' }}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Endereço (opcional)
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, número, bairro..."
              rows={2}
              style={{ width: '100%', padding: '8px 10px', fontSize: '0.88rem', borderRadius: 6, border: '1px solid #cbd5e1', resize: 'vertical' }}
            />
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
              disabled={saving || !name.trim()}
            >
              {saving ? 'Salvando...' : isEditing ? 'Salvar Família' : 'Criar Família'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
