import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import UpcomingSundayCard from '../components/dashboard/UpcomingSundayCard';
import DashboardAlerts from '../components/dashboard/DashboardAlerts';
import RecentActivity from '../components/dashboard/RecentActivity';
import QuickLinks from '../components/dashboard/QuickLinks';
import SpecialSundaysModal from '../components/dashboard/SpecialSundaysModal';
import { useAuth } from '../hooks/useAuth';
import { useUnit } from '../hooks/useUnit';
import { listDrafts, getRecentFinalized, getFinalizedAtasForDates, deleteAta } from '../services/atas';
import { getInvites } from '../services/invites';
import { getCalendarSettings } from '../services/calendar';
import { getNextNSundays, daysUntil, getSpecialSundayInfo, toLocalISODate } from '../utils/speakerHelpers';
import '../styles/dashboard.css';

const UPCOMING_COUNT = 4;

export default function DashboardPage() {
  const { userData } = useAuth();
  const { unitId, loading: unitLoading } = useUnit();
  const [specialModalOpen, setSpecialModalOpen] = useState(false);
  const [data, setData] = useState({
    drafts: [],
    invites: [],
    finalized: [],
    calendarSettings: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!unitId || unitLoading) return;
    let cancelled = false;
    (async () => {
      try {
        const [rawDrafts, invites, finalized, calendarSettings] = await Promise.all([
          // Pull all drafts so we can also surface unfinalized past-Sunday drafts as alerts.
          listDrafts(unitId),
          getInvites(unitId),
          getRecentFinalized(unitId, 5),
          getCalendarSettings(unitId),
        ]);
        if (cancelled) return;

        // Self-healing: filter and delete drafts that have already been finalized.
        // To be cost-effective, we only check drafts whose dates are in the past.
        let filteredDrafts = rawDrafts;
        const pastDrafts = rawDrafts.filter((d) => {
          const days = daysUntil(d.data);
          return days != null && days < 0;
        });
        const pastDraftDates = pastDrafts.map((d) => d.data).filter(Boolean);

        if (pastDraftDates.length > 0) {
          const finalizedForDraftDates = await getFinalizedAtasForDates(unitId, pastDraftDates);
          const finalizedDatesSet = new Set(finalizedForDraftDates.map((a) => a.data));

          if (finalizedDatesSet.size > 0) {
            const duplicates = pastDrafts.filter((d) => finalizedDatesSet.has(d.data));
            const duplicateIdsSet = new Set(duplicates.map((d) => d.id));
            filteredDrafts = rawDrafts.filter((d) => !duplicateIdsSet.has(d.id));

            // Clean up duplicates in Firestore asynchronously, but only if the user is a superadmin to prevent permission errors
            if (userData?.role === 'superadmin') {
              duplicates.forEach((dup) => {
                console.log(`[Self-Healing] Deleting orphaned draft ${dup.id} for date ${dup.data}`);
                deleteAta(unitId, dup.id).catch((err) => {
                  console.error(`[Self-Healing] Failed to delete orphaned draft ${dup.id}:`, err);
                });
              });
            }
          }
        }

        setData({
          drafts: filteredDrafts,
          invites,
          finalized,
          calendarSettings,
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error('Dashboard load failed:', err);
        if (cancelled) return;
        setData((prev) => ({ ...prev, loading: false, error: err }));
      }
    })();
    return () => { cancelled = true; };
  }, [unitId, unitLoading, userData]);

  // Counter role: route directly to attendance, skip dashboard entirely.
  if (userData?.role === 'counter') {
    return <Navigate to="/frequencia/simples" replace />;
  }

  // If today is Sunday and today's sacramental meeting has already been finalized,
  // skip today so the dashboard immediately focuses on planning upcoming meetings.
  const now = new Date();
  const isSunday = now.getDay() === 0;
  const todayIso = isSunday ? toLocalISODate(now) : null;
  const isTodayFinalized = isSunday && data.finalized.some((a) => a.data === todayIso && a.status === 'finalized');

  const upcomingDates = getNextNSundays(UPCOMING_COUNT, { skipToday: isTodayFinalized });
  const draftByDate = new Map(data.drafts.map((d) => [d.data, d]));
  const invitesByDate = data.invites.reduce((acc, inv) => {
    if (!inv.dataAlvo) return acc;
    if (!acc.has(inv.dataAlvo)) acc.set(inv.dataAlvo, []);
    acc.get(inv.dataAlvo).push(inv);
    return acc;
  }, new Map());
  const finalizedByDate = new Map(data.finalized.map((a) => [a.data, a]));

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
                  <button
                    type="button"
                    className="btn-header-action"
                    onClick={() => setSpecialModalOpen(true)}
                    title="Configurar Conferências e datas sem reunião"
                  >
                    📅 Domingos Especiais
                  </button>
                </div>
                <div className="upcoming-grid">
                  {upcomingDates.map((date) => (
                    <UpcomingSundayCard
                      key={date}
                      date={date}
                      draft={draftByDate.get(date) || null}
                      invites={invitesByDate.get(date) || []}
                      finalizedAta={finalizedByDate.get(date) || null}
                      specialSunday={getSpecialSundayInfo(date, data.calendarSettings)}
                      onManageSpecial={() => setSpecialModalOpen(true)}
                    />
                  ))}
                </div>
              </div>

              <DashboardAlerts
                upcomingDates={upcomingDates}
                drafts={data.drafts}
                invites={data.invites}
                calendarSettings={data.calendarSettings}
              />

              <RecentActivity atas={data.finalized} />

              <QuickLinks />

              <SpecialSundaysModal
                isOpen={specialModalOpen}
                onClose={() => setSpecialModalOpen(false)}
                unitId={unitId}
                calendarSettings={data.calendarSettings}
                onSettingsSaved={(newSettings) => {
                  setData((prev) => ({ ...prev, calendarSettings: newSettings }));
                }}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
