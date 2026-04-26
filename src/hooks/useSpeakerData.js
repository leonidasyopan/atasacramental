import { useEffect, useState, useCallback } from 'react';
import { useUnit } from './useUnit';
import { getSpeakerLog } from '../services/speakers';
import { getInvites } from '../services/invites';
import { getDiscourseTopics } from '../services/topics';

export function useSpeakerData() {
  const { unitId, members } = useUnit();
  const [speakerLog, setSpeakerLog] = useState([]);
  const [invites, setInvites] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!unitId) return;
    setLoading(true);
    setError(null);
    try {
      const [log, inv, top] = await Promise.all([
        getSpeakerLog(unitId),
        getInvites(unitId),
        getDiscourseTopics(unitId),
      ]);
      setSpeakerLog(log);
      setInvites(inv);
      setTopics(top);
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

  return { speakerLog, invites, topics, members, loading, error, reload };
}
