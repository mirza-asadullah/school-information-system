import { useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { restoreAuthState } from '../store/slices/authSlice';

/**
 * AppInitializer Hook
 * 
 * Call this hook once in your app root (e.g., in App.tsx useEffect).
 * Handles:
 * 1. Restoring auth state from localStorage on app initialization
 * 2. Validating JWT token with backend
 * 3. Redirecting to login if token is invalid
 * 
 * Usage:
 * ```
 * function App() {
 *   useAppInitializer();
 *   return <AppRoutes />;
 * }
 * ```
 */
export function useAppInitializer() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(restoreAuthState());
  }, [dispatch]);
}
