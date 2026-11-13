import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Wraps any route that requires authentication.
 * Preserves the attempted path so the user is redirected back after login.
 */
export default function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user, isAdmin } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role) {
    const isAdminRole = role === 'admin' || role === 'ADMIN';

    if (isAdminRole && !isAdmin) {
      return <Navigate to="/" replace />;
    }
    if (!isAdminRole && user?.role !== role) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
