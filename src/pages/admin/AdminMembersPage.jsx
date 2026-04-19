import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { useUnit } from '../../hooks/useUnit';
import { useToast } from '../../contexts/ToastContext';
import {
  getMembers,
  addMember,
  updateMember,
  deactivateMember,
  activateMember,
} from '../../services/members';

export default function AdminMembersPage() {
  const { unitId } = useUnit();
  const { showToast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);

  async function reload() {
    if (!unitId) return;
    setLoading(true);
    try {
      setList(await getMembers(unitId, { includeInactive }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId, includeInactive]);

  async function onAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await addMember(unitId, name.trim());
      setName('');
      await reload();
      showToast('Membro adicionado.');
    } catch (err) {
      console.error(err);
      showToast('Erro ao adicionar membro.');
    }
  }

  async function onRename(m, newName) {
    if (!newName || newName === m.name) return;
    try {
      await updateMember(unitId, m.id, { name: newName });
      await reload();
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar.');
    }
  }

  async function onToggleActive(m) {
    try {
      if (m.active === false) await activateMember(unitId, m.id);
      else await deactivateMember(unitId, m.id);
      await reload();
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar.');
    }
  }

  return (
    <AdminLayout>
      <div className="card">
        <div className="card-header">
          <div className="card-header-left"><h2>Membros da Unidade</h2></div>
        </div>
        <div className="card-body">
          <form onSubmit={onAdd} className="field-row" style={{ alignItems: 'end' }}>
            <div className="field">
              <label>Adicionar membro</label>
              <input
                type="text"
                placeholder="Nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="field">
              <button className="btn btn-primary" type="submit">+ Adicionar</button>
            </div>
            <div className="field">
              <label>
                <input
                  type="checkbox"
                  checked={includeInactive}
                  onChange={(e) => setIncludeInactive(e.target.checked)}
                />{' '}
                Mostrar inativos
              </label>
            </div>
          </form>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-body">
          {loading && <p>Carregando...</p>}
          {!loading && list.length === 0 && (
            <p style={{ color: '#6b7280' }}>
              Nenhum membro cadastrado ainda. Uma funcionalidade de importação em massa
              está planejada para um próximo release.
            </p>
          )}
          {!loading && list.length > 0 && (
            <table className="dyn-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th style={{ width: '15%' }}>Status</th>
                  <th style={{ width: '15%' }} />
                </tr>
              </thead>
              <tbody>
                {list.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <input
                        type="text"
                        defaultValue={m.name}
                        onBlur={(e) => onRename(m, e.target.value.trim())}
                      />
                    </td>
                    <td>{m.active === false ? 'Inativo' : 'Ativo'}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => onToggleActive(m)}
                      >
                        {m.active === false ? 'Ativar' : 'Desativar'}
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
