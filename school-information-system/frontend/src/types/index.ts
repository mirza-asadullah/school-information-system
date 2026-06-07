export type UserRole = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  schoolId?: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

export interface ThemeState {
  mode: 'light' | 'dark';
}

export interface DashboardMetrics {
  totalSchools: number;
  totalStudents: number;
  totalCourses: number;
  totalEnrollments: number;
  totalExams: number;
  totalResults: number;
  attendanceRate: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}
