import { useState } from 'react';
import AppHeader from '../components/layout/AppHeader';
import SpeakerDashboard from '../components/speakers/SpeakerDashboard';
import InviteManager from '../components/speakers/InviteManager';
import SpeakerHistory from '../components/speakers/SpeakerHistory';
import TopicManager from '../components/speakers/TopicManager';
import { useSpeakerData } from '../hooks/useSpeakerData';
import '../styles/speakers.css';

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'convites', label: 'Convites' },
  { key: 'historico', label: 'Histórico' },
  { key: 'temas', label: 'Temas' },
];

export default function SpeakersPage() {
  const [tab, setTab] = useState('dashboard');
  const { speakerLog, invites, topics, members, loading, error, reload } = useSpeakerData();

  return (
    <>
      <AppHeader />
      <div className="app-content">
        <div className="form-wrap">
          <div className="card">
            <div className="card-header">
              <div className="card-header-left">
                <h2>Discursantes</h2>
              </div>
            </div>
            <div className="card-body">
              <div className="speakers-tabs">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    className={`speakers-tab${tab === t.key ? ' active' : ''}`}
                    onClick={() => setTab(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {loading && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                  <div
                    className="spinner"
                    style={{
                      margin: '0 auto 16px',
                      width: '32px',
                      height: '32px',
                      border: '3px solid #e5e7eb',
                      borderTopColor: 'var(--blue)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  <p>Carregando dados...</p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}

              {error && (
                <p className="auth-error">Erro ao carregar dados de discursantes.</p>
              )}

              {!loading && !error && (
                <>
                  {tab === 'dashboard' && (
                    <SpeakerDashboard
                      speakerLog={speakerLog}
                      invites={invites}
                      topics={topics}
                      members={members}
                      reload={reload}
                    />
                  )}
                  {tab === 'convites' && (
                    <InviteManager
                      invites={invites}
                      topics={topics}
                      members={members}
                      reload={reload}
                    />
                  )}
                  {tab === 'historico' && (
                    <SpeakerHistory speakerLog={speakerLog} />
                  )}
                  {tab === 'temas' && (
                    <TopicManager topics={topics} reload={reload} />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
