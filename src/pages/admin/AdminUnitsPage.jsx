import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { useUnit } from '../../hooks/useUnit';
import { useToast } from '../../contexts/ToastContext';
import {
  updateUnit,
  getLeaders,
  addLeader,
  updateLeader,
  deleteLeader,
} from '../../services/units';
import {
  getCalendarSettings,
  saveCalendarSettings,
  addSpecialSunday,
  removeSpecialSunday,
} from '../../services/calendar';
import { formatDateBR } from '../../utils/speakerHelpers';

export default function AdminUnitsPage() {
  const { unitId, unit, reload } = useUnit();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [type, setType] = useState('Ramo');
  const [stake, setStake] = useState('');
  const [savingUnit, setSavingUnit] = useState(false);

  const [leaders, setLeaders] = useState([]);
  const [leadersLoading, setLeadersLoading] = useState(false);
  const [newLeaderName, setNewLeaderName] = useState('');
  const [newLeaderCalling, setNewLeaderCalling] = useState('');
  const [newLeaderPhone, setNewLeaderPhone] = useState('');

  const [calendarSettings, setCalendarSettings] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [newSpecialDate, setNewSpecialDate] = useState('');
  const [newSpecialType, setNewSpecialType] = useState('stake_conference');
  const [newSpecialTitle, setNewSpecialTitle] = useState('Conferência de Estaca');
  const [newSpecialNotes, setNewSpecialNotes] = useState('');
  const [savingCalendar, setSavingCalendar] = useState(false);

  useEffect(() => {
    setName(unit?.name || '');
    setType(unit?.type || 'Ramo');
    setStake(unit?.stake || '');
  }, [unit]);

  async function reloadLeaders() {
    if (!unitId) return;
    setLeadersLoading(true);
    try {
      setLeaders(await getLeaders(unitId));
    } finally {
      setLeadersLoading(false);
    }
  }

  async function reloadCalendar() {
    if (!unitId) return;
    setCalendarLoading(true);
    try {
      setCalendarSettings(await getCalendarSettings(unitId));
    } finally {
      setCalendarLoading(false);
    }
  }

  useEffect(() => {
    reloadLeaders();
    reloadCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId]);

  async function saveUnit(e) {
    e.preventDefault();
    if (!unitId) return;
    setSavingUnit(true);
    try {
      await updateUnit(unitId, { name, type, stake });
      showToast('Unidade atualizada.');
      await reload();
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar unidade.');
    } finally {
      setSavingUnit(false);
    }
  }

  async function addLeaderHandler(e) {
    e.preventDefault();
    if (!unitId || !newLeaderName.trim()) return;
    try {
      await addLeader(unitId, {
        name: newLeaderName.trim(),
        calling: newLeaderCalling.trim(),
        phone: newLeaderPhone.trim(),
        order: leaders.length,
      });
      setNewLeaderName('');
      setNewLeaderCalling('');
      setNewLeaderPhone('');
      await reloadLeaders();
      await reload();
      showToast('Líder adicionado.');
    } catch (err) {
      console.error(err);
      showToast('Erro ao adicionar líder.');
    }
  }

  async function saveLeader(leader, patch) {
    try {
      await updateLeader(unitId, leader.id, patch);
      await reloadLeaders();
      await reload();
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar líder.');
    }
  }

  async function removeLeader(leader) {
    if (!confirm(`Remover líder "${leader.name}"?`)) return;
    try {
      await deleteLeader(unitId, leader.id);
      await reloadLeaders();
      await reload();
      showToast('Líder removido.');
    } catch (err) {
      console.error(err);
      showToast('Erro ao remover líder.');
    }
  }

  async function handleToggleAutoGC(e) {
    const val = e.target.checked;
    if (!unitId) return;
    setSavingCalendar(true);
    try {
      const updated = {
        ...(calendarSettings || {}),
        autoGeneralConference: val,
      };
      await saveCalendarSettings(unitId, updated);
      setCalendarSettings(updated);
      showToast(val ? 'Conferência Geral automática ativada.' : 'Conferência Geral automática desativada.');
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar configuração de calendário.');
    } finally {
      setSavingCalendar(false);
    }
  }

  function handleSpecialTypeChange(val) {
    setNewSpecialType(val);
    if (val === 'stake_conference') {
      setNewSpecialTitle('Conferência de Estaca');
    } else if (val === 'general_conference') {
      setNewSpecialTitle('Conferência Geral');
    } else {
      setNewSpecialTitle('');
    }
  }

  async function handleAddSpecialSunday(e) {
    e.preventDefault();
    if (!unitId || !newSpecialDate) return;
    setSavingCalendar(true);
    try {
      await addSpecialSunday(unitId, {
        date: newSpecialDate,
        type: newSpecialType,
        title: newSpecialTitle.trim() || (newSpecialType === 'stake_conference' ? 'Conferência de Estaca' : 'Sem Reunião'),
        notes: newSpecialNotes.trim(),
      });
      await reloadCalendar();
      setNewSpecialDate('');
      setNewSpecialNotes('');
      setNewSpecialType('stake_conference');
      setNewSpecialTitle('Conferência de Estaca');
      showToast('Data especial adicionada.');
    } catch (err) {
      console.error(err);
      showToast('Erro ao adicionar data especial.');
    } finally {
      setSavingCalendar(false);
    }
  }

  async function handleRemoveSpecialSunday(date) {
    if (!unitId) return;
    setSavingCalendar(true);
    try {
      await removeSpecialSunday(unitId, date);
      await reloadCalendar();
      showToast('Data especial removida.');
    } catch (err) {
      console.error(err);
      showToast('Erro ao remover data especial.');
    } finally {
      setSavingCalendar(false);
    }
  }

  return (
    <AdminLayout>
      <div className="card">
        <div className="card-header">
          <div className="card-header-left"><h2>Dados da Unidade</h2></div>
        </div>
        <div className="card-body">
          <form onSubmit={saveUnit}>
            <div className="field-row">
              <div className="field">
                <label>Nome da Unidade</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Imperatriz"
                  required
                />
              </div>
              <div className="field">
                <label>Tipo</label>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="Ramo">Ramo</option>
                  <option value="Ala">Ala</option>
                </select>
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Estaca/Distrito (opcional)</label>
                <input
                  type="text"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  placeholder="Ex: Estaca Palhoça"
                />
              </div>
              <div className="field">
                <label>Unit ID</label>
                <input type="text" value={unitId || ''} readOnly disabled />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn btn-primary" disabled={savingUnit} type="submit">
                {savingUnit ? 'Salvando...' : 'Salvar Unidade'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-header">
          <div className="card-header-left"><h2>Líderes</h2></div>
        </div>
        <div className="card-body">
          <p style={{ color: '#6b7280', marginTop: 0 }}>
            Estes nomes aparecem nos selects &quot;Presidida por&quot; e &quot;Dirigida por&quot; do formulário.
          </p>

          <form onSubmit={addLeaderHandler} className="field-row" style={{ alignItems: 'end' }}>
            <div className="field">
              <label>Nome completo</label>
              <input
                type="text"
                value={newLeaderName}
                onChange={(e) => setNewLeaderName(e.target.value)}
                placeholder="Ex: Leônidas Yopán"
              />
            </div>
            <div className="field">
              <label>Chamado (opcional)</label>
              <input
                type="text"
                value={newLeaderCalling}
                onChange={(e) => setNewLeaderCalling(e.target.value)}
                placeholder="Ex: Presidente do Ramo"
              />
            </div>
            <div className="field">
              <label>WhatsApp (opcional)</label>
              <input
                type="text"
                value={newLeaderPhone}
                onChange={(e) => setNewLeaderPhone(e.target.value)}
                placeholder="Ex: (99) 99999-9999"
              />
            </div>
            <div className="field">
              <button className="btn btn-primary" type="submit">+ Adicionar</button>
            </div>
          </form>

          {leadersLoading && <p>Carregando...</p>}
          {!leadersLoading && leaders.length === 0 && (
            <p style={{ color: '#6b7280' }}>Nenhum líder cadastrado.</p>
          )}
          {!leadersLoading && leaders.length > 0 && (
            <table className="dyn-table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Chamado</th>
                  <th>WhatsApp</th>
                  <th style={{ width: '8%' }}>Ordem</th>
                  <th style={{ width: '8%' }} />
                </tr>
              </thead>
              <tbody>
                {leaders.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <input
                        type="text"
                        defaultValue={l.name}
                        onBlur={(e) =>
                          e.target.value !== l.name &&
                          saveLeader(l, { name: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        defaultValue={l.calling || ''}
                        onBlur={(e) =>
                          e.target.value !== (l.calling || '') &&
                          saveLeader(l, { calling: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        defaultValue={l.phone || ''}
                        onBlur={(e) =>
                          e.target.value !== (l.phone || '') &&
                          saveLeader(l, { phone: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        defaultValue={l.order ?? 0}
                        onBlur={(e) =>
                          Number(e.target.value) !== (l.order ?? 0) &&
                          saveLeader(l, { order: Number(e.target.value) })
                        }
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => removeLeader(l)}
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Domingos Especiais & Calendário */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-header">
          <div className="card-header-left"><h2>Domingos Especiais & Calendário</h2></div>
        </div>
        <div className="card-body">
          <p style={{ color: '#6b7280', marginTop: 0 }}>
            Configure os domingos em que a unidade não realiza Reunião Sacramental própria (ex: Conferência Geral e Conferências de Estaca). Nessas datas, o sistema não exige rascunhos nem alerta sobre falta de convites.
          </p>

          <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={calendarSettings?.autoGeneralConference !== false}
                onChange={handleToggleAutoGC}
                disabled={savingCalendar}
                style={{ marginTop: 3, accentColor: '#7c3aed', width: 16, height: 16 }}
              />
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#4c1d95', display: 'block' }}>
                  Conferência Geral Automática (1º domingo de abril e 1º domingo de outubro)
                </span>
                <span style={{ fontSize: '0.78rem', color: '#6d28d9', display: 'block', marginTop: 2 }}>
                  Quando ativado, o sistema reconhece automaticamente essas datas fixas como sem reunião sacramental na unidade.
                </span>
              </div>
            </label>
          </div>

          <form onSubmit={handleAddSpecialSunday} className="field-row" style={{ alignItems: 'end' }}>
            <div className="field">
              <label>Data (Domingo)</label>
              <input
                type="date"
                value={newSpecialDate}
                onChange={(e) => setNewSpecialDate(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Tipo</label>
              <select
                value={newSpecialType}
                onChange={(e) => handleSpecialTypeChange(e.target.value)}
              >
                <option value="stake_conference">Conferência de Estaca</option>
                <option value="general_conference">Conferência Geral</option>
                <option value="other">Outro Evento</option>
              </select>
            </div>
            <div className="field">
              <label>Título / Rótulo</label>
              <input
                type="text"
                value={newSpecialTitle}
                onChange={(e) => setNewSpecialTitle(e.target.value)}
                placeholder="Ex: Conferência de Estaca"
                required
              />
            </div>
            <div className="field">
              <label>Observações (opcional)</label>
              <input
                type="text"
                value={newSpecialNotes}
                onChange={(e) => setNewSpecialNotes(e.target.value)}
                placeholder="Ex: 10h na sede da estaca"
              />
            </div>
            <div className="field">
              <button className="btn btn-primary" type="submit" disabled={savingCalendar || !newSpecialDate}>
                {savingCalendar ? 'Salvando...' : '+ Adicionar Data'}
              </button>
            </div>
          </form>

          {calendarLoading && <p>Carregando calendário...</p>}
          {!calendarLoading && (!calendarSettings?.specialSundays || calendarSettings.specialSundays.length === 0) && (
            <p style={{ color: '#6b7280', marginTop: 12 }}>Nenhuma data de Conferência de Estaca ou data especial cadastrada.</p>
          )}
          {!calendarLoading && calendarSettings?.specialSundays && calendarSettings.specialSundays.length > 0 && (
            <table className="dyn-table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Título</th>
                  <th>Observações</th>
                  <th style={{ width: '8%' }} />
                </tr>
              </thead>
              <tbody>
                {calendarSettings.specialSundays.map((s) => (
                  <tr key={s.date}>
                    <td style={{ fontWeight: 600 }}>{formatDateBR(s.date)}</td>
                    <td>
                      <span className="dash-badge dash-badge-special">
                        {s.type === 'stake_conference' ? 'Conferência de Estaca' : s.type === 'general_conference' ? 'Conferência Geral' : 'Outro'}
                      </span>
                    </td>
                    <td>{s.title}</td>
                    <td style={{ color: '#64748b' }}>{s.notes || '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleRemoveSpecialSunday(s.date)}
                        disabled={savingCalendar}
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
