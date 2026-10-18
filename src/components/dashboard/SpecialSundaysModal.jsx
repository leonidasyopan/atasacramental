import { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { formatDateBR } from '../../utils/speakerHelpers';
import {
  saveCalendarSettings,
  addSpecialSunday,
  removeSpecialSunday,
  getCalendarSettings,
} from '../../services/calendar';

export default function SpecialSundaysModal({
  isOpen,
  onClose,
  unitId,
  calendarSettings,
  onSettingsSaved,
}) {
  const { showToast } = useToast();
  const [autoGC, setAutoGC] = useState(true);
  const [specialSundays, setSpecialSundays] = useState([]);
  const [saving, setSaving] = useState(false);

  // New item form state
  const [newDate, setNewDate] = useState('');
  const [newType, setNewType] = useState('stake_conference');
  const [newTitle, setNewTitle] = useState('Conferência de Estaca');
  const [newNotes, setNewNotes] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setAutoGC(calendarSettings?.autoGeneralConference !== false);
    setSpecialSundays(Array.isArray(calendarSettings?.specialSundays) ? calendarSettings.specialSundays : []);
    setFormError('');
  }, [isOpen, calendarSettings]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !saving) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, saving, onClose]);

  if (!isOpen) return null;

  async function handleToggleAutoGC(e) {
    const val = e.target.checked;
    setAutoGC(val);
    if (!unitId) return;
    setSaving(true);
    try {
      const updated = {
        autoGeneralConference: val,
        specialSundays,
      };
      await saveCalendarSettings(unitId, updated);
      onSettingsSaved?.(updated);
      showToast(val ? 'Conferência Geral automática ativada.' : 'Conferência Geral automática desativada.');
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar configuração.');
    } finally {
      setSaving(false);
    }
  }

  function handleTypeChange(val) {
    setNewType(val);
    if (val === 'stake_conference') {
      setNewTitle('Conferência de Estaca');
    } else if (val === 'general_conference') {
      setNewTitle('Conferência Geral');
    } else {
      setNewTitle('');
    }
  }

  async function handleAddSpecialSunday(e) {
    e.preventDefault();
    if (!unitId || !newDate) return;

    // Check day of week: warn if not Sunday
    const [y, m, d] = newDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (dateObj.getDay() !== 0) {
      setFormError('Aviso: A data selecionada não cai em um domingo. Certifique-se de escolher um domingo.');
    } else {
      setFormError('');
    }

    setSaving(true);
    try {
      await addSpecialSunday(unitId, {
        date: newDate,
        type: newType,
        title: newTitle.trim() || (newType === 'stake_conference' ? 'Conferência de Estaca' : 'Sem Reunião'),
        notes: newNotes.trim(),
      });
      const fresh = await getCalendarSettings(unitId);
      setSpecialSundays(fresh.specialSundays || []);
      onSettingsSaved?.(fresh);
      setNewDate('');
      setNewNotes('');
      setNewType('stake_conference');
      setNewTitle('Conferência de Estaca');
      setFormError('');
      showToast('Data especial adicionada com sucesso.');
    } catch (err) {
      console.error(err);
      showToast('Erro ao adicionar data especial.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveSpecialSunday(dateToRemove) {
    if (!unitId) return;
    setSaving(true);
    try {
      await removeSpecialSunday(unitId, dateToRemove);
      const fresh = await getCalendarSettings(unitId);
      setSpecialSundays(fresh.specialSundays || []);
      onSettingsSaved?.(fresh);
      showToast('Data especial removida.');
    } catch (err) {
      console.error(err);
      showToast('Erro ao remover data especial.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
        backdropFilter: 'blur(2px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: 580,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
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
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontWeight: 700 }}>
              📅 Domingos Especiais & Calendário
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Sinalize datas sem Reunião Sacramental (Conferência Geral, Conferência de Estaca, etc.)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.4rem',
              color: '#94a3b8',
              cursor: 'pointer',
              lineHeight: 1,
              padding: 4,
            }}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* Body (scrollable) */}
        <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Automatic General Conference Section */}
          <div
            style={{
              background: '#f5f3ff',
              border: '1px solid #ddd6fe',
              borderRadius: 8,
              padding: '12px 14px',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={autoGC}
                onChange={handleToggleAutoGC}
                disabled={saving}
                style={{ marginTop: 3, accentColor: '#7c3aed', width: 16, height: 16 }}
              />
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#4c1d95', display: 'block' }}>
                  Conferência Geral Automática
                </span>
                <span style={{ fontSize: '0.78rem', color: '#6d28d9', display: 'block', marginTop: 2 }}>
                  Sinaliza automaticamente o 1º domingo de abril e o 1º domingo de outubro como datas sem reunião sacramental na unidade.
                </span>
              </div>
            </label>
          </div>

          {/* Configured Special Sundays List */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>
              Datas Cadastradas ({specialSundays.length})
            </h4>

            {specialSundays.length === 0 ? (
              <div
                style={{
                  padding: '14px 12px',
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: 6,
                  fontSize: '0.82rem',
                  color: '#64748b',
                  textAlign: 'center',
                }}
              >
                Nenhuma data específica cadastrada ainda. Utilize o formulário abaixo para adicionar as Conferências de Estaca.
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  maxHeight: 180,
                  overflowY: 'auto',
                }}
              >
                {specialSundays.map((item) => (
                  <div
                    key={item.date}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      fontSize: '0.84rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>
                          {formatDateBR(item.date)}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: '#ede9fe',
                            color: '#5b21b6',
                            fontWeight: 600,
                          }}
                        >
                          {item.title}
                        </span>
                      </div>
                      {item.notes && (
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>
                          {item.notes}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecialSunday(item.date)}
                      disabled={saving}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        padding: '4px 8px',
                        borderRadius: 4,
                        transition: 'background 0.12s',
                      }}
                      title="Excluir data"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form to Add Special Sunday */}
          <form
            onSubmit={handleAddSpecialSunday}
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <h4 style={{ margin: 0, fontSize: '0.88rem', color: '#1e293b', fontWeight: 600 }}>
              ＋ Adicionar Data sem Reunião (ex: Conferência de Estaca)
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              <div>
                <label
                  htmlFor="special-sunday-date"
                  style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}
                >
                  Data (Domingo)
                </label>
                <input
                  id="special-sunday-date"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: '0.84rem',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="special-sunday-type"
                  style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}
                >
                  Tipo
                </label>
                <select
                  id="special-sunday-type"
                  value={newType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: '0.84rem',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                  }}
                >
                  <option value="stake_conference">Conferência de Estaca</option>
                  <option value="general_conference">Conferência Geral</option>
                  <option value="other">Outro Evento</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="special-sunday-title"
                  style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}
                >
                  Título / Rótulo
                </label>
                <input
                  id="special-sunday-title"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Conferência de Estaca"
                  required
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: '0.84rem',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="special-sunday-notes"
                style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}
              >
                Observações (opcional)
              </label>
              <input
                id="special-sunday-notes"
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Ex: Sessão geral às 10h na sede da estaca"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '0.84rem',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                }}
              />
            </div>

            {formError && (
              <div style={{ fontSize: '0.75rem', color: '#b45309', background: '#fef3c7', padding: '6px 8px', borderRadius: 4 }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || !newDate}
                style={{ fontSize: '0.82rem', padding: '6px 14px' }}
              >
                {saving ? 'Adicionando...' : 'Adicionar Data'}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
