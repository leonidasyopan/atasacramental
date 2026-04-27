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

  useEffect(() => {
    reloadLeaders();
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
    </AdminLayout>
  );
}
