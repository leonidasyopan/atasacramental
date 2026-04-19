import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { getAllUsers } from '../../services/users';

function formatTs(ts) {
  if (!ts) return '';
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString('pt-BR');
  } catch {
    return '';
  }
}

export default function AdminAllUsersPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setList(await getAllUsers());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AdminLayout>
      <div className="card">
        <div className="card-header">
          <div className="card-header-left"><h2>Usuários autenticados</h2></div>
        </div>
        <div className="card-body">
          {loading && <p>Carregando...</p>}
          {!loading && list.length === 0 && <p>Nenhum usuário registrado ainda.</p>}
          {!loading && list.length > 0 && (
            <table className="dyn-table">
              <thead>
                <tr>
                  <th>E-mail</th>
                  <th>Nome</th>
                  <th>Unit ID</th>
                  <th>Role</th>
                  <th>Último login</th>
                </tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.displayName || ''}</td>
                    <td>{u.unitId}</td>
                    <td>{u.role}</td>
                    <td>{formatTs(u.updatedAt || u.createdAt)}</td>
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
