import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

function membersRef(unitId) {
  return collection(db, 'units', unitId, 'members');
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
