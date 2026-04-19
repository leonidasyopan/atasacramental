import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const SUPERADMIN_EMAIL = 'leonidasyopan@gmail.com';

/**
 * Check whether an email is in the allowedUsers collection.
 * Returns the allowedUser data if present, otherwise null.
 */
export async function checkAllowedUser(email) {
  if (!email) return null;
  const key = email.trim().toLowerCase();
  const snap = await getDoc(doc(db, 'allowedUsers', key));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Create or update the per-user record (users/{uid}).
 * Called at login to keep metadata up-to-date with the allowedUsers configuration.
 */
export async function createOrUpdateUser(uid, data) {
  const ref = doc(db, 'users', uid);
  const existing = await getDoc(ref);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  if (!existing.exists()) payload.createdAt = serverTimestamp();
  await setDoc(ref, payload, { merge: true });
}

export async function getUser(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getAllUsers() {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAllAllowedUsers() {
  const snap = await getDocs(collection(db, 'allowedUsers'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addAllowedUser(email, unitId, role = 'user') {
  const key = email.trim().toLowerCase();
  await setDoc(doc(db, 'allowedUsers', key), {
    email: key,
    unitId,
    role,
    updatedAt: serverTimestamp(),
  });
}

export async function removeAllowedUser(email) {
  const key = email.trim().toLowerCase();
  await deleteDoc(doc(db, 'allowedUsers', key));
}

export function isSuperAdminEmail(email) {
  return (email || '').trim().toLowerCase() === SUPERADMIN_EMAIL;
}
