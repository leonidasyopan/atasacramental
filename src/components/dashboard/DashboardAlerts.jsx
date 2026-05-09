import { Link } from 'react-router-dom';
import { daysUntil, formatDateBR } from '../../utils/speakerHelpers';

const PENDING_INVITE_THRESHOLD_DAYS = 7;

/**
 * Build the alert list from the dashboard's data.
 *  - red:    upcoming Sundays (≤7 days) with 0 invites
 *  - yellow: invites pending for > N days
 *  - blue:   past Sundays with unfinalized drafts
 *  - blue:   drafts with mode='test' that have invites for that date
 */
function buildAlerts({ upcomingDates, drafts, invites }) {
  const alerts = [];
  const today = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  const draftByDate = new Map(drafts.map((d) => [d.data, d]));
  const invitesByDate = invites.reduce((acc, inv) => {
    if (!inv.dataAlvo) return acc;
    if (!acc.has(inv.dataAlvo)) acc.set(inv.dataAlvo, []);
    acc.get(inv.dataAlvo).push(inv);
    return acc;
  }, new Map());

  // Red: imminent Sundays (≤7 days) with 0 invites
  for (const date of upcomingDates) {
    const days = daysUntil(date);
    if (days == null || days > 7) continue;
    const dateInvites = invitesByDate.get(date) || [];
    if (dateInvites.length === 0) {
      alerts.push({
        kind: 'red',
        icon: '⚠️',
        text: `${formatDateBR(date)} é em ${days === 0 ? 'hoje' : days === 1 ? 'amanhã' : `${days} dias`} e ainda não tem convites.`,
        linkTo: `/programa/${date}`,
        linkText: 'Abrir programa',
      });
    }
  }

  // Yellow: invites pending for > N days
  const longPending = invites.filter((inv) => {
    if (inv.status !== 'pendente') return false;
    const updated = inv.updatedAt?.toDate?.() || inv.createdAt?.toDate?.() || null;
    if (!updated) return false;
    const ageDays = Math.round((today.getTime() - updated.getTime()) / (24 * 60 * 60 * 1000));
    return ageDays >= PENDING_INVITE_THRESHOLD_DAYS;
  });
  if (longPending.length > 0) {
    alerts.push({
      kind: 'yellow',
      icon: '⏳',
      text: `${longPending.length} convite${longPending.length === 1 ? '' : 's'} pendente${longPending.length === 1 ? '' : 's'} há mais de ${PENDING_INVITE_THRESHOLD_DAYS} dias.`,
      linkTo: '/discursantes',
      linkText: 'Ver convites',
    });
  }

  // Blue: past Sundays with unfinalized drafts
  for (const draft of drafts) {
    if (!draft.data) continue;
    const days = daysUntil(draft.data);
    if (days != null && days < 0) {
      alerts.push({
        kind: 'blue',
        icon: '📋',
        text: `Rascunho de ${formatDateBR(draft.data)} ainda não foi finalizado.`,
        linkTo: `/programa/${draft.data}`,
        linkText: 'Abrir',
      });
    }
  }

  // Blue: mode='test' draft with invites for that date
  for (const [date, dateInvites] of invitesByDate.entries()) {
    const draft = draftByDate.get(date);
    if (draft && draft.mode === 'test' && dateInvites.length > 0) {
      alerts.push({
        kind: 'yellow',
        icon: '⚡',
        text: `Convite${dateInvites.length === 1 ? '' : 's'} criado${dateInvites.length === 1 ? '' : 's'} para ${formatDateBR(date)}, mas a ata está marcada como Jejum e Testemunhos.`,
        linkTo: `/programa/${date}`,
        linkText: 'Revisar',
      });
    }
  }

  return alerts;
}

export default function DashboardAlerts({ upcomingDates, drafts, invites }) {
  const alerts = buildAlerts({ upcomingDates, drafts, invites });
  if (alerts.length === 0) return null;

  return (
    <div className="dashboard-section">
      <div className="dashboard-section-header">
        <h3 className="dashboard-section-title">Alertas</h3>
      </div>
      <div className="dashboard-alerts">
        {alerts.map((a, i) => (
          <div key={i} className={`dashboard-alert dashboard-alert-${a.kind}`}>
            <span className="dashboard-alert-icon" aria-hidden>{a.icon}</span>
            <div style={{ flex: 1 }}>
              {a.text}{' '}
              {a.linkTo && (
                <Link to={a.linkTo} className="dashboard-alert-link">
                  {a.linkText}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
