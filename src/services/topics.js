import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

function topicsDocRef(unitId) {
  return doc(db, 'units', unitId, 'settings', 'discourseTopics');
}

export async function getDiscourseTopics(unitId) {
  const snap = await getDoc(topicsDocRef(unitId));
  return snap.exists() ? (snap.data().topics || []) : [];
}

export async function saveDiscourseTopics(unitId, topics) {
  await setDoc(topicsDocRef(unitId), {
    topics: topics.filter((t) => t.trim()),
    updatedAt: serverTimestamp(),
  });
}
