import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useUnit } from '../../hooks/useUnit';
import { signOutUser } from '../../services/auth';

export default function AppHeader({
  unitType,
  onUnitTypeChange,
  fontSizePt,
  onFontSizeChange,
  onReset,
  onPrint,
}) {
  const { firebaseUser, isSuperAdmin } = useAuth();
  const { unit } = useUnit();

  const unitLabel = unit?.name || 'Unidade';
  const stakeLabel = unit?.stake || unit?.estaca || '';
  const subtitle = stakeLabel ? `${unitLabel} · ${stakeLabel}` : unitLabel;

  return (
    <header className="app-header">
      <div>
        <h1>Ata da Reunião Sacramental</h1>
        <small>{subtitle}</small>
      </div>
      <div className="header-actions">
        <nav className="nav-links" style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <NavLink to="/" end className="btn btn-ghost btn-sm">Ata</NavLink>
          <NavLink to="/historico" className="btn btn-ghost btn-sm">Histórico</NavLink>
          {isSuperAdmin && (
            <NavLink to="/admin/allowed-users" className="btn btn-ghost btn-sm">Admin</NavLink>
          )}
        </nav>

        {onUnitTypeChange && (
          <div className="unit-toggle" title="Tipo de unidade">
            <button
              className={`unit-btn${unitType === 'ramo' ? ' active' : ''}`}
              onClick={() => onUnitTypeChange('ramo')}
              type="button"
            >
              Ramo
            </button>
            <button
              className={`unit-btn${unitType === 'ala' ? ' active' : ''}`}
              onClick={() => onUnitTypeChange('ala')}
              type="button"
            >
              Ala
            </button>
          </div>
        )}

        {onFontSizeChange && (
          <div className="font-size-ctrl" title="Ajustar tamanho da fonte do documento impresso">
            <button
              className="btn btn-ghost"
              onClick={() => onFontSizeChange(-1)}
              title="Diminuir fonte (1pt)"
              type="button"
            >
              A−
            </button>
            <span className="fs-label">{fontSizePt}pt</span>
            <button
              className="btn btn-ghost"
              onClick={() => onFontSizeChange(+1)}
              title="Aumentar fonte (1pt)"
              type="button"
            >
              A+
            </button>
          </div>
        )}

        {onReset && (
          <button className="btn btn-ghost" onClick={onReset} type="button">
            ↺ Limpar
          </button>
        )}
        {onPrint && (
          <button className="btn btn-primary" onClick={onPrint} type="button">
            ⇩ Imprimir / PDF
          </button>
        )}

        <div className="user-info">
          <span className="user-name" title={firebaseUser?.email || ''}>
            {firebaseUser?.displayName || firebaseUser?.email || ''}
          </span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => signOutUser()}
            type="button"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
