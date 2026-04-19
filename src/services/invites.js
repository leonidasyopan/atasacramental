import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

function invitesRef(unitId) {
  return collection(db, 'units', unitId, 'discourseInvites');
}

export async function createInvite(unitId, invite) {
  const ref = await addDoc(invitesRef(unitId), {
    ...invite,
    status: invite.status || 'pendente',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getInvites(unitId, { status = null } = {}) {
  const q = status
    ? query(invitesRef(unitId), where('status', '==', status), orderBy('dataAlvo'))
    : query(invitesRef(unitId), orderBy('dataAlvo', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateInviteStatus(unitId, inviteId, status) {
  await updateDoc(doc(invitesRef(unitId), inviteId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function updateInvite(unitId, inviteId, data) {
  await updateDoc(doc(invitesRef(unitId), inviteId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
