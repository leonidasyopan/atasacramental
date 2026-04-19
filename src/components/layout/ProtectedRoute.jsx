import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ProtectedRoute({ requireSuperAdmin = false }) {
  const { authState, isSuperAdmin } = useAuth();
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
  return <Outlet />;
}
