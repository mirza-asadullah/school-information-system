import api from '../axios';
import type { LoginPayload } from '../../types';

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'STUDENT';
  schoolId?: string;
}

export const authService = {
  /**
   * Authenticate user with email and password.
   * Calls FastAPI POST /api/v1/auth/login endpoint.
   */
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await api.post<{ access_token: string; token_type: string }>('/auth/login', payload);
    return {
      accessToken: response.data.access_token,
      tokenType: response.data.token_type,
    };
  },

  /**
   * Fetch current user profile.
   * Called after login to populate user state.
   * Requires valid JWT token in Authorization header.
   */
  getCurrentUser: async (): Promise<UserProfile> => {
    const response = await api.get<{
      id: number;
      full_name: string;
      email: string;
      role: string;
      school_id?: number;
    }>('/auth/me');

    return {
      id: response.data.id.toString(),
      name: response.data.full_name,
      email: response.data.email,
      role: (response.data.role as 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'STUDENT') || 'STUDENT',
      schoolId: response.data.school_id?.toString(),
    };
  },

  /**
   * Validate token by attempting to fetch user profile.
   * Used during app initialization to restore auth state.
   */
  validateToken: async (): Promise<UserProfile | null> => {
    try {
      return await authService.getCurrentUser();
    } catch {
      return null;
    }
  },
};
