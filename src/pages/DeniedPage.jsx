import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function DeniedPage() {
  const { deniedEmail } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-denied-icon">✗</div>
        <h1 className="auth-title">Acesso Negado</h1>
        <p className="auth-subtitle">
          {deniedEmail ? (
            <>
              O e-mail <strong>{deniedEmail}</strong> não está autorizado a acessar este sistema.
            </>
          ) : (
            'Seu e-mail não está autorizado a acessar este sistema.'
          )}
        </p>
        <button className="auth-submit-btn" onClick={() => navigate('/login', { replace: true })}>
          Voltar ao Login
        </button>
      </div>
    </div>
  );
}
