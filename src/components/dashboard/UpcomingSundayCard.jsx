import { Link } from 'react-router-dom';
import { daysUntil } from '../../utils/speakerHelpers';

const MONTHS_PT = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function formatLong(dateISO) {
  if (!dateISO) return '';
  const [y, m, d] = dateISO.split('-').map(Number);
  if (!y) return dateISO;
  return `Domingo, ${d} de ${MONTHS_PT[m - 1]}`;
}

function formatRelative(days) {
  if (days == null) return '';
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Amanhã';
  if (days < 0) return `Há ${-days} dia${days === -1 ? '' : 's'}`;
  if (days < 14) return `Em ${days} dias`;
  const weeks = Math.round(days / 7);
  return `Em ${weeks} semanas`;
}

/**
 * Compute the visual status for an upcoming Sunday card.
 *
 * Color rules (mode='disc' or unset):
 *  green  — 3 invites, all aceito
 *  yellow — 3 invites, mix of pendente/aceito
 *  orange — 1–2 invites
 *  red    — 0 invites AND daysUntil <= 7
 *  gray   — 0 invites AND daysUntil > 7
 *
 * For mode='test':
 *  green  — draft exists
 *  gray   — no draft
 */
function computeSundayStatus({ draft, invites, days }) {
  const mode = draft?.mode || 'disc';
  if (mode === 'test') {
    return draft ? 'green' : 'gray';
  }
  const total = invites.length;
  const accepted = invites.filter((i) => i.status === 'aceito').length;
  if (total >= 3 && accepted >= 3) return 'green';
  if (total >= 3) return 'yellow';
  if (total >= 1) return 'orange';
  return days != null && days <= 7 ? 'red' : 'gray';
}

export default function UpcomingSundayCard({ date, draft, invites }) {
  const days = daysUntil(date);
  const status = computeSundayStatus({ draft, invites, days });
  const total = invites.length;
  const accepted = invites.filter((i) => i.status === 'aceito').length;
  const isTest = (draft?.mode || 'disc') === 'test';

  return (
    <Link to={`/programa/${date}`} className="sunday-card" aria-label={`Programa de ${formatLong(date)}`}>
      <div className={`sunday-card-stripe stripe-${status}`} />
      <div className="sunday-card-body">
        <div>
          <div className="sunday-card-date">{formatLong(date)}</div>
          <div className="sunday-card-relative">{formatRelative(days)}</div>
        </div>
        <div className="sunday-card-badges">
          {isTest ? (
            <span className="dash-badge dash-badge-info">Jejum e Testemunhos</span>
          ) : total === 0 ? (
            <span className={`dash-badge ${status === 'red' ? 'dash-badge-alert' : ''}`}>
              Sem convites
            </span>
          ) : (
            <>
              <span className={`dash-badge ${accepted === total && total >= 3 ? 'dash-badge-success' : 'dash-badge-warn'}`}>
                {total}/3 convidados · {accepted} confirmado{accepted === 1 ? '' : 's'}
              </span>
            </>
          )}
          {draft ? (
            <span className="dash-badge dash-badge-info">Rascunho iniciado</span>
          ) : (
            <span className="dash-badge">Sem rascunho</span>
          )}
        </div>
      </div>
    </Link>
  );
}
