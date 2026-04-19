import { createContext, useEffect, useState, useMemo, useCallback } from 'react';
import { getUnit, getLeaders } from '../services/units';
import { getMembers } from '../services/members';
import { useAuth } from '../hooks/useAuth';

export const UnitContext = createContext(null);

/**
 * UnitProvider loads the unit doc + leaders subcollection + members subcollection
 * for the logged-in user's unit. Leaders are stored as `units/{unitId}/leaders/{id}`
 * so admins can add/edit/reorder beyond just the Branch Presidency.
 */
export function UnitProvider({ children }) {
  const { userData, isAuthorized } = useAuth();
  const unitId = userData?.unitId || null;

  const [unit, setUnit] = useState(null);
  const [leaders, setLeaders] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!unitId) {
      setUnit(null);
      setLeaders([]);
      setMembers([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [unitDoc, leadersList, membersList] = await Promise.all([
        getUnit(unitId),
        getLeaders(unitId),
        getMembers(unitId),
      ]);
      setUnit(unitDoc);
      setLeaders(leadersList);
      setMembers(membersList);
    } catch (e) {
      console.error('UnitContext load failed:', e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  useEffect(() => {
    if (!isAuthorized) return;
    reload();
  }, [isAuthorized, reload]);

  const value = useMemo(() => {
    const leaderNames = leaders.map((l) => l.name).filter(Boolean);
    const rawType = unit?.type || 'ramo';
    const unitType = String(rawType).toLowerCase() === 'ala' ? 'ala' : 'ramo';
    return {
      unitId,
      unit,
      unitType,
      leaders: leaderNames,
      leadersFull: leaders,
      members,
      loading,
      error,
      reload,
    };
  }, [unitId, unit, leaders, members, loading, error, reload]);

  return <UnitContext.Provider value={value}>{children}</UnitContext.Provider>;
}
