import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { restoreAuthState } from '../store/slices/authSlice';
import { LoadingScreen } from './common/LoadingScreen';

interface AuthInitializerProps {
  children: JSX.Element;
}

/**
 * AuthInitializer Component
 * 
 * Wraps the application to:
 * 1. Restore authentication state on app initialization
 * 2. Check if JWT token exists in localStorage
 * 3. Validate token by attempting to fetch user profile
 * 4. Restore user data to Redux state if valid
 * 5. Show loading screen while restoring auth state
 * 
 * Usage: Wrap App component or render in main.tsx
 */
export function AuthInitializer({ children }: AuthInitializerProps) {
  const dispatch = useAppDispatch();
  const { status } = useAppSelector((state) => state.auth);
  const isInitialized = status !== 'idle' || localStorage.getItem('sis_access_token') === null;

  useEffect(() => {
    dispatch(restoreAuthState());
  }, [dispatch]);

 if (status === 'loading') {
  return <LoadingScreen />;
}


  return children;
}
