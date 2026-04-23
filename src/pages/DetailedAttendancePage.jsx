import { useCallback, useEffect, useMemo, useState } from 'react';
import AppHeader from '../components/layout/AppHeader';
import AttendanceSummary from '../components/attendance/AttendanceSummary';
import HouseholdCard from '../components/attendance/HouseholdCard';
import VisitorEntry from '../components/attendance/VisitorEntry';
import { useAuth } from '../hooks/useAuth';
import { useUnit } from '../hooks/useUnit';
import { useToast } from '../contexts/ToastContext';
import { getHouseholds, getMembers } from '../services/members';
import {
  getAttendance,
  saveDetailedAttendance,
  incrementHouseholdAttendance,
  visitorsTotal,
} from '../services/attendance';
import { currentSundayIso, formatPtBrDate } from '../utils/attendanceDate';

function sortHouseholds(households) {
  return [...households].sort((a, b) => {
    const ca = Number(a.attendanceCount) || 0;
    const cb = Number(b.attendanceCount) || 0;
    if (ca !== cb) return cb - ca;
    return (a.name || '').localeCompare(b.name || '', 'pt-BR');
  });
}

function membersMatchSearch(member, term) {
  if (!term) return true;
  return (member.name || '').toLowerCase().includes(term);
}

function householdMatchesSearch(household, members, term) {
  if (!term) return true;
  const haystack = [
    household.name,
    household.displayName,
    household.headNames,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (haystack.includes(term)) return true;
  return members.some((m) => membersMatchSearch(m, term));
}

export default function DetailedAttendancePage() {
  const { firebaseUser } = useAuth();
  const { unitId, loading: unitLoading } = useUnit();
  const { showToast } = useToast();

  const todayDate = useMemo(() => currentSundayIso(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [households, setHouseholds] = useState([]);
  const [membersByHousehold, setMembersByHousehold] = useState({});
  const [unassignedMembers, setUnassignedMembers] = useState([]);
  const [presentIds, setPresentIds] = useState(() => new Set());
  const [visitors, setVisitors] = useState([]);
  const [search, setSearch] = useState('');
  const [hadExistingDetailed, setHadExistingDetailed] = useState(false);

  useEffect(() => {
    if (!unitId || unitLoading) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [householdsList, membersList, existing] = await Promise.all([
          getHouseholds(unitId),
          getMembers(unitId),
          getAttendance(unitId, todayDate),
        ]);
        if (cancelled) return;

        const byHousehold = {};
        const unassigned = [];
        for (const m of membersList) {
          if (m.householdId) {
            (byHousehold[m.householdId] ||= []).push(m);
          } else {
            unassigned.push(m);
          }
        }
        for (const id of Object.keys(byHousehold)) {
          byHousehold[id].sort((a, b) =>
            (a.name || '').localeCompare(b.name || '', 'pt-BR'),
          );
        }
        unassigned.sort((a, b) =>
          (a.name || '').localeCompare(b.name || '', 'pt-BR'),
        );

        setHouseholds(sortHouseholds(householdsList));
        setMembersByHousehold(byHousehold);
        setUnassignedMembers(unassigned);

        const initialPresent = new Set(
          Array.isArray(existing?.presentMemberIds)
            ? existing.presentMemberIds
            : [],
        );
        setPresentIds(initialPresent);
        setVisitors(
          Array.isArray(existing?.visitors) ? existing.visitors : [],
        );
        setHadExistingDetailed(
          Boolean(existing?.detailedCountAt) ||
            Boolean(existing?.detailedTotal),
        );
      } catch (err) {
        console.error('Falha ao carregar frequência detalhada:', err);
        showToast('Erro ao carregar dados.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [unitId, unitLoading, todayDate, showToast]);

  const toggleMember = useCallback((memberId, checked) => {
    setPresentIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(memberId);
      else next.delete(memberId);
      return next;
    });
  }, []);

  const toggleHousehold = useCallback((householdMembers, checked) => {
    setPresentIds((prev) => {
      const next = new Set(prev);
      for (const m of householdMembers) {
        if (checked) next.add(m.id);
        else next.delete(m.id);
      }
      return next;
    });
  }, []);

  const addVisitor = useCallback((entry) => {
    setVisitors((prev) => [...prev, entry]);
  }, []);

  const removeVisitor = useCallback((idx) => {
    setVisitors((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const memberCount = presentIds.size;
  const visitorCount = visitorsTotal(visitors);
  const total = memberCount + visitorCount;

  const searchTerm = search.trim().toLowerCase();

  const visibleHouseholds = useMemo(() => {
    return households.filter((h) =>
      householdMatchesSearch(h, membersByHousehold[h.id] || [], searchTerm),
    );
  }, [households, membersByHousehold, searchTerm]);

  const visibleUnassigned = useMemo(
    () => unassignedMembers.filter((m) => membersMatchSearch(m, searchTerm)),
    [unassignedMembers, searchTerm],
  );

  async function handleSave() {
    if (!unitId || saving) return;
    setSaving(true);
    try {
      const presentMemberIds = Array.from(presentIds);
      await saveDetailedAttendance(
        unitId,
        todayDate,
        { presentMemberIds, visitors, detailedTotal: total },
        firebaseUser?.uid,
      );

      if (!hadExistingDetailed) {
        const presentHouseholdIds = new Set();
        for (const [hid, members] of Object.entries(membersByHousehold)) {
          if (members.some((m) => presentIds.has(m.id))) {
            presentHouseholdIds.add(hid);
          }
        }
        if (presentHouseholdIds.size > 0) {
          await incrementHouseholdAttendance(
            unitId,
            Array.from(presentHouseholdIds),
          );
        }
        setHadExistingDetailed(true);
      }

      showToast('Frequência detalhada salva.');
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar frequência.');
    } finally {
      setSaving(false);
    }
  }

  if (loading || unitLoading) {
    return (
      <>
        <AppHeader />
        <div className="app-content">
          <div className="attendance-simple-loading">Carregando...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <div className="app-content">
        <div className="attendance-detailed">
          <AttendanceSummary
            date={formatPtBrDate(todayDate)}
            memberCount={memberCount}
            visitorCount={visitorCount}
            total={total}
            searchValue={search}
            onSearchChange={setSearch}
          />

          <div className="attendance-households">
            {visibleHouseholds.length === 0 && visibleUnassigned.length === 0 && (
              <p className="attendance-empty">
                Nenhuma família ou membro encontrado.
              </p>
            )}

            {visibleHouseholds.map((h) => (
              <HouseholdCard
                key={h.id}
                household={h}
                members={membersByHousehold[h.id] || []}
                checkedMemberIds={Array.from(presentIds)}
                onToggleHousehold={(checked) =>
                  toggleHousehold(membersByHousehold[h.id] || [], checked)
                }
                onToggleMember={toggleMember}
              />
            ))}

            {visibleUnassigned.length > 0 && (
              <HouseholdCard
                household={{
                  id: '__unassigned__',
                  name: 'Sem família cadastrada',
                }}
                members={visibleUnassigned}
                checkedMemberIds={Array.from(presentIds)}
                onToggleHousehold={(checked) =>
                  toggleHousehold(visibleUnassigned, checked)
                }
                onToggleMember={toggleMember}
              />
            )}
          </div>

          <VisitorEntry
            visitors={visitors}
            onAdd={addVisitor}
            onRemove={removeVisitor}
          />

          <div className="attendance-save-bar">
            <div className="attendance-save-bar-total">
              Total: <strong>{total}</strong>
            </div>
            <button
              type="button"
              className="btn btn-primary attendance-save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar Frequência'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
