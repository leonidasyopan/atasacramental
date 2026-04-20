import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import DeniedPage from './pages/DeniedPage';
import AtaFormPage from './pages/AtaFormPage';
import AtaHistoryPage from './pages/AtaHistoryPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminUnitsPage from './pages/admin/AdminUnitsPage';
import AdminMembersPage from './pages/admin/AdminMembersPage';
import AdminAllUsersPage from './pages/admin/AdminAllUsersPage';
import ProtectedRoute from './components/layout/ProtectedRoute';

function LoadingScreen() {
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-spinner-large" />
        <p className="auth-loading-text">Carregando...</p>
      </div>
    </div>
  );
}

export default function App() {
  const { authState } = useAuth();

  if (authState === 'loading') return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/denied" element={<DeniedPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<AtaFormPage />} />
        <Route path="/historico" element={<AtaHistoryPage />} />
        <Route path="/historico/:id" element={<Navigate to="editar" replace />} />
        <Route path="/historico/:id/editar" element={<AtaFormPage editMode />} />
      </Route>

      <Route element={<ProtectedRoute requireSuperAdmin />}>
        <Route path="/admin/allowed-users" element={<AdminUsersPage />} />
        <Route path="/admin/unit" element={<AdminUnitsPage />} />
        <Route path="/admin/members" element={<AdminMembersPage />} />
        <Route path="/admin/users" element={<AdminAllUsersPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
