import { formatDateBR } from '../../utils/speakerHelpers';

const STATUS_LABELS = {
  pendente: 'Pendente',
  aceito: 'Aceito',
  recusado: 'Recusado',
  concluido: 'Concluído',
};

const STATUS_ACTIONS = {
  pendente: [
    { label: 'Aceitar', next: 'aceito' },
    { label: 'Recusar', next: 'recusado' },
  ],
  aceito: [
    { label: 'Concluir', next: 'concluido' },
    { label: 'Recusar', next: 'recusado' },
  ],
  recusado: [
    { label: 'Reabrir', next: 'pendente' },
  ],
  concluido: [],
};

const POSITION_LABELS = { '1': '1º Orador', '2': '2º Orador', '3': '3º Orador' };

export default function InviteCard({ invite, onStatusChange, onEdit, onGenerateLetter }) {
  const actions = STATUS_ACTIONS[invite.status] || [];

  return (
    <div className={`invite-card invite-status--${invite.status}`}>
      <div className="invite-card-header">
        <strong>{invite.memberName || 'Sem nome'}</strong>
        {invite.isExternal && <span className="invite-external-badge">Visitante</span>}
        <span className={`invite-status invite-status--${invite.status}`}>
          {STATUS_LABELS[invite.status] || invite.status}
        </span>
      </div>

      <div className="invite-card-body">
        <div className="invite-card-detail">
          <span className="invite-card-label">Data alvo:</span>{' '}
          {formatDateBR(invite.dataAlvo)}
        </div>
        {invite.topic && (
          <div className="invite-card-detail">
            <span className="invite-card-label">Tema:</span> {invite.topic}
          </div>
        )}
        {invite.position && (
          <div className="invite-card-detail">
            <span className="invite-card-label">Posição:</span> {POSITION_LABELS[invite.position] || invite.position}
          </div>
        )}
        {invite.duration && (
          <div className="invite-card-detail">
            <span className="invite-card-label">Tempo:</span> {invite.duration} min
          </div>
        )}
        {invite.notes && (
          <div className="invite-card-detail">
            <span className="invite-card-label">Obs:</span> {invite.notes}
          </div>
        )}
      </div>

      <div className="invite-card-actions">
        {actions.map((a) => (
          <button
            key={a.next}
            type="button"
            className="btn btn-ghost-dark btn-sm"
            onClick={() => onStatusChange(invite.id, a.next)}
          >
            {a.label}
          </button>
        ))}
        {invite.status !== 'concluido' && onEdit && (
          <button
            type="button"
            className="btn btn-ghost-dark btn-sm"
            onClick={() => onEdit(invite)}
          >
            Editar
          </button>
        )}
        {onGenerateLetter && (
          <button
            type="button"
            className="btn btn-ghost-dark btn-sm"
            onClick={() => onGenerateLetter(invite)}
          >
            Gerar Carta
          </button>
        )}
      </div>
    </div>
  );
}
