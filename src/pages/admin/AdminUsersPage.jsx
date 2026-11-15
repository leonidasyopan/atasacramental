import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import {
  getAllAllowedUsers,
  addAllowedUser,
  removeAllowedUser,
} from '../../services/users';

const ROLES = ['user', 'counter', 'music', 'admin', 'superadmin'];

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [unitId, setUnitId] = useState('2322846');
  const [role, setRole] = useState('user');
  const [busy, setBusy] = useState(false);

  const [editingEmail, setEditingEmail] = useState(null);
  const [editUnitId, setEditUnitId] = useState('');
  const [editRole, setEditRole] = useState('user');
  const [userToRemove, setUserToRemove] = useState(null);

  const currentUserEmail = (user?.email || '').trim().toLowerCase();

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

  function startEdit(u) {
    setEditingEmail(u.id);
    setEditUnitId(u.unitId || '');
    setEditRole(u.role || 'user');
  }

  function cancelEdit() {
    setEditingEmail(null);
    setEditUnitId('');
    setEditRole('user');
  }

  async function handleSaveEdit(targetEmail) {
    if (!editUnitId.trim()) return;
    setBusy(true);
    try {
      await addAllowedUser(targetEmail, editUnitId.trim(), editRole);
      showToast('Acesso atualizado.');
      cancelEdit();
      await reload();
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar.');
    } finally {
      setBusy(false);
    }
  }

  function requestRemove(targetEmail) {
    if (targetEmail.trim().toLowerCase() === currentUserEmail) {
      showToast('Você não pode remover seu próprio acesso.');
      return;
    }
    setUserToRemove(targetEmail);
  }

  async function confirmRemove() {
    if (!userToRemove) return;
    setBusy(true);
    try {
      await removeAllowedUser(userToRemove);
      showToast('Acesso removido.');
      setUserToRemove(null);
      await reload();
    } catch (err) {
      console.error(err);
      showToast('Erro ao remover.');
    } finally {
      setBusy(false);
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
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
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
                  <th style={{ width: '22%' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {list.map((u) => {
                  const rowEmail = (u.email || u.id || '').trim().toLowerCase();
                  const isSelf = rowEmail === currentUserEmail;
                  const isEditing = editingEmail === u.id;

                  return (
                    <tr key={u.id}>
                      <td>
                        {u.email || u.id}
                        {isSelf && (
                          <span style={{ marginLeft: 8, fontSize: '0.75rem', opacity: 0.7 }}>
                            (Você)
                          </span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            aria-label={`Unit ID de ${u.email || u.id}`}
                            value={editUnitId}
                            onChange={(ev) => setEditUnitId(ev.target.value)}
                            style={{ width: '100%', minWidth: 90 }}
                          />
                        ) : (
                          u.unitId
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            aria-label={`Role de ${u.email || u.id}`}
                            value={editRole}
                            onChange={(ev) => setEditRole(ev.target.value)}
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        ) : (
                          u.role
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => handleSaveEdit(u.id)}
                                disabled={busy}
                              >
                                Salvar
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost-dark btn-sm"
                                onClick={cancelEdit}
                                disabled={busy}
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="btn btn-ghost-dark btn-sm"
                                onClick={() => startEdit(u)}
                                disabled={busy}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost-dark btn-sm"
                                onClick={() => requestRemove(u.id)}
                                disabled={busy || isSelf}
                                title={isSelf ? 'Você não pode remover seu próprio acesso' : `Remover acesso de ${u.email || u.id}`}
                              >
                                Remover
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(userToRemove)}
        title="Remover acesso"
        message={`Tem certeza que deseja remover o acesso de ${userToRemove}?`}
        confirmText="Remover"
        cancelText="Cancelar"
        onConfirm={confirmRemove}
        onCancel={() => setUserToRemove(null)}
      />
    </AdminLayout>
  );
}
