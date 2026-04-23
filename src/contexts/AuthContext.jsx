import { createContext, useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import {
  checkAllowedUser,
  createOrUpdateUser,
  getUser,
  isSuperAdminEmail,
} from '../services/users';
import { signOutUser } from '../services/auth';

export const AuthContext = createContext(null);

/**
 * AuthProvider manages:
 *  - Firebase auth state
 *  - allowedUsers allowlist check (Firestore)
 *  - users/{uid} metadata (unitId, role)
 *  - convenience flags (isAuthorized, isSuperAdmin)
 */
export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authState, setAuthState] = useState('loading'); // loading | unauth | denied | ok
  const [deniedEmail, setDeniedEmail] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setFirebaseUser(null);
        setUserData(null);
        setAuthState('unauth');
        setDeniedEmail(null);
        return;
      }

      setFirebaseUser(fbUser);

      const email = fbUser.email;
      const superadmin = isSuperAdminEmail(email);
      let allowed = await checkAllowedUser(email);

      // Superadmin is always allowed even without an allowedUsers record.
      if (!allowed && superadmin) {
        allowed = { unitId: '2322846', role: 'superadmin' };
      }

      if (!allowed) {
        setDeniedEmail(email);
        setAuthState('denied');
        await signOutUser().catch(() => {});
        setFirebaseUser(null);
        setUserData(null);
        return;
      }

      // Upsert users/{uid} with the authoritative role + unitId from allowedUsers
      await createOrUpdateUser(fbUser.uid, {
        email,
        displayName: fbUser.displayName || null,
        unitId: allowed.unitId,
        role: superadmin ? 'superadmin' : allowed.role || 'user',
      });

      const fresh = await getUser(fbUser.uid);
      setUserData(fresh);
      setDeniedEmail(null);
      setAuthState('ok');
    });
    return () => unsub();
  }, []);

  const value = useMemo(
    () => ({
      firebaseUser,
      userData,
      authState,
      deniedEmail,
      isSuperAdmin:
        userData?.role === 'superadmin' || isSuperAdminEmail(firebaseUser?.email),
      userRole: userData?.role || 'user',
      isAuthorized: authState === 'ok',
      loading: authState === 'loading',
    }),
    [firebaseUser, userData, authState, deniedEmail],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
