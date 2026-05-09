import { NavLink, Outlet } from 'react-router-dom';
import AppHeader from '../../components/layout/AppHeader';
import { useAuth } from '../../hooks/useAuth';

export default function AdminLayout({ children }) {
  const { isSuperAdmin } = useAuth();

  return (
    <>
      <AppHeader />
      <div className="app-content">
        <div className="form-wrap">
          <nav style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            {isSuperAdmin && (
              <NavLink to="/admin/allowed-users" className="btn btn-ghost btn-sm">
                Acessos (allowedUsers)
              </NavLink>
            )}
            <NavLink to="/admin/unit" className="btn btn-ghost btn-sm">
              Unidade & Líderes
            </NavLink>
            <NavLink to="/admin/members" className="btn btn-ghost btn-sm">
              Membros
            </NavLink>
            {isSuperAdmin && (
              <NavLink to="/admin/users" className="btn btn-ghost btn-sm">
                Usuários logados
              </NavLink>
            )}
          </nav>
          {children ?? <Outlet />}
        </div>
      </div>
    </>
  );
}
