import { useEffect } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { restoreAuthState } from './store/slices/authSlice';
import { AppRoutes } from './routes/AppRoutes';
import { theme } from './theme/theme';
import { LoadingScreen } from './components/common/LoadingScreen';

/**
 * Main App Component
 *
 * Responsibilities:
 * 1. Initialize auth state from localStorage on app load
 * 2. Provide theme context
 * 3. Show loading screen while restoring auth
 * 4. Render routes once auth state is ready
 */
function App() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state) => state.theme.mode);
  const { status } = useAppSelector((state) => state.auth);

  /**
   * Effect: Restore authentication state on app initialization.
   * Checks localStorage for JWT token and validates it with backend.
   */
  useEffect(() => {
    dispatch(restoreAuthState());
  }, [dispatch]);

  // Show loading screen while auth state is being restored
  if (status === 'loading') {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider theme={theme(mode)}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <AppRoutes />
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
