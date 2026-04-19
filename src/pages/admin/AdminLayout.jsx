import { NavLink, Outlet } from 'react-router-dom';
import AppHeader from '../../components/layout/AppHeader';

export default function AdminLayout({ children }) {
  return (
    <>
      <AppHeader />
      <div className="app-content">
        <div className="form-wrap">
          <nav style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            <NavLink to="/admin/allowed-users" className="btn btn-ghost btn-sm">
              Acessos (allowedUsers)
            </NavLink>
            <NavLink to="/admin/unit" className="btn btn-ghost btn-sm">
              Unidade & Líderes
            </NavLink>
            <NavLink to="/admin/members" className="btn btn-ghost btn-sm">
              Membros
            </NavLink>
            <NavLink to="/admin/users" className="btn btn-ghost btn-sm">
              Usuários logados
            </NavLink>
          </nav>
          {children ?? <Outlet />}
        </div>
      </div>
    </>
  );
}
