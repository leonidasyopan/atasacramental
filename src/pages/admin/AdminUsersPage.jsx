import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { useToast } from '../../contexts/ToastContext';
import {
  getAllAllowedUsers,
  addAllowedUser,
  removeAllowedUser,
} from '../../services/users';

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [unitId, setUnitId] = useState('2322846');
  const [role, setRole] = useState('user');
  const [busy, setBusy] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      setList(await getAllAllowedUsers());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!email || !unitId) return;
    setBusy(true);
    try {
      await addAllowedUser(email.trim().toLowerCase(), unitId.trim(), role);
      showToast('Acesso adicionado.');
      setEmail('');
      await reload();
    } catch (err) {
      console.error(err);
      showToast('Erro ao adicionar.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(e) {
    if (!confirm(`Remover acesso de ${e}?`)) return;
    try {
      await removeAllowedUser(e);
      showToast('Acesso removido.');
      await reload();
    } catch (err) {
      console.error(err);
      showToast('Erro ao remover.');
    }
  }

  return (
    <AdminLayout>
      <div className="card">
        <div className="card-header">
          <div className="card-header-left"><h2>Controle de Acesso</h2></div>
        </div>
        <div className="card-body">
          <form onSubmit={handleAdd} className="field-row" style={{ alignItems: 'end' }}>
            <div className="field">
              <label>E-mail</label>
              <input
                type="email"
                placeholder="usuario@exemplo.com"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Unit ID</label>
              <input
                type="text"
                value={unitId}
                onChange={(ev) => setUnitId(ev.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Role</label>
              <select value={role} onChange={(ev) => setRole(ev.target.value)}>
                <option value="user">user</option>
                <option value="admin">admin</option>
                <option value="superadmin">superadmin</option>
              </select>
            </div>
            <div className="field">
              <button className="btn btn-primary" type="submit" disabled={busy}>
                {busy ? 'Salvando...' : 'Adicionar'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-header">
          <div className="card-header-left"><h2>Emails Autorizados</h2></div>
        </div>
        <div className="card-body">
          {loading && <p>Carregando...</p>}
          {!loading && list.length === 0 && <p>Nenhum acesso cadastrado.</p>}
          {!loading && list.length > 0 && (
            <table className="dyn-table">
              <thead>
                <tr>
                  <th>E-mail</th>
                  <th>Unit ID</th>
                  <th>Role</th>
                  <th style={{ width: '10%' }} />
                </tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email || u.id}</td>
                    <td>{u.unitId}</td>
                    <td>{u.role}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleRemove(u.id)}
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
