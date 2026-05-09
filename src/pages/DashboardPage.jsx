import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import UpcomingSundayCard from '../components/dashboard/UpcomingSundayCard';
import DashboardAlerts from '../components/dashboard/DashboardAlerts';
import RecentActivity from '../components/dashboard/RecentActivity';
import QuickLinks from '../components/dashboard/QuickLinks';
import { useAuth } from '../hooks/useAuth';
import { useUnit } from '../hooks/useUnit';
import { listDrafts, getRecentFinalized } from '../services/atas';
import { getInvites } from '../services/invites';
import { getNextNSundays } from '../utils/speakerHelpers';
import '../styles/dashboard.css';

const UPCOMING_COUNT = 4;

export default function DashboardPage() {
  const { userData } = useAuth();
  const { unitId, loading: unitLoading } = useUnit();
  const [data, setData] = useState({
    drafts: [],
    invites: [],
    finalized: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!unitId || unitLoading) return;
    let cancelled = false;
    (async () => {
      const upcomingDates = getNextNSundays(UPCOMING_COUNT);
      const fromDate = upcomingDates[0];
      const toDate = upcomingDates[upcomingDates.length - 1];
      try {
        const [drafts, invites, finalized] = await Promise.all([
          // Pull a wider window than just upcoming so we can also surface
          // unfinalized drafts from past Sundays as alerts.
          listDrafts(unitId),
          getInvites(unitId),
          getRecentFinalized(unitId, 3),
        ]);
        if (cancelled) return;
        setData({ drafts, invites, finalized, loading: false, error: null });
      } catch (err) {
        console.error('Dashboard load failed:', err);
        if (cancelled) return;
        setData((prev) => ({ ...prev, loading: false, error: err }));
      }
      // Note: fromDate/toDate are computed for potential future use (server-side filtering)
      void fromDate; void toDate;
    })();
    return () => { cancelled = true; };
  }, [unitId, unitLoading]);

  // Counter role: route directly to attendance, skip dashboard entirely.
  if (userData?.role === 'counter') {
    return <Navigate to="/frequencia/simples" replace />;
  }

  const upcomingDates = getNextNSundays(UPCOMING_COUNT);
  const draftByDate = new Map(data.drafts.map((d) => [d.data, d]));
  const invitesByDate = data.invites.reduce((acc, inv) => {
    if (!inv.dataAlvo) return acc;
    if (!acc.has(inv.dataAlvo)) acc.set(inv.dataAlvo, []);
    acc.get(inv.dataAlvo).push(inv);
    return acc;
  }, new Map());

  return (
    <>
      <AppHeader />
      <div className="app-content">
        <div className="form-wrap">
          {data.loading || unitLoading ? (
            <div className="dashboard-empty">Carregando painel...</div>
          ) : data.error ? (
            <div className="dashboard-empty">Erro ao carregar painel. Recarregue a página.</div>
          ) : (
            <>
              <div className="dashboard-section">
                <div className="dashboard-section-header">
                  <h3 className="dashboard-section-title">Próximos Domingos</h3>
                </div>
                <div className="upcoming-grid">
                  {upcomingDates.map((date) => (
                    <UpcomingSundayCard
                      key={date}
                      date={date}
                      draft={draftByDate.get(date) || null}
                      invites={invitesByDate.get(date) || []}
                    />
                  ))}
                </div>
              </div>

              <DashboardAlerts
                upcomingDates={upcomingDates}
                drafts={data.drafts}
                invites={data.invites}
              />

              <RecentActivity atas={data.finalized} />

              <QuickLinks />
            </>
          )}
        </div>
      </div>
    </>
  );
}
