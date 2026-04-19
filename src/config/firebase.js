import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

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

// Offline cache — reduces Firestore reads (cost-effective) and enables offline use.
// Uses the non-deprecated persistent cache API with multi-tab support.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export default app;
