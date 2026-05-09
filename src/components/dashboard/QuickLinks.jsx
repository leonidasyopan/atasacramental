import { Link } from 'react-router-dom';

const LINKS = [
  { to: '/discursantes', icon: '🎤', label: 'Discursantes' },
  { to: '/frequencia/simples', icon: '👥', label: 'Frequência' },
  { to: '/historico', icon: '📚', label: 'Histórico de atas' },
];

export default function QuickLinks() {
  return (
    <div className="dashboard-section">
      <div className="dashboard-section-header">
        <h3 className="dashboard-section-title">Acesso Rápido</h3>
      </div>
      <div className="quick-links">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="quick-link">
            <span className="quick-link-icon" aria-hidden>{l.icon}</span>
            <span>{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
