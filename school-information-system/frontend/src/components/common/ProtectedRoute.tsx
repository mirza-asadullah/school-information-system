import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { LoadingScreen } from './LoadingScreen';

interface ProtectedRouteProps {
  children: JSX.Element;
}

/**
 * ProtectedRoute Component
 *
 * Protects routes from unauthenticated access:
 * 1. If loading: Show loading screen (auth state restoration in progress)
 * 2. If no token: Redirect to login
 * 3. If authenticated: Render children
 *
 * Usage:
 * ```
 * <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
 * ```
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { token, status } = useAppSelector((state) => state.auth);

  // Show loading screen while auth state is being restored
  if (status === 'loading') {
    return <LoadingScreen />;
  }

  // Redirect to login if not authenticated
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Render protected content
  return children;
}
