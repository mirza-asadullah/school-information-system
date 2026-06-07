import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppSelector } from '../../store/hooks';
import { LoadingScreen } from './LoadingScreen';

interface PublicRouteProps {
  children: JSX.Element;
}

/**
 * Redirects authenticated users away from public pages (like login).
 * Prevents authenticated users from accessing login page.
 */
export function PublicRoute({ children }: PublicRouteProps) {
  const navigate = useNavigate();
  const { token, status } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [token, navigate]);

  if (status === 'loading' && !token) {
    return <LoadingScreen />;
  }

  if (token) {
    return null;
  }

  return children;
}
