/**
 * Pure helper functions for the speaker management module.
 * No Firebase dependencies — safe to use anywhere.
 */

import { normalizeForSearch } from './textSearch';
import { naturalOrderName } from './directoryParser';

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });

/**
 * Strips common Brazilian LDS titles and honorifics (case- and accent-insensitive)
 * e.g., "Irmã Nélia", "Irmão Edivan", "Elder Smith", "Bispo Silva", "Pres. Santos".
 */
export function stripHonorific(name) {
  if (!name) return '';
  return String(name)
    .replace(/^(irmã|irma|irmão|irmao|ir\.|ir|élder|elder|bispo|bisp\.|presidente|pres\.)\s+/i, '')
    .trim();
}

/**
 * Format a Date as YYYY-MM-DD using local timezone (not UTC).
 * Avoids the off-by-one bug from `toISOString()` for users in negative UTC
 * offsets (e.g. Brazil UTC-3) late at night.
 */
function toLocalISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Match a name against the members list.
 * Compares normalized needle against `m.name`, `m.fullName`, `m.originalLcrName`,
 * and the natural order of `m.originalLcrName`, with and without common honorifics.
 * @param {string} name
 * @param {Array} members
 * @returns {string|null} member id or null
 */
export function findMemberId(name, members) {
  if (!name || !Array.isArray(members)) return null;
  const rawNeedle = name.trim();
  if (!rawNeedle) return null;

  const normNeedle = normalizeForSearch(rawNeedle);
  const cleanNeedle = normalizeForSearch(stripHonorific(rawNeedle));

  for (const m of members) {
    if (!m) continue;
    const normName = normalizeForSearch(m.name || '');
    const normFull = normalizeForSearch(m.fullName || '');
    const normLcr = normalizeForSearch(m.originalLcrName || '');
    const normNat = normalizeForSearch(naturalOrderName(m.originalLcrName || ''));

    if (
      (normNeedle && (normName === normNeedle || normFull === normNeedle || normLcr === normNeedle || normNat === normNeedle)) ||
      (cleanNeedle && (normName === cleanNeedle || normFull === cleanNeedle || normNat === cleanNeedle))
    ) {
      return m.id;
    }
  }
  return null;
}

/**
 * Filter speakerLog entries by period (months from today).
 * If months is null, returns everything.
 */
export function filterLogByPeriod(log, months) {
  if (!Array.isArray(log)) return [];
  if (months == null) return log;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const y = cutoff.getFullYear();
  const m = String(cutoff.getMonth() + 1).padStart(2, '0');
  const d = String(cutoff.getDate()).padStart(2, '0');
  const cutoffISO = `${y}-${m}-${d}`;
  return log.filter((entry) => entry.data >= cutoffISO);
}

/**
 * Consolidates speaker history from all official and operational sources:
 * 1. Finalized Atas (atas with status === 'finalized' and mode === 'disc')
 *    - Captures emergency speakers called to fill vacancies who never had an invite.
 * 2. Completed Invites (discourseInvites with status === 'concluido')
 *    - Captures invited members whose talk has taken place even if the meeting minutes
 *      have not yet been finalized.
 * 3. speakerLog collection entries (explicit logs or historical records).
 *
 * Deduplicates by (date + memberId) or (date + normalized name) so that the same talk
 * is never counted or displayed twice, keeping the richest attributes (topic, duration).
 *
 * @param {object} params
 * @param {Array} [params.speakerLog]
 * @param {Array} [params.finalizedAtas]
 * @param {Array} [params.invites]
 * @param {Array} [params.members]
 * @returns {Array} Consolidated speaker entries sorted by data desc
 */
export function consolidateSpeakerHistory({
  speakerLog = [],
  finalizedAtas = [],
  invites = [],
  members = [],
} = {}) {
  const map = new Map();

  const getMemberKey = (memberId, name) => {
    if (memberId) return `id_${memberId}`;
    const clean = normalizeForSearch(stripHonorific(name || ''));
    return clean ? `name_${clean}` : null;
  };

  const mergeEntry = (item) => {
    if (!item || !item.data) return;
    const name = (item.name || item.memberName || '').trim();
    if (!name && !item.memberId) return;

    let memberId = item.memberId || null;
    if (!memberId && name && Array.isArray(members) && members.length > 0) {
      memberId = findMemberId(name, members);
    }

    const memberKey = getMemberKey(memberId, name);
    if (!memberKey) return;

    const dedupKey = `${item.data}_${memberKey}`;
    const existing = map.get(dedupKey);

    const topic = (item.topic || '').trim() || null;
    const duration =
      item.duration != null && !isNaN(Number(item.duration)) && Number(item.duration) > 0
        ? Number(item.duration)
        : null;

    if (!existing) {
      let resolvedName = name;
      if (!resolvedName && memberId && Array.isArray(members)) {
        const found = members.find((m) => m.id === memberId);
        if (found?.name) resolvedName = found.name;
      }

      map.set(dedupKey, {
        id: item.id || `speech_${dedupKey}`,
        data: item.data,
        name: resolvedName || 'Discursante',
        memberId: memberId || null,
        topic,
        duration,
        ataId: item.ataId || null,
      });
    } else {
      if (!existing.memberId && memberId) existing.memberId = memberId;
      if (!existing.topic && topic) existing.topic = topic;
      if (!existing.duration && duration) existing.duration = duration;
      if (!existing.ataId && item.ataId) existing.ataId = item.ataId;
      if (name && (!existing.name || existing.name.length < name.length)) {
        existing.name = name;
      }
    }
  };

  // 1. Process finalized Atas (the official record of meetings)
  if (Array.isArray(finalizedAtas)) {
    for (const ata of finalizedAtas) {
      if (ata.status === 'finalized' && ata.mode === 'disc' && Array.isArray(ata.rowsDisc)) {
        for (let idx = 0; idx < ata.rowsDisc.length; idx++) {
          const row = ata.rowsDisc[idx];
          const nome = Array.isArray(row) ? row[0] : row?.c0;
          const tema = Array.isArray(row) ? row[1] : row?.c1;
          const dur = Array.isArray(row) ? row[2] : row?.c2;
          if (nome && String(nome).trim()) {
            mergeEntry({
              id: `ata_${ata.id}_${idx}`,
              ataId: ata.id,
              data: ata.data,
              name: String(nome).trim(),
              topic: tema ? String(tema).trim() : null,
              duration: dur ? Number(dur) : null,
            });
          }
        }
      }
    }
  }

  // 2. Process completed invites
  if (Array.isArray(invites)) {
    for (const inv of invites) {
      if (inv.status === 'concluido' && inv.dataAlvo) {
        mergeEntry({
          id: `inv_${inv.id}`,
          data: inv.dataAlvo,
          name: inv.memberName,
          memberId: inv.memberId,
          topic: inv.topic,
          duration: inv.duration,
        });
      }
    }
  }

  // 3. Process explicit speakerLog entries
  if (Array.isArray(speakerLog)) {
    for (const entry of speakerLog) {
      mergeEntry(entry);
    }
  }

  const result = Array.from(map.values());
  result.sort((a, b) => (b.data || '').localeCompare(a.data || ''));
  return result;
}

/**
 * Classify members into those who never spoke and those who already spoke
 * within the given period.
 *
 * @param {Array} members - active members from UnitContext
 * @param {Array} speakerLog - full speakerLog entries
 * @param {number|null} periodMonths - 3, 6, 12, or null (all time)
 * @returns {{ neverSpoke: Array, alreadySpoke: Array }}
 */
export function classifyMembers(members, speakerLog, periodMonths) {
  const filtered = filterLogByPeriod(speakerLog, periodMonths);

  // Build a map: memberId or normalized names → most recent entry
  const lastSpeechMap = new Map();
  const recordEntry = (key, entry) => {
    if (!key) return;
    const existing = lastSpeechMap.get(key);
    if (!existing || (entry.data || '') > (existing.data || '')) {
      lastSpeechMap.set(key, entry);
    }
  };

  for (const entry of filtered) {
    if (entry.memberId) {
      recordEntry(entry.memberId, entry);
    }
    if (entry.name) {
      const norm = normalizeForSearch(entry.name);
      recordEntry(norm, entry);
      const clean = normalizeForSearch(stripHonorific(entry.name));
      if (clean && clean !== norm) {
        recordEntry(clean, entry);
      }
    }
  }

  const neverSpoke = [];
  const alreadySpoke = [];

  for (const m of members) {
    if (m.active === false) continue;
    const byId = m.id ? lastSpeechMap.get(m.id) : null;
    const byName = m.name ? lastSpeechMap.get(normalizeForSearch(m.name)) : null;
    const byClean = m.name ? lastSpeechMap.get(normalizeForSearch(stripHonorific(m.name))) : null;
    const byFull = m.fullName ? lastSpeechMap.get(normalizeForSearch(m.fullName)) : null;
    const byLcr = m.originalLcrName ? lastSpeechMap.get(normalizeForSearch(m.originalLcrName)) : null;
    const byNat = m.originalLcrName ? lastSpeechMap.get(normalizeForSearch(naturalOrderName(m.originalLcrName))) : null;

    const candidates = [byId, byName, byClean, byFull, byLcr, byNat].filter(Boolean);
    let lastSpeech = null;
    for (const cand of candidates) {
      if (!lastSpeech || (cand.data || '') > (lastSpeech.data || '')) {
        lastSpeech = cand;
      }
    }

    if (lastSpeech) {
      alreadySpoke.push({ member: m, lastSpeech });
    } else {
      neverSpoke.push({ member: m, lastSpeech: null });
    }
  }

  // neverSpoke: alphabetical
  neverSpoke.sort((a, b) => collator.compare(a.member.name || '', b.member.name || ''));

  // alreadySpoke: oldest first (who spoke longest ago comes first)
  alreadySpoke.sort((a, b) => {
    const da = a.lastSpeech?.data || '';
    const db = b.lastSpeech?.data || '';
    if (da < db) return -1;
    if (da > db) return 1;
    return 0;
  });

  return { neverSpoke, alreadySpoke };
}

/**
 * Filter members based on age group ('all', '18+', '11+').
 * If member.age is undefined or null, by default they are included (assuming adult).
 * Handles both raw member objects and wrapped objects containing { member }.
 *
 * @param {Array} items - Array of { member, ... } or raw member objects
 * @param {string} ageGroup - 'all' | '18+' | '11+'
 * @returns {Array}
 */
export function filterMembersByAge(items, ageGroup) {
  if (!Array.isArray(items) || !ageGroup || ageGroup === 'all') {
    return items || [];
  }

  return items.filter((item) => {
    const member = item?.member || item;
    if (!member) return false;

    let age = member.age;
    if (age == null && member.birthDate) {
      const birth = new Date(member.birthDate);
      if (!isNaN(birth.getTime())) {
        const today = new Date();
        age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
      }
    }

    if (ageGroup === '18+') {
      // If age is unknown, keep (assume adult by default)
      if (age == null) return true;
      return age >= 18;
    }

    if (ageGroup === '11+') {
      // If age is unknown, keep (assume eligible by default)
      if (age == null) return true;
      return age >= 11;
    }

    if (ageGroup === '11-17') {
      // Youth filter: only members whose known age is between 11 and 17
      if (age == null) return false;
      return age >= 11 && age <= 17;
    }

    return true;
  });
}

/**
 * Calculate member attendance counts based on recent attendance records.
 *
 * @param {Array} recentAttendances - Array of attendance docs with `presentMemberIds`
 * @returns {Map<string, number>} memberId -> attendanceCount
 */
export function calculateMemberAttendance(recentAttendances) {
  const attendanceMap = new Map();
  if (!Array.isArray(recentAttendances)) return attendanceMap;

  for (const record of recentAttendances) {
    const presentIds = Array.isArray(record?.presentMemberIds) ? record.presentMemberIds : [];
    for (const id of presentIds) {
      if (id) {
        attendanceMap.set(id, (attendanceMap.get(id) || 0) + 1);
      }
    }
  }

  return attendanceMap;
}

/**
 * Filter invites that are upcoming (dataAlvo >= today) and
 * have status 'pendente' or 'aceito'.
 */
export function getUpcomingInvites(invites) {
  if (!Array.isArray(invites)) return [];
  const today = todayLocal();
  return invites.filter(
    (inv) => inv.dataAlvo >= today && (inv.status === 'pendente' || inv.status === 'aceito'),
  );
}

/**
 * Format "2026-04-24" → "24/04/2026".
 */
export function formatDateBR(isoString) {
  if (!isoString) return '';
  const [y, m, d] = isoString.split('-').map(Number);
  if (!y) return isoString;
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

const ACTIVE_INVITE_STATUSES = new Set(['pendente', 'aceito', 'concluido']);

const GENERIC_TOPICS = new Set([
  'tema livre',
  'livre',
  'assunto livre',
  'a definir',
  'definir tema',
  'indefinido',
  'tbd',
  'tbc',
  'a confirmar',
  'sem tema',
]);

/**
 * Check if a topic is a generic or free topic.
 * @param {string} topic
 * @returns {boolean}
 */
export function isGenericTopic(topic) {
  if (!topic || !topic.trim()) return true;
  return GENERIC_TOPICS.has(topic.trim().toLowerCase());
}

/**
 * Build a Map from normalized topic string → most-recent active invite
 * that uses it. A theme is "used" when held by an invite with status
 * pendente/aceito/concluido (recusado releases it back to the pool).
 *
 * @param {Array} invites
 * @param {object} [opts]
 * @param {string} [opts.excludeInviteId] - skip this invite (for edit mode)
 * @returns {Map<string, object>} key = topic.trim().toLowerCase()
 */
export function getUsedTopicMap(invites, { excludeInviteId } = {}) {
  const map = new Map();
  if (!Array.isArray(invites)) return map;
  for (const inv of invites) {
    if (!inv?.topic) continue;
    if (isGenericTopic(inv.topic)) continue;
    if (excludeInviteId && inv.id === excludeInviteId) continue;
    if (!ACTIVE_INVITE_STATUSES.has(inv.status)) continue;
    const key = inv.topic.trim().toLowerCase();
    if (!key) continue;
    const existing = map.get(key);
    if (!existing || (inv.dataAlvo || '') > (existing.dataAlvo || '')) {
      map.set(key, inv);
    }
  }
  return map;
}

/**
 * Compute the next Sunday from today.
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
export function getNextSunday() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = day === 0 ? 7 : 7 - day;
  const next = new Date(now);
  next.setDate(now.getDate() + diff);
  return toLocalISODate(next);
}

/**
 * Compute the next N Sundays starting from today (if today is Sunday) or from getNextSunday().
 * @param {number} n - how many Sundays to return (>=1)
 * @returns {string[]} array of ISO date strings (YYYY-MM-DD)
 */
export function getNextNSundays(n) {
  if (!Number.isInteger(n) || n <= 0) return [];
  const now = new Date();
  const startIso = now.getDay() === 0 ? toLocalISODate(now) : getNextSunday();
  const [y, m, d] = startIso.split('-').map(Number);
  return Array.from({ length: n }, (_, i) => toLocalISODate(new Date(y, m - 1, d + i * 7)));
}

/**
 * Days from today until the given ISO date (positive = future, negative = past, 0 = today).
 * Uses local-tz date math; never `new Date(isoString)` (which parses as UTC and
 * causes off-by-one in negative-UTC zones like Brazil at night).
 */
export function daysUntil(isoString) {
  if (!isoString) return null;
  const [y, m, d] = isoString.split('-').map(Number);
  if (!y) return null;
  const target = new Date(y, m - 1, d);
  target.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - now.getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Checks if a given ISO date (YYYY-MM-DD) is the first Sunday of its month.
 * In any month, the 1st Sunday always occurs between day 1 and day 7.
 * @param {string} isoString - ISO date string (YYYY-MM-DD)
 * @returns {boolean}
 */
export function isFirstSundayOfMonth(isoString) {
  if (!isoString || typeof isoString !== 'string') return false;
  const [y, m, d] = isoString.split('-').map(Number);
  if (!y || !m || !d) return false;
  if (d < 1 || d > 7) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCDay() === 0;
}

/**
 * Returns the default meeting mode ('test' | 'disc') for a given ISO date.
 * By default in LDS units, the first Sunday of the month is Fast and Testimony
 * ("Jejum e Testemunhos", mode='test'), and all other Sundays have speakers
 * ("Com Discursantes", mode='disc').
 * @param {string} isoString - ISO date string (YYYY-MM-DD)
 * @returns {'test' | 'disc'}
 */
export function getDefaultMeetingMode(isoString) {
  return isFirstSundayOfMonth(isoString) ? 'test' : 'disc';
}

