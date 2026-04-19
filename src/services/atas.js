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
  return { id: d.id, ...d.data() };
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
    ...data,
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
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
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
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
    ...data,
    updatedAt: serverTimestamp(),
  });
}
