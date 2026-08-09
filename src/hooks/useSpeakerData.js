import { useEffect, useState, useCallback } from 'react';
import { useUnit } from './useUnit';
import { getSpeakerLog } from '../services/speakers';
import { getInvites } from '../services/invites';
import { getDiscourseTopics } from '../services/topics';
import { getRecentAttendances } from '../services/attendance';

export function useSpeakerData() {
  const { unitId, members } = useUnit();
  const [speakerLog, setSpeakerLog] = useState([]);
  const [invites, setInvites] = useState([]);
  const [topics, setTopics] = useState([]);
  const [recentAttendances, setRecentAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!unitId) return;
    setLoading(true);
    setError(null);
    try {
      const [log, inv, top, att] = await Promise.all([
        getSpeakerLog(unitId),
        getInvites(unitId),
        getDiscourseTopics(unitId),
        getRecentAttendances(unitId, 12),
      ]);
      setSpeakerLog(log);
      setInvites(inv);
      setTopics(top);
      setRecentAttendances(att);
    } catch (e) {
      console.error('useSpeakerData:', e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { speakerLog, invites, topics, recentAttendances, members, loading, error, reload };
}

