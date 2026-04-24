import { useAuth } from '../../hooks/useAuth';
import { useUnit } from '../../hooks/useUnit';

/**
 * Compact top bar with the app title and the unit/stake subtitle. Navigation
 * links and the user menu now live in the sidebar (`AppSidebar`), and
 * page-specific actions render within each page itself (e.g. the kebab menu
 * on `AtaFormPage`).
 */
export default function AppHeader() {
  const { firebaseUser } = useAuth();
  const { unit } = useUnit();

  const unitLabel = unit?.name || 'Unidade';
  const stakeLabel = unit?.stake || unit?.estaca || '';
  const subtitle = stakeLabel ? `${unitLabel} · ${stakeLabel}` : unitLabel;

  // Expose the user's email to assistive tech via the aria label only.
  const userEmail = firebaseUser?.email || '';

  return (
    <header className="app-header" aria-label={userEmail}>
      <div className="app-header-brand">
        <h1>Ata da Reunião Sacramental</h1>
        <small>{subtitle}</small>
      </div>
    </header>
  );
}
