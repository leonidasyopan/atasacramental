import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export function recognitionSettingsRef(unitId) {
  return doc(db, 'units', unitId, 'settings', 'recognitions');
}

/**
 * Normalizes an array of recognition suggestions, ensuring uniqueness (case-insensitive by name)
 * and sorting alphabetically using pt-BR collation.
 * Each entry is normalized to { name: string, calling: string }.
 */
export function normalizeRecognitionSuggestions(list) {
  if (!Array.isArray(list)) return [];
  const map = new Map();

  for (const item of list) {
    let name = '';
    let calling = '';

    if (typeof item === 'string') {
      name = item.trim();
    } else if (Array.isArray(item)) {
      name = String(item[0] || '').trim();
      calling = String(item[1] || '').trim();
    } else if (item && typeof item === 'object') {
      name = String(item.name || '').trim();
      calling = String(item.calling || '').trim();
    }

    if (!name) continue;

    const key = name.toLowerCase();
    if (!map.has(key)) {
      map.set(key, { name, calling });
    } else if (calling) {
      // If existing had no calling but this one does, update calling
      const existing = map.get(key);
      if (!existing.calling) {
        existing.calling = calling;
      }
    }
  }

  const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });
  return Array.from(map.values()).sort((a, b) => collator.compare(a.name, b.name));
}

/**
 * Fetches saved recognition suggestions for the unit from units/{unitId}/settings/recognitions.
 * Returns empty array if none exists (cold start).
 */
export async function getRecognitionSuggestions(unitId) {
  if (!unitId) return [];

  try {
    const snap = await getDoc(recognitionSettingsRef(unitId));
    if (snap.exists()) {
      const data = snap.data();
      return normalizeRecognitionSuggestions(data?.recognitions || []);
    }
  } catch (err) {
    console.warn('Falha ao carregar configurações de reconhecimentos:', err);
  }

  return [];
}

/**
 * Merges new recognition entries into the unit's recognition directory and saves to Firestore.
 * Performs a dirty check to avoid redundant Firestore writes.
 */
export async function saveRecognitionSuggestions(unitId, newEntries, currentSuggestions = null) {
  if (!unitId || !Array.isArray(newEntries) || newEntries.length === 0) {
    return currentSuggestions || [];
  }

  let baseList = currentSuggestions;
  if (!baseList) {
    baseList = await getRecognitionSuggestions(unitId);
  }

  const formattedNew = newEntries.map((e) => {
    if (Array.isArray(e)) {
      return { name: e[0] || '', calling: e[1] || '' };
    }
    if (typeof e === 'string') {
      return { name: e, calling: '' };
    }
    return { name: e?.name || '', calling: e?.calling || '' };
  });

  const merged = normalizeRecognitionSuggestions([...baseList, ...formattedNew]);

  // Dirty check: only write if length or any entry changed
  const isDirty =
    merged.length !== baseList.length ||
    merged.some(
      (m, i) => m.name !== baseList[i]?.name || m.calling !== baseList[i]?.calling
    );

  if (isDirty) {
    await setDoc(
      recognitionSettingsRef(unitId),
      { recognitions: merged, updatedAt: serverTimestamp() },
      { merge: true },
    );
  }

  return merged;
}

/**
 * Removes a recognition suggestion by name from the directory and updates Firestore.
 */
export async function deleteRecognitionSuggestion(unitId, nameToDelete, currentSuggestions = null) {
  if (!unitId || !nameToDelete) return currentSuggestions || [];

  let baseList = currentSuggestions;
  if (!baseList) {
    baseList = await getRecognitionSuggestions(unitId);
  }

  const targetKey = String(nameToDelete).trim().toLowerCase();
  const filtered = baseList.filter((item) => item.name.trim().toLowerCase() !== targetKey);

  // Dirty check: skip write if target was not found in base list
  if (filtered.length === baseList.length) {
    return baseList;
  }

  await setDoc(
    recognitionSettingsRef(unitId),
    { recognitions: filtered, updatedAt: serverTimestamp() },
    { merge: true },
  );

  return filtered;
}
