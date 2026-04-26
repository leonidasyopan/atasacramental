/**
 * Pure helper functions for the speaker management module.
 * No Firebase dependencies — safe to use anywhere.
 */

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });

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
  const cutoffISO = cutoff.toISOString().slice(0, 10);
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
 * Filter invites that are upcoming (dataAlvo >= today) and
 * have status 'pendente' or 'aceito'.
 */
export function getUpcomingInvites(invites) {
  if (!Array.isArray(invites)) return [];
  const today = new Date().toISOString().slice(0, 10);
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
  return next.toISOString().slice(0, 10);
}
