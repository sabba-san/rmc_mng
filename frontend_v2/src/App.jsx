import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import GrantsPage from './pages/GrantsPage';
import NewGrantPage from './pages/NewGrantPage';
import GrantDetailPage from './pages/GrantDetailPage';
import MilestonesPage from './pages/MilestonesPage';
import OutputsPage from './pages/OutputsPage';
import DocumentsPage from './pages/DocumentsPage';
import LandingPage from './pages/LandingPage';
import { Spinner } from './components/UI';
import AppLayout from './components/AppLayout';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
      <Route path="/grants" element={<ProtectedRoute><AppLayout><GrantsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/grants/new" element={<ProtectedRoute roles={['researcher']}><AppLayout><NewGrantPage /></AppLayout></ProtectedRoute>} />
      <Route path="/grants/:id" element={<ProtectedRoute><AppLayout><GrantDetailPage /></AppLayout></ProtectedRoute>} />
      <Route path="/grants/:id/edit" element={<ProtectedRoute roles={['researcher']}><AppLayout><NewGrantPage editMode /></AppLayout></ProtectedRoute>} />
      <Route path="/milestones" element={<ProtectedRoute><AppLayout><MilestonesPage /></AppLayout></ProtectedRoute>} />
      <Route path="/outputs" element={<ProtectedRoute><AppLayout><OutputsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><AppLayout><DocumentsPage /></AppLayout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
