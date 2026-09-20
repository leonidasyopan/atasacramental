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
              <NavLink
                to="/admin/allowed-users"
                className={({ isActive }) => `btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              >
                Acessos (allowedUsers)
              </NavLink>
            )}
            <NavLink
              to="/admin/unit"
              className={({ isActive }) => `btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
            >
              Unidade & Líderes
            </NavLink>
            <NavLink
              to="/admin/members"
              className={({ isActive }) => `btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
            >
              👥 Membros & Importação LCR
            </NavLink>
            {isSuperAdmin && (
              <NavLink
                to="/admin/users"
                className={({ isActive }) => `btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              >
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
