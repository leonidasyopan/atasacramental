import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';

function atasRef(unitId) {
  return collection(db, 'units', unitId, 'atas');
}

function speakerLogRef(unitId) {
  return collection(db, 'units', unitId, 'speakerLog');
}

/**
 * Firestore does not support nested arrays (array of arrays). The dynamic
 * tables in the form store rows as 2D arrays (e.g. `[[col0, col1, col2], ...]`).
 * These helpers convert every `rows*` field to/from an array of objects
 * keyed by column index (`[{c0, c1, c2}, ...]`) at the Firestore boundary,
 * keeping the in-memory shape unchanged for the UI.
 */
const ROW_FIELDS = ['rowsApoios', 'rowsOrd', 'rowsConf', 'rowsBencao', 'rowsDisc'];

function rowsToObjects(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => {
    const arr = Array.isArray(r) ? r : [];
    const obj = {};
    for (let i = 0; i < arr.length; i += 1) obj[`c${i}`] = arr[i] ?? '';
    return obj;
  });
}

function rowsToArrays(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => {
    if (Array.isArray(r)) return r;
    if (r && typeof r === 'object') {
      const keys = Object.keys(r)
        .filter((k) => /^c\d+$/.test(k))
        .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
      return keys.map((k) => r[k] ?? '');
    }
    return [];
  });
}

function serializeAtaForFirestore(data) {
  const out = { ...data };
  for (const key of ROW_FIELDS) {
    if (out[key] !== undefined) out[key] = rowsToObjects(out[key]);
  }
  return out;
}

function deserializeAtaFromFirestore(data) {
  if (!data || typeof data !== 'object') return data;
  const out = { ...data };
  for (const key of ROW_FIELDS) {
    if (out[key] !== undefined) out[key] = rowsToArrays(out[key]);
  }
  return out;
}

/**
 * Returns the current active draft for a unit, or null.
 * Policy: at most one draft at a time per unit.
 */
export async function getCurrentDraft(unitId) {
  const q = query(
    atasRef(unitId),
    where('status', '==', 'draft'),
    orderBy('updatedAt', 'desc'),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...deserializeAtaFromFirestore(d.data()) };
}

/**
 * Save the draft. Upserts into a single document per unit.
 * @param {string} unitId
 * @param {object} data - form fields
 * @param {string|null} existingId - if provided, updates; otherwise creates
 * @returns {Promise<string>} the draft document id
 */
export async function saveDraft(unitId, data, existingId = null) {
  const payload = {
    ...serializeAtaForFirestore(data),
    status: 'draft',
    updatedAt: serverTimestamp(),
  };
  if (existingId) {
    await setDoc(doc(atasRef(unitId), existingId), payload, { merge: true });
    return existingId;
  }
  const newRef = await addDoc(atasRef(unitId), {
    ...payload,
    createdAt: serverTimestamp(),
  });
  return newRef.id;
}

export async function getAta(unitId, ataId) {
  const snap = await getDoc(doc(atasRef(unitId), ataId));
  return snap.exists()
    ? { id: snap.id, ...deserializeAtaFromFirestore(snap.data()) }
    : null;
}

/**
 * List all finalized atas for a unit, most recent first.
 */
export async function getAtaHistory(unitId, { max = 200 } = {}) {
  const q = query(
    atasRef(unitId),
    where('status', '==', 'finalized'),
    orderBy('data', 'desc'),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...deserializeAtaFromFirestore(d.data()) }));
}

/**
 * Finalize an ata. Logs speaker entries if the meeting had discursantes.
 */
export async function finalizarAta(unitId, ataId, userId) {
  const ata = await getAta(unitId, ataId);
  if (!ata) throw new Error('Ata não encontrada.');
  if (ata.status === 'finalized') return ata;

  const batch = writeBatch(db);
  const ataDocRef = doc(atasRef(unitId), ataId);
  batch.update(ataDocRef, {
    status: 'finalized',
    finalizedAt: serverTimestamp(),
    finalizedBy: userId || null,
  });

  // If meeting had discursantes, log each speaker
  if (ata.mode === 'disc' && Array.isArray(ata.rowsDisc)) {
    const dataISO = ata.data || null;
    for (const row of ata.rowsDisc) {
      const [nome, tema, duracao] = row || [];
      if (!nome) continue;
      const entryRef = doc(speakerLogRef(unitId));
      batch.set(entryRef, {
        ataId,
        data: dataISO,
        name: nome,
        topic: tema || null,
        duration: duracao ? Number(duracao) : null,
        createdAt: serverTimestamp(),
      });
    }
  }

  await batch.commit();
  return getAta(unitId, ataId);
}

export async function deleteAta(unitId, ataId) {
  await deleteDoc(doc(atasRef(unitId), ataId));
}

export async function updateAtaFields(unitId, ataId, data) {
  await updateDoc(doc(atasRef(unitId), ataId), {
    ...serializeAtaForFirestore(data),
    updatedAt: serverTimestamp(),
  });
}
