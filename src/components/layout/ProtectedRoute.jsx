import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AppSidebar from './AppSidebar';

export default function ProtectedRoute({
  requireSuperAdmin = false,
  allowedRoles = null,
}) {
  const { authState, isSuperAdmin, userData } = useAuth();
  const location = useLocation();

  if (authState === 'loading') return null;
  if (authState === 'unauth') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (authState === 'denied') {
    return <Navigate to="/denied" replace />;
  }
  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !isSuperAdmin) {
    const userRole = userData?.role || 'user';
    if (!allowedRoles.includes(userRole)) {
      const fallback = userRole === 'music' ? '/discursantes' : '/frequencia/simples';
      return <Navigate to={fallback} replace />;
    }
  }

  return (
    <>
      <AppSidebar />
      <Outlet />
    </>
  );
}
