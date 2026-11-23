import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loader from '../common/Loader';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen text="Memverifikasi sesi pengguna..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    const fallback =
      role === 'supervisor' ? '/supervisor/dashboard' : '/teacher/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}