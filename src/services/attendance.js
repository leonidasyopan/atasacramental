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
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Attendance is stored under `units/{unitId}/attendance/{YYYY-MM-DD}`.
 * A single document holds both the "simple" (aggregate count) and
 * the "detailed" (per-member + visitors) tallies so the Ata can merge
 * them at display time.
 */

export function attendanceRef(unitId) {
  return collection(db, 'units', unitId, 'attendance');
}

function attendanceDocRef(unitId, date) {
  return doc(attendanceRef(unitId), date);
}

function householdDocRef(unitId, householdId) {
  return doc(db, 'units', unitId, 'households', householdId);
}

export async function getAttendance(unitId, date) {
  if (!unitId || !date) return null;
  const snap = await getDoc(attendanceDocRef(unitId, date));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function saveSimpleCount(unitId, date, count, uid) {
  if (!unitId || !date) throw new Error('unitId e date são obrigatórios.');
  const safeCount = Number.isFinite(Number(count)) ? Number(count) : 0;
  const ref = attendanceDocRef(unitId, date);
  const existing = await getDoc(ref);
  const payload = {
    date,
    simpleCount: safeCount,
    simpleCountBy: uid || null,
    simpleCountAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (!existing.exists()) payload.createdAt = serverTimestamp();
  await setDoc(ref, payload, { merge: true });
}

export async function saveDetailedAttendance(
  unitId,
  date,
  { presentMemberIds, visitors, detailedTotal },
  uid,
) {
  if (!unitId || !date) throw new Error('unitId e date são obrigatórios.');
  const ids = Array.isArray(presentMemberIds) ? presentMemberIds : [];
  const visitorEntries = normalizeVisitors(visitors);
  const total = Number.isFinite(Number(detailedTotal))
    ? Number(detailedTotal)
    : ids.length + sumVisitorCount(visitorEntries);

  const ref = attendanceDocRef(unitId, date);
  const existing = await getDoc(ref);
  const payload = {
    date,
    presentMemberIds: ids,
    visitors: visitorEntries,
    detailedTotal: total,
    detailedCountBy: uid || null,
    detailedCountAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (!existing.exists()) payload.createdAt = serverTimestamp();
  await setDoc(ref, payload, { merge: true });
}

export async function markHouseholdsIncremented(unitId, date, value = true) {
  if (!unitId || !date) return;
  await setDoc(
    attendanceDocRef(unitId, date),
    { householdsIncremented: value },
    { merge: true },
  );
}

export async function getRecentAttendances(unitId, max = 12) {
  if (!unitId) return [];
  const q = query(
    attendanceRef(unitId),
    orderBy('date', 'desc'),
    limitFn(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Atomically increment `attendanceCount` on each household so future
 * Detailed Attendance screens can sort the most frequent families first.
 */
export async function incrementHouseholdAttendance(unitId, householdIds) {
  if (!unitId) return;
  const unique = Array.from(
    new Set((householdIds || []).filter(Boolean)),
  );
  if (unique.length === 0) return;
  const batch = writeBatch(db);
  for (const id of unique) {
    batch.set(
      householdDocRef(unitId, id),
      {
        attendanceCount: increment(1),
        lastAttendanceAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }
  await batch.commit();
}

function normalizeVisitors(visitors) {
  if (!Array.isArray(visitors)) return [];
  return visitors
    .map((v) => {
      const description = String(v?.description || '').trim();
      const count = Number(v?.count);
      if (!description || !Number.isFinite(count) || count <= 0) return null;
      return { description, count: Math.floor(count) };
    })
    .filter(Boolean);
}

function sumVisitorCount(visitors) {
  return (visitors || []).reduce((sum, v) => sum + (Number(v?.count) || 0), 0);
}

export function visitorsTotal(visitors) {
  return sumVisitorCount(normalizeVisitors(visitors));
}
