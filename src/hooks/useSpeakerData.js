import { useEffect, useState, useCallback, useMemo } from 'react';
import { useUnit } from './useUnit';
import { getSpeakerLog } from '../services/speakers';
import { getInvites } from '../services/invites';
import { getDiscourseTopics } from '../services/topics';
import { getRecentAttendances } from '../services/attendance';
import { getAtaHistory } from '../services/atas';
import { getCalendarSettings } from '../services/calendar';
import { consolidateSpeakerHistory } from '../utils/speakerHelpers';

export function useSpeakerData() {
  const { unitId, members } = useUnit();
  const [rawSpeakerLog, setRawSpeakerLog] = useState([]);
  const [finalizedAtas, setFinalizedAtas] = useState([]);
  const [invites, setInvites] = useState([]);
  const [topics, setTopics] = useState([]);
  const [recentAttendances, setRecentAttendances] = useState([]);
  const [calendarSettings, setCalendarSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!unitId) return;
    setLoading(true);
    setError(null);
    try {
      const [log, inv, top, att, atas, cal] = await Promise.all([
        getSpeakerLog(unitId),
        getInvites(unitId),
        getDiscourseTopics(unitId),
        getRecentAttendances(unitId, 12),
        getAtaHistory(unitId, { max: 100 }),
        getCalendarSettings(unitId),
      ]);
      setRawSpeakerLog(log || []);
      setInvites(inv || []);
      setTopics(top || []);
      setRecentAttendances(att || []);
      setFinalizedAtas(atas || []);
      setCalendarSettings(cal || null);
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

  const speakerLog = useMemo(() => {
    return consolidateSpeakerHistory({
      speakerLog: rawSpeakerLog,
      finalizedAtas,
      invites,
      members,
    });
  }, [rawSpeakerLog, finalizedAtas, invites, members]);

  return { speakerLog, invites, topics, recentAttendances, members, calendarSettings, loading, error, reload };
}

