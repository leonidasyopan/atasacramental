import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBJDVSlfrjeG-YDO7gVpGQ08g2dlFOqyzQ',
  authDomain: 'sacramentalmeeting.firebaseapp.com',
  projectId: 'sacramentalmeeting',
  storageBucket: 'sacramentalmeeting.firebasestorage.app',
  messagingSenderId: '172425824852',
  appId: '1:172425824852:web:0b8fac958975086092fbc1',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
auth.languageCode = 'pt';

export const db = getFirestore(app);

// Offline cache — reduces Firestore reads (cost-effective) and enables offline use.
// Fails silently if opened in multiple tabs or unsupported browsers.
enableIndexedDbPersistence(db).catch(() => {
  // Expected failure modes: multi-tab, unsupported browser. Non-fatal.
});

export default app;
