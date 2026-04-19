import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../config/firebase';

function speakerLogRef(unitId) {
  return collection(db, 'units', unitId, 'speakerLog');
}

export async function getSpeakerLog(unitId, { max = 500 } = {}) {
  const q = query(speakerLogRef(unitId), orderBy('data', 'desc'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getMemberSpeakingHistory(unitId, memberName) {
  const q = query(
    speakerLogRef(unitId),
    where('name', '==', memberName),
    orderBy('data', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
