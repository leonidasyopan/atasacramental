/**
 * Pure helper functions for the speaker management module.
 * No Firebase dependencies — safe to use anywhere.
 */

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });

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
 * Match a name against the members list (case-insensitive).
 * Compares against `m.name` and `m.fullName`.
 * @returns {string|null} member id or null
 */
export function findMemberId(name, members) {
  if (!name || !Array.isArray(members)) return null;
  const needle = name.trim().toLowerCase();
  for (const m of members) {
    if ((m.name || '').toLowerCase() === needle) return m.id;
    if ((m.fullName || '').toLowerCase() === needle) return m.id;
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

  // Build a map: memberId or name → most recent entry
  const lastSpeechMap = new Map();
  for (const entry of filtered) {
    const key = entry.memberId || entry.name;
    if (!key) continue;
    const existing = lastSpeechMap.get(key);
    if (!existing || (entry.data || '') > (existing.data || '')) {
      lastSpeechMap.set(key, entry);
    }
  }

  const neverSpoke = [];
  const alreadySpoke = [];

  for (const m of members) {
    if (m.active === false) continue;
    const byId = m.id ? lastSpeechMap.get(m.id) : null;
    const byName = m.name ? lastSpeechMap.get(m.name) : null;
    const lastSpeech = byId || byName || null;

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

    // If age is still unknown (undefined/null), treat as included by default
    if (age == null) return true;

    if (ageGroup === '18+') {
      return age >= 18;
    }
    if (ageGroup === '11+') {
      return age >= 11;
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
