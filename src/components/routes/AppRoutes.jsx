import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loader from '../common/Loader';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../pages/auth/LoginPage';
import SupervisorLayout from '../layouts/SupervisorLayout';
import TeacherLayout from '../layouts/TeacherLayout';

// Supervisor Pages
import SupervisorDashboard from '../pages/supervisor/SupervisorDashboard';
import TeachersPage from '../pages/supervisor/TeachersPage';
import SupervisionsPage from '../pages/supervisor/SupervisionsPage';
import SupervisionCreatePage from '../pages/supervisor/SupervisionCreatePage';
import SupervisionWorkspacePage from '../pages/supervisor/SupervisionWorkspacePage';
import HistoryPage from '../pages/supervisor/HistoryPage';
import SchoolSettingsPage from '../pages/supervisor/SchoolSettingsPage';

// Teacher Pages
import TeacherDashboard from '../pages/teacher/TeacherDashboard';
import TeacherSupervisionDetailPage from '../pages/teacher/TeacherSupervisionDetailPage';

function RootRedirect() {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return <Loader fullScreen text="Menyiapkan SuperVisiPro..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <Navigate
      to={role === 'supervisor' ? '/supervisor/dashboard' : '/teacher/dashboard'}
      replace
    />
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Route Khusus Kepala Sekolah / Supervisor */}
      <Route element={<ProtectedRoute allowedRoles={['supervisor']} />}>
        <Route path="/supervisor" element={<SupervisorLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SupervisorDashboard />} />
          <Route path="teachers" element={<TeachersPage />} />
          <Route path="supervisions" element={<SupervisionsPage />} />
          <Route path="supervisions/new" element={<SupervisionCreatePage />} />
          <Route path="supervisions/:id" element={<SupervisionWorkspacePage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="school" element={<SchoolSettingsPage />} />
        </Route>
      </Route>

      {/* Route Khusus Guru */}
      <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="supervisions" element={<TeacherDashboard />} />
          <Route path="supervisions/:id" element={<TeacherSupervisionDetailPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}