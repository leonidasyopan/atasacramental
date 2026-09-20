import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  writeBatch,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

function membersRef(unitId) {
  return collection(db, 'units', unitId, 'members');
}

function householdsRef(unitId) {
  return collection(db, 'units', unitId, 'households');
}

export async function getHouseholds(unitId, { includeInactive = false } = {}) {
  const q = includeInactive
    ? query(householdsRef(unitId), orderBy('name'))
    : query(
        householdsRef(unitId),
        where('active', '==', true),
        orderBy('name'),
      );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getMembersByHousehold(unitId, householdId) {
  const q = query(
    membersRef(unitId),
    where('householdId', '==', householdId),
    orderBy('name'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getMembers(unitId, { includeInactive = false } = {}) {
  const q = includeInactive
    ? query(membersRef(unitId), orderBy('name'))
    : query(membersRef(unitId), where('active', '==', true), orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addMember(unitId, name) {
  const trimmed = (name || '').trim();
  if (!trimmed) throw new Error('Nome do membro é obrigatório.');
  const docRef = await addDoc(membersRef(unitId), {
    name: trimmed,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: docRef.id, name: trimmed, active: true };
}

export async function updateMember(unitId, memberId, data) {
  await updateDoc(doc(db, 'units', unitId, 'members', memberId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deactivateMember(unitId, memberId) {
  await updateMember(unitId, memberId, { active: false });
}

export async function activateMember(unitId, memberId) {
  await updateMember(unitId, memberId, { active: true });
}

/**
 * Batch-runner utility to safely commit Firestore writes in chunks below the 500 limit.
 */
class BatchRunner {
  constructor(firestoreDb, maxOps = 400) {
    this.db = firestoreDb;
    this.maxOps = maxOps;
    this.currentBatch = writeBatch(firestoreDb);
    this.count = 0;
  }

  async set(ref, data) {
    this.currentBatch.set(ref, data);
    this.count++;
    await this.checkCommit();
  }

  async update(ref, data) {
    this.currentBatch.update(ref, data);
    this.count++;
    await this.checkCommit();
  }

  async checkCommit() {
    if (this.count >= this.maxOps) {
      await this.currentBatch.commit();
      this.currentBatch = writeBatch(this.db);
      this.count = 0;
    }
  }

  async commit() {
    if (this.count > 0) {
      await this.currentBatch.commit();
      this.count = 0;
    }
  }
}

/**
 * Applies a differential synchronization payload of households and members
 * to Firestore using atomic chunked batches.
 *
 * Preserves existing document IDs to maintain referential integrity with
 * attendance records and speaker history.
 *
 * @param {string} unitId - Target unit ID
 * @param {object} diff - Result from computeDirectoryDiff()
 * @param {object} [options]
 * @param {boolean} [options.deactivateMissing=true] - Whether to soft-deactivate missing members
 * @returns {Promise<object>} Sync summary stats
 */
export async function syncDirectoryData(unitId, diff, options = {}) {
  if (!unitId) throw new Error('unitId é obrigatório para sincronização.');
  if (!diff) throw new Error('Objeto diff é obrigatório.');

  const { deactivateMissing = true } = options;
  const runner = new BatchRunner(db);

  // 1. Create new households and track their generated IDs
  const newHouseholdIds = new Map(); // ph.tempId -> newDocRef.id
  for (const h of diff.households?.toAdd || []) {
    const newHRef = doc(householdsRef(unitId));
    newHouseholdIds.set(h.tempId, newHRef.id);

    await runner.set(newHRef, {
      name: h.name,
      displayName: h.displayName || h.name,
      headNames: h.headNames || h.name,
      address: h.address || '',
      phone: h.phone || '',
      email: h.email || '',
      active: true,
      attendanceCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // 2. Update existing households
  for (const h of diff.households?.toUpdate || []) {
    const hRef = doc(db, 'units', unitId, 'households', h.id);
    await runner.update(hRef, {
      ...h.changes,
      updatedAt: serverTimestamp(),
    });
  }

  // 3. Create new members
  for (const m of diff.members?.toAdd || []) {
    const newMRef = doc(membersRef(unitId));

    // Resolve householdId: either newly created, matched existing, or existing property
    const resolvedHouseholdId =
      (m.tempHouseholdId && newHouseholdIds.get(m.tempHouseholdId)) ||
      (m.tempHouseholdId && diff.householdMatches?.get(m.tempHouseholdId)) ||
      m.householdId ||
      null;

    await runner.set(newMRef, {
      name: m.name,
      originalLcrName: m.originalLcrName || m.name,
      gender: m.gender || null,
      age: m.age != null ? m.age : null,
      birthDate: m.birthDate || null,
      phone: m.phone || '',
      email: m.email || '',
      householdId: resolvedHouseholdId,
      householdRole: m.householdRole || 'other',
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // 4. Update existing members
  for (const m of diff.members?.toUpdate || []) {
    const mRef = doc(db, 'units', unitId, 'members', m.id);

    const changes = { ...m.changes };
    if (changes.householdId && newHouseholdIds.has(changes.householdId)) {
      changes.householdId = newHouseholdIds.get(changes.householdId);
    } else if (changes.householdId && diff.householdMatches?.has(changes.householdId)) {
      changes.householdId = diff.householdMatches.get(changes.householdId);
    }

    await runner.update(mRef, {
      ...changes,
      updatedAt: serverTimestamp(),
    });
  }

  // 5. Soft-deactivate missing members if requested
  if (deactivateMissing && diff.members?.missing?.length > 0) {
    for (const m of diff.members.missing) {
      const mRef = doc(db, 'units', unitId, 'members', m.id);
      await runner.update(mRef, {
        active: false,
        updatedAt: serverTimestamp(),
      });
    }
  }

  // Commit any remaining operations in the final batch
  await runner.commit();

  return {
    householdsCreated: diff.households?.toAdd?.length || 0,
    householdsUpdated: diff.households?.toUpdate?.length || 0,
    membersCreated: diff.members?.toAdd?.length || 0,
    membersUpdated: diff.members?.toUpdate?.length || 0,
    membersDeactivated: deactivateMissing ? diff.members?.missing?.length || 0 : 0,
  };
}

