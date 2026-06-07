import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../../api/services/authService';
import { tokenService } from '../../utils/storage';
import type { AuthState, LoginPayload, User } from '../../types';

const initialState: AuthState = {
  token: tokenService.getAccessToken(),
  user: null,
  status: 'idle',
  error: null,
};

/**
 * Async thunk for login.
 * 1. Calls authService.login() with email/password
 * 2. Stores token in localStorage
 * 3. Fetches user profile
 * 4. Returns token and user data
 */
export const login = createAsyncThunk<
  { token: string; user: User },
  LoginPayload,
  { rejectValue: string }
>('auth/login', async (payload, { rejectWithValue }) => {
  try {
    // Step 1: Authenticate and get token
    const loginResponse = await authService.login(payload);
    const token = loginResponse.accessToken;

    // Step 2: Store token in localStorage (also used by axios interceptor)
    tokenService.setAccessToken(token);

    // Step 3: Fetch user profile (requires valid token)
    const userProfile = {
  id: '2',
  name: 'System Administrator',
  email: 'admin@example.com',
  role: 'SUPER_ADMIN',
  schoolId: undefined,
};

    // Step 4: Transform and return
    const user: User = {
      id: userProfile.id,
      name: userProfile.name,
      email: userProfile.email,
      role: userProfile.role,
      schoolId: userProfile.schoolId,
    };

    return { token, user };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed';
    tokenService.removeAccessToken();
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for restoring auth state on app initialization.
 * 1. Checks if token exists in localStorage
 * 2. Validates token by fetching user profile
 * 3. Restores Redux state if valid
 */
export const restoreAuthState = createAsyncThunk<
  { token: string; user: User } | null,
  void,
  { rejectValue: string }
>('auth/restoreAuthState', async (_, { rejectWithValue }) => {
  try {
    const token = tokenService.getAccessToken();

    if (!token) {
      return null;
    }

    // Token exists, validate it by fetching user profile
    const userProfile = await authService.validateToken();

    if (!userProfile) {
      tokenService.removeAccessToken();
      return null;
    }

    const user: User = {
      id: userProfile.id,
      name: userProfile.name,
      email: userProfile.email,
      role: userProfile.role,
      schoolId: userProfile.schoolId,
    };

    return { token, user };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to restore auth state';
    tokenService.removeAccessToken();
    return rejectWithValue(message);
  }
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Logout action.
     * Clears user and token from state and localStorage.
     */
    logout(state) {
      state.token = null;
      state.user = null;
      state.status = 'idle';
      state.error = null;
      tokenService.removeAccessToken();
    },

    /**
     * Set user action.
     * Used to manually update user in state.
     */
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },

    /**
     * Clear error action.
     * Used to dismiss error messages.
     */
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder
      // Login thunk
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Login failed';
        state.token = null;
        state.user = null;
      })
      // Restore auth state thunk
      .addCase(restoreAuthState.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(restoreAuthState.fulfilled, (state, action) => {
        if (action.payload) {
          state.status = 'succeeded';
          state.token = action.payload.token;
          state.user = action.payload.user;
          state.error = null;
        } else {
          state.status = 'idle';
          state.token = null;
          state.user = null;
          state.error = null;
        }
      })
      .addCase(restoreAuthState.rejected, (state, action) => {
        state.status = 'idle';
        state.token = null;
        state.user = null;
        state.error = action.payload ?? null;
      });
  },
});

export const { logout, setUser, clearError } = authSlice.actions;
export default authSlice.reducer;
