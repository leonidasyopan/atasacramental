import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit as limitFn,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export function visitorSettingsRef(unitId) {
  return doc(db, 'units', unitId, 'settings', 'visitors');
}

export function attendanceRef(unitId) {
  return collection(db, 'units', unitId, 'attendance');
}

/**
 * Normalizes an array of visitor suggestions, ensuring uniqueness (case-insensitive)
 * and sorting alphabetically using pt-BR collation.
 */
export function normalizeVisitorSuggestions(list) {
  if (!Array.isArray(list)) return [];
  const map = new Map();

  for (const item of list) {
    const name = typeof item === 'string'
      ? item.trim()
      : String(item?.name || item?.description || '').trim();
    if (!name) continue;

    const rawCount = typeof item === 'object'
      ? Number(item?.count ?? item?.defaultCount)
      : 1;
    const count = Number.isFinite(rawCount) && rawCount > 0
      ? Math.floor(rawCount)
      : 1;

    const key = name.toLowerCase();
    if (!map.has(key)) {
      map.set(key, { name, count });
    } else {
      const existing = map.get(key);
      if (existing.count === 1 && count > 1) {
        existing.count = count;
      }
    }
  }

  const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });
  return Array.from(map.values()).sort((a, b) => collator.compare(a.name, b.name));
}

/**
 * Fetches saved visitor suggestions for the unit.
 * Checks unit settings document first. If none exists (cold start / migration),
 * falls back to harvesting unique visitors from past attendances and primes settings.
 */
export async function getVisitorSuggestions(unitId) {
  if (!unitId) return [];

  let settingsDocFound = false;
  try {
    const snap = await getDoc(visitorSettingsRef(unitId));
    if (snap.exists()) {
      settingsDocFound = true;
      const data = snap.data();
      return normalizeVisitorSuggestions(data?.visitors || []);
    }
  } catch (err) {
    console.warn('Falha ao carregar configurações de visitantes:', err);
  }

  // Cold start fallback: harvest visitors from past attendances if settings doc does not exist
  if (!settingsDocFound) {
    try {
      const q = query(attendanceRef(unitId), orderBy('date', 'desc'), limitFn(52));
      const snap = await getDocs(q);
      const harvested = [];

      for (const d of snap.docs) {
        const data = d.data();
        if (Array.isArray(data.visitors)) {
          for (const v of data.visitors) {
            const desc = String(v?.description || '').trim();
            const count = Number(v?.count) || 1;
            if (desc) harvested.push({ name: desc, count });
          }
        }
      }

      const normalized = normalizeVisitorSuggestions(harvested);
      // Prime settings document so future calls perform a single read
      try {
        await setDoc(
          visitorSettingsRef(unitId),
          { visitors: normalized, updatedAt: serverTimestamp() },
          { merge: true },
        );
      } catch {
        // Priming is best-effort
      }
      return normalized;
    } catch (err) {
      console.warn('Falha ao coletar visitantes anteriores no cold start:', err);
    }
  }

  return [];
}

/**
 * Merges new visitor entries into the unit's visitor directory and saves to Firestore.
 * Performs a dirty check to avoid redundant Firestore writes.
 */
export async function saveVisitorSuggestions(unitId, newEntries, currentSuggestions = null) {
  if (!unitId || !Array.isArray(newEntries) || newEntries.length === 0) {
    return currentSuggestions || [];
  }

  let baseList = currentSuggestions;
  if (!baseList) {
    baseList = await getVisitorSuggestions(unitId);
  }

  const formattedNew = newEntries.map((e) => ({
    name: typeof e === 'string' ? e : e?.description || e?.name,
    count: typeof e === 'object' ? (e?.count ?? e?.defaultCount) : 1,
  }));

  const merged = normalizeVisitorSuggestions([...baseList, ...formattedNew]);

  // Dirty check: only write if names or counts changed
  const isDirty = merged.length !== baseList.length ||
    merged.some((m, i) => m.name !== baseList[i]?.name || m.count !== baseList[i]?.count);

  if (isDirty) {
    await setDoc(
      visitorSettingsRef(unitId),
      { visitors: merged, updatedAt: serverTimestamp() },
      { merge: true },
    );
  }

  return merged;
}

/**
 * Removes a visitor by name from the suggestions directory and updates Firestore.
 */
export async function deleteVisitorSuggestion(unitId, nameToDelete, currentSuggestions = null) {
  if (!unitId || !nameToDelete) return currentSuggestions || [];

  let baseList = currentSuggestions;
  if (!baseList) {
    baseList = await getVisitorSuggestions(unitId);
  }

  const targetKey = String(nameToDelete).trim().toLowerCase();
  const filtered = baseList.filter((item) => item.name.trim().toLowerCase() !== targetKey);

  // Dirty check: skip write if target was not found in base list
  if (filtered.length === baseList.length) {
    return baseList;
  }

  await setDoc(
    visitorSettingsRef(unitId),
    { visitors: filtered, updatedAt: serverTimestamp() },
    { merge: true },
  );

  return filtered;
}
