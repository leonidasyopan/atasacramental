import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  resetPassword,
  translateAuthError,
} from '../services/auth';

export default function LoginPage() {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authState === 'ok') navigate('/', { replace: true });
    if (authState === 'denied') navigate('/denied', { replace: true });
  }, [authState, navigate]);

  async function handleGoogle() {
    setError('');
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      const msg = translateAuthError(e.code);
      if (msg) setError(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleEmailSubmit(e) {
    e?.preventDefault?.();
    setError('');
    if (!email || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'register') {
        await registerWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      const msg = translateAuthError(err.code);
      if (msg) setError(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleForgot() {
    setError('');
    if (!email) {
      setError('Digite seu e-mail primeiro.');
      return;
    }
    try {
      await resetPassword(email);
      setError('Link de recuperação enviado para o seu e-mail.');
    } catch (err) {
      const msg = translateAuthError(err.code);
      if (msg) setError(msg);
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') handleEmailSubmit(e);
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <svg width="48" height="48" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="6" fill="#1B3A6B" />
            <rect x="8" y="7" width="16" height="18" rx="1.5" fill="#fff" opacity=".92" />
            <rect x="10" y="10" width="10" height="2.5" rx="1" fill="#C9A84C" />
            <rect x="10" y="15" width="12" height="1.8" rx=".5" fill="#1B3A6B" opacity=".35" />
            <rect x="10" y="18.5" width="9" height="1.8" rx=".5" fill="#1B3A6B" opacity=".35" />
          </svg>
        </div>
        <h1 className="auth-title">Ata Sacramental</h1>
        <p className="auth-subtitle">Faça login para acessar o sistema</p>

        <button className="auth-google-btn" onClick={handleGoogle} disabled={busy}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          Entrar com Google
        </button>

        <div className="auth-divider"><span>ou</span></div>

        <div className="auth-mode-toggle">
          <button
            className={`auth-mode-btn${mode === 'login' ? ' active' : ''}`}
            onClick={() => setMode('login')}
            type="button"
          >
            Login
          </button>
          <button
            className={`auth-mode-btn${mode === 'register' ? ' active' : ''}`}
            onClick={() => setMode('register')}
            type="button"
          >
            Cadastrar
          </button>
        </div>

        <form className="auth-form" onSubmit={handleEmailSubmit} onKeyDown={onKeyDown}>
          <input
            type="email"
            className="auth-input"
            placeholder="E-mail"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="auth-input"
            placeholder="Senha"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="auth-submit-btn" type="submit" disabled={busy}>
            {mode === 'register' ? 'Cadastrar' : 'Entrar'}
          </button>
          {mode === 'login' && (
            <button type="button" className="auth-link-btn" onClick={handleForgot}>
              Esqueci minha senha
            </button>
          )}
        </form>

        {busy && <div className="auth-spinner-small" />}
        {error && <div className="auth-error">{error}</div>}
      </div>
    </div>
  );
}
