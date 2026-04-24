import { Link } from 'react-router-dom';

/**
 * Shows the sibling attendance total (simple vs. detailed) for the same date,
 * keeping the two flows visibly connected. When the current user is allowed
 * to edit the other mode, renders a link to jump there (preserving the date
 * via `?date=YYYY-MM-DD`).
 */
export default function OtherCountCard({
  currentMode,
  otherValue,
  date,
  canOpenOther = true,
}) {
  const isDetailed = currentMode === 'detailed';
  const otherLabel = isDetailed ? 'Contagem simples' : 'Contagem detalhada';
  const otherPath = isDetailed ? '/frequencia/simples' : '/frequencia/detalhado';
  const otherActionLabel = isDetailed
    ? 'Abrir contagem simples'
    : 'Abrir contagem detalhada';
  const registerLabel = isDetailed
    ? 'Registrar contagem simples'
    : 'Registrar contagem detalhada';

  const hasValue = Number.isFinite(Number(otherValue));
  const url = date
    ? `${otherPath}?date=${encodeURIComponent(date)}`
    : otherPath;

  if (!canOpenOther) {
    if (!hasValue) return null;
    return (
      <div className="attendance-other-card" data-empty="false">
        <div className="attendance-other-label">{otherLabel}</div>
        <div className="attendance-other-value">{otherValue}</div>
      </div>
    );
  }

  return (
    <div
      className="attendance-other-card"
      data-empty={hasValue ? 'false' : 'true'}
    >
      <div className="attendance-other-label">{otherLabel}</div>
      <div className="attendance-other-value">
        {hasValue ? otherValue : '—'}
      </div>
      <Link to={url} className="attendance-other-link">
        {hasValue ? otherActionLabel : registerLabel}
      </Link>
    </div>
  );
}
