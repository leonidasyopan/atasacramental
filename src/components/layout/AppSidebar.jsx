import { useCallback, useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useUnit } from '../../hooks/useUnit';
import { signOutUser } from '../../services/auth';

/**
 * Persistent right sidebar on desktop (>= 900px); hamburger-triggered drawer
 * overlay on mobile. Lists navigation links scoped to the user's role plus
 * a condensed user card with sign-out.
 */
export default function AppSidebar() {
  const { firebaseUser, isSuperAdmin, userRole } = useAuth();
  const { unit } = useUnit();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isCounterOnly = !isSuperAdmin && userRole === 'counter';

  const close = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    // Close drawer whenever the route changes.
    close();
  }, [location.pathname, location.search, close]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('sidebar-drawer-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('sidebar-drawer-open');
    };
  }, [drawerOpen, close]);

  const unitLabel = unit?.name || 'Unidade';
  const stakeLabel = unit?.stake || unit?.estaca || '';
  const displayName =
    firebaseUser?.displayName || firebaseUser?.email || '';

  return (
    <>
      <button
        type="button"
        className="app-sidebar-hamburger"
        aria-label={drawerOpen ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={drawerOpen}
        aria-controls="app-sidebar"
        onClick={() => setDrawerOpen((v) => !v)}
      >
        <span className="app-sidebar-hamburger-bar" />
        <span className="app-sidebar-hamburger-bar" />
        <span className="app-sidebar-hamburger-bar" />
      </button>

      {drawerOpen && (
        <div
          className="app-sidebar-overlay"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        id="app-sidebar"
        className="app-sidebar"
        data-open={drawerOpen ? 'true' : 'false'}
        aria-label="Navegação principal"
      >
        <div className="app-sidebar-header">
          <div className="app-sidebar-unit">
            <strong>{unitLabel}</strong>
            {stakeLabel && <small>{stakeLabel}</small>}
          </div>
        </div>

        <nav className="app-sidebar-nav">
          {!isCounterOnly && (
            <>
              <NavLink to="/" end onClick={close}>
                Ata
              </NavLink>
              <NavLink to="/historico" onClick={close}>
                Histórico de atas
              </NavLink>
              <NavLink to="/frequencia/detalhado" onClick={close}>
                Frequência detalhada
              </NavLink>
            </>
          )}
          <NavLink to="/frequencia/simples" onClick={close}>
            Contagem simples
          </NavLink>
          {!isCounterOnly && (
            <NavLink to="/frequencia/historico" onClick={close}>
              Histórico de frequência
            </NavLink>
          )}
          {isSuperAdmin && (
            <NavLink to="/admin/allowed-users" onClick={close}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="app-sidebar-footer">
          <div className="app-sidebar-user">
            <span
              className="app-sidebar-user-name"
              title={firebaseUser?.email || ''}
            >
              {displayName}
            </span>
            <button
              type="button"
              className="app-sidebar-signout"
              onClick={() => signOutUser()}
            >
              Sair
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
