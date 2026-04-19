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
  return snap.exists() ? snap.data() : {};
}

export async function saveUnitSettings(unitId, settings) {
  await setDoc(
    doc(db, 'units', unitId, 'settings', 'memory'),
    { ...settings, updatedAt: serverTimestamp() },
    { merge: true },
  );
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
