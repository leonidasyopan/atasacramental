import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import AttendanceSummary from '../components/attendance/AttendanceSummary';
import HouseholdCard from '../components/attendance/HouseholdCard';
import VisitorEntry from '../components/attendance/VisitorEntry';
import OtherCountCard from '../components/attendance/OtherCountCard';
import { useAuth } from '../hooks/useAuth';
import { useUnit } from '../hooks/useUnit';
import { useToast } from '../contexts/ToastContext';
import { getHouseholds, getMembers } from '../services/members';
import {
  getAttendance,
  saveDetailedAttendance,
  incrementHouseholdAttendance,
  markHouseholdsIncremented,
  visitorsTotal,
} from '../services/attendance';
import { currentSundayIso, formatPtBrDate } from '../utils/attendanceDate';
import { normalizeForSearch } from '../utils/textSearch';

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
  return normalizeForSearch(member.name).includes(term);
}

function householdMatchesSearch(household, members, term) {
  if (!term) return true;
  const haystack = normalizeForSearch(
    [household.name, household.displayName, household.headNames]
      .filter(Boolean)
      .join(' '),
  );
  if (haystack.includes(term)) return true;
  return members.some((m) => membersMatchSearch(m, term));
}

export default function DetailedAttendancePage() {
  const { firebaseUser } = useAuth();
  const { unitId, loading: unitLoading } = useUnit();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const todayIso = useMemo(() => currentSundayIso(), []);
  const queryDate = searchParams.get('date');
  const targetDate = queryDate || todayIso;
  const isHistorical = Boolean(queryDate) && queryDate !== todayIso;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [households, setHouseholds] = useState([]);
  const [membersByHousehold, setMembersByHousehold] = useState({});
  const [unassignedMembers, setUnassignedMembers] = useState([]);
  const [presentIds, setPresentIds] = useState(() => new Set());
  const [visitors, setVisitors] = useState([]);
  const [search, setSearch] = useState('');
  const [hadExistingDetailed, setHadExistingDetailed] = useState(false);
  const [simpleCount, setSimpleCount] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle');
  const isInitialLoad = useRef(true);
  const debounceTimer = useRef(null);
  const isSavingRef = useRef(false);
  const hadExistingDetailedRef = useRef(hadExistingDetailed);
  const membersByHouseholdRef = useRef(membersByHousehold);
  const hasPendingChangesRef = useRef(false);
  const saveVersionRef = useRef(0);

  useEffect(() => {
    if (!unitId || unitLoading) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [householdsList, membersList, existing] = await Promise.all([
          getHouseholds(unitId),
          getMembers(unitId),
          getAttendance(unitId, targetDate),
        ]);
        if (cancelled) return;

        const activeHouseholdIds = new Set(householdsList.map((h) => h.id));
        const byHousehold = {};
        const unassigned = [];
        for (const m of membersList) {
          if (m.householdId && activeHouseholdIds.has(m.householdId)) {
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
          Boolean(existing?.householdsIncremented) ||
            Boolean(existing?.detailedCountAt) ||
            Boolean(existing?.detailedTotal),
        );
        setSimpleCount(
          Number.isFinite(existing?.simpleCount)
            ? existing.simpleCount
            : null,
        );
      } catch (err) {
        console.error('Falha ao carregar frequência detalhada:', err);
        showToast('Erro ao carregar dados.');
      } finally {
        if (!cancelled) {
          setLoading(false);
          requestAnimationFrame(() => { isInitialLoad.current = false; });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [unitId, unitLoading, targetDate, showToast]);

  useEffect(() => { hadExistingDetailedRef.current = hadExistingDetailed; }, [hadExistingDetailed]);
  useEffect(() => { membersByHouseholdRef.current = membersByHousehold; }, [membersByHousehold]);

  useEffect(() => {
    if (loading || isInitialLoad.current || !unitId) return;

    hasPendingChangesRef.current = true;
    saveVersionRef.current += 1;
    const thisVersion = saveVersionRef.current;

    clearTimeout(debounceTimer.current);

    async function performSave() {
      if (isSavingRef.current) {
        debounceTimer.current = setTimeout(performSave, 500);
        return;
      }
      isSavingRef.current = true;
      setAutoSaveStatus('saving');
      try {
        const presentMemberIds = Array.from(presentIds);
        const autoTotal = presentIds.size + visitorsTotal(visitors);
        await saveDetailedAttendance(
          unitId,
          targetDate,
          { presentMemberIds, visitors, detailedTotal: autoTotal },
          firebaseUser?.uid,
        );

        if (saveVersionRef.current === thisVersion) {
          hasPendingChangesRef.current = false;
          setAutoSaveStatus('saved');
        }
      } catch (err) {
        console.error('Autosave failed:', err);
        setAutoSaveStatus('error');
      } finally {
        isSavingRef.current = false;
      }
    }

    debounceTimer.current = setTimeout(performSave, 2000);

    return () => clearTimeout(debounceTimer.current);
  }, [presentIds, visitors, unitId, targetDate, firebaseUser?.uid, loading]);

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

  const checkedMemberIds = useMemo(() => Array.from(presentIds), [presentIds]);
  const memberCount = presentIds.size;
  const visitorCount = visitorsTotal(visitors);
  const total = memberCount + visitorCount;

  const searchTerm = normalizeForSearch(search.trim());

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
    if (!unitId || saving || isSavingRef.current) return;
    clearTimeout(debounceTimer.current);
    saveVersionRef.current += 1;
    isSavingRef.current = true;
    setSaving(true);
    try {
      const presentMemberIds = Array.from(presentIds);
      await saveDetailedAttendance(
        unitId,
        targetDate,
        { presentMemberIds, visitors, detailedTotal: total },
        firebaseUser?.uid,
      );

      if (!hadExistingDetailedRef.current) {
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
        await markHouseholdsIncremented(unitId, targetDate);
        hadExistingDetailedRef.current = true;
        setHadExistingDetailed(true);
      }

      hasPendingChangesRef.current = false;
      setAutoSaveStatus('saved');
      showToast('Frequência detalhada salva.');
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar frequência.');
    } finally {
      isSavingRef.current = false;
      setSaving(false);
    }
  }

  useEffect(() => {
    function handleBeforeUnload(e) {
      if (autoSaveStatus === 'saving' || hasPendingChangesRef.current) {
        e.preventDefault();
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [autoSaveStatus]);

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
            date={formatPtBrDate(targetDate)}
            memberCount={memberCount}
            visitorCount={visitorCount}
            total={total}
            searchValue={search}
            onSearchChange={setSearch}
          />

          {isHistorical && (
            <p className="attendance-historical-hint attendance-historical-hint-top">
              Editando frequência de um domingo passado.
            </p>
          )}

          <OtherCountCard
            currentMode="detailed"
            otherValue={simpleCount}
            date={targetDate}
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
                checkedMemberIds={checkedMemberIds}
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
                checkedMemberIds={checkedMemberIds}
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
              {autoSaveStatus === 'saving' && <span className="attendance-autosave-hint"> — Salvando...</span>}
              {autoSaveStatus === 'saved' && <span className="attendance-autosave-hint attendance-autosave-saved"> — Salvo ✓</span>}
              {autoSaveStatus === 'error' && <span className="attendance-autosave-hint attendance-autosave-error"> — Erro ao salvar</span>}
            </div>
            <button
              type="button"
              className="btn btn-primary attendance-save-btn"
              onClick={handleSave}
              disabled={saving || autoSaveStatus === 'saving'}
            >
              {saving ? 'Salvando...' : 'Salvar Frequência'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
