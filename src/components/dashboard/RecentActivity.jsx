import { Link } from 'react-router-dom';
import { formatDateBR } from '../../utils/speakerHelpers';

export default function RecentActivity({ atas }) {
  if (!atas || atas.length === 0) return null;
  return (
    <div className="dashboard-section">
      <div className="dashboard-section-header">
        <h3 className="dashboard-section-title">Atividade Recente</h3>
        <Link to="/historico" className="btn btn-ghost-dark btn-sm">
          Ver histórico
        </Link>
      </div>
      <div className="recent-list">
        {atas.map((a) => {
          const pres = a.presidida === '__outro__' ? a.presididaOutro : a.presidida;
          return (
            <Link key={a.id} to={`/historico/${a.id}/editar`} className="recent-item">
              <div className="recent-item-date">{formatDateBR(a.data)}</div>
              <div className="recent-item-meta">
                {pres ? `Presidida por ${pres}` : 'Ata finalizada'}
                {a.frequencia ? ` · ${a.frequencia} presentes` : ''}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
