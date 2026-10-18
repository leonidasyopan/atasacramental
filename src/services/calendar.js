import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const LS_CALENDAR_KEY = (unitId) => `ata_calendar_${unitId}`;

export const DEFAULT_CALENDAR_SETTINGS = {
  autoGeneralConference: true,
  specialSundays: [],
};

/**
 * Loads calendar settings for a unit (auto General Conference, custom special Sundays).
 * Uses localStorage cache for instant render.
 * @param {string} unitId
 * @returns {Promise<{ autoGeneralConference: boolean, specialSundays: Array }>}
 */
export async function getCalendarSettings(unitId) {
  if (!unitId) return DEFAULT_CALENDAR_SETTINGS;

  try {
    const snap = await getDoc(doc(db, 'units', unitId, 'settings', 'calendar'));
    if (snap.exists()) {
      const data = { ...DEFAULT_CALENDAR_SETTINGS, ...snap.data() };
      try {
        localStorage.setItem(LS_CALENDAR_KEY(unitId), JSON.stringify(data));
      } catch {
        /* ignore localStorage quota/disabled */
      }
      return data;
    }
  } catch (err) {
    console.warn('Failed to load calendar settings from Firestore, using cache if available:', err);
  }

  // Fallback to localStorage cache
  try {
    const cached = localStorage.getItem(LS_CALENDAR_KEY(unitId));
    if (cached) return JSON.parse(cached);
  } catch {
    /* ignore parse error */
  }

  return DEFAULT_CALENDAR_SETTINGS;
}

/**
 * Saves calendar settings for a unit.
 * @param {string} unitId
 * @param {object} settings
 */
export async function saveCalendarSettings(unitId, settings) {
  if (!unitId || !settings) return;
  const payload = {
    autoGeneralConference: settings.autoGeneralConference !== false,
    specialSundays: Array.isArray(settings.specialSundays) ? settings.specialSundays : [],
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'units', unitId, 'settings', 'calendar'), payload, { merge: true });

  try {
    localStorage.setItem(LS_CALENDAR_KEY(unitId), JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

/**
 * Adds or updates a special Sunday date.
 * @param {string} unitId
 * @param {{ date: string, type?: string, title?: string, notes?: string }} specialSunday
 */
export async function addSpecialSunday(unitId, { date, type = 'stake_conference', title, notes = '' }) {
  if (!unitId || !date) return;
  const current = await getCalendarSettings(unitId);
  const existingList = (current.specialSundays || []).filter((s) => s.date !== date);

  const defaultTitle = type === 'stake_conference'
    ? 'Conferência de Estaca'
    : type === 'general_conference'
    ? 'Conferência Geral'
    : 'Sem Reunião Sacramental';

  const updatedList = [
    ...existingList,
    {
      date,
      type,
      title: title?.trim() || defaultTitle,
      notes: notes?.trim() || '',
    },
  ].sort((a, b) => a.date.localeCompare(b.date));

  await saveCalendarSettings(unitId, {
    ...current,
    specialSundays: updatedList,
  });
}

/**
 * Removes a special Sunday by date.
 * @param {string} unitId
 * @param {string} date
 */
export async function removeSpecialSunday(unitId, date) {
  if (!unitId || !date) return;
  const current = await getCalendarSettings(unitId);
  const updatedList = (current.specialSundays || []).filter((s) => s.date !== date);
  await saveCalendarSettings(unitId, {
    ...current,
    specialSundays: updatedList,
  });
}
