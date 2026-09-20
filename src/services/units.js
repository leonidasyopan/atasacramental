import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getRecentFinalized } from './atas';

export async function getUnit(unitId) {
  const snap = await getDoc(doc(db, 'units', unitId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateUnit(unitId, data) {
  await setDoc(
    doc(db, 'units', unitId),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function getUnitSettings(unitId) {
  const snap = await getDoc(doc(db, 'units', unitId, 'settings', 'memory'));
  return snap.exists() ? snap.data() : null;
}

export async function saveUnitSettings(unitId, settings) {
  if (!unitId || !settings) return;
  const cleanSettings = {};
  for (const [k, v] of Object.entries(settings)) {
    if (v !== undefined) {
      cleanSettings[k] = v;
    }
  }
  if (Object.keys(cleanSettings).length === 0) return;
  await setDoc(
    doc(db, 'units', unitId, 'settings', 'memory'),
    { ...cleanSettings, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/**
 * Retrieve the last used music leaders (Regente de Música and Pianista / Organista).
 * Checks unit settings memory first, falling back to recent finalized atas only on cold start.
 */
export async function getLastUsedMusicLeaders(unitId) {
  if (!unitId) return { regente: '', pianista: '' };
  let regente = '';
  let pianista = '';
  let memoryExists = false;

  try {
    const memory = await getUnitSettings(unitId);
    if (memory) {
      memoryExists = true;
      if (memory.regente) regente = memory.regente;
      if (memory.pianista) pianista = memory.pianista;
    }
  } catch (err) {
    console.warn('Failed to load unit settings memory:', err);
  }

  // Fallback to recent finalized atas only if memory document does not exist yet (cold start / migration)
  if (!memoryExists) {
    try {
      const recentAtas = await getRecentFinalized(unitId, 5);
      for (const ata of recentAtas) {
        if (!regente && ata.regente) regente = ata.regente;
        if (!pianista && ata.pianista) pianista = ata.pianista;
        if (regente && pianista) break;
      }
      // Prime memory document so future calls perform a single read and don't query recent atas again
      if (regente || pianista) {
        saveUnitSettings(unitId, { regente, pianista }).catch(() => {});
      }
    } catch (err) {
      console.warn('Failed to inspect recent atas for music leaders:', err);
    }
  }

  return { regente, pianista };
}

// -------- Leaders (subcollection: units/{unitId}/leaders/) --------

export async function getLeaders(unitId) {
  if (!unitId) return [];
  const q = query(collection(db, 'units', unitId, 'leaders'), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addLeader(unitId, leader) {
  const ref = doc(collection(db, 'units', unitId, 'leaders'));
  await setDoc(ref, {
    name: leader.name,
    calling: leader.calling || '',
    phone: leader.phone || '',
    order: leader.order ?? 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateLeader(unitId, leaderId, data) {
  await setDoc(
    doc(db, 'units', unitId, 'leaders', leaderId),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function deleteLeader(unitId, leaderId) {
  await deleteDoc(doc(db, 'units', unitId, 'leaders', leaderId));
}
