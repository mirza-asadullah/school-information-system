import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { ShellLayout } from '../layouts/ShellLayout';
import { LoginPage } from '../pages/Login';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { SchoolListPage } from '../pages/schools/SchoolListPage';
import { StudentListPage } from '../pages/students/StudentListPage';
import { CourseListPage } from '../pages/courses/CourseListPage';
import { EnrollmentListPage } from '../pages/enrollments/EnrollmentListPage';
import { AttendancePage } from '../pages/attendance/AttendancePage';
import { ExamListPage } from '../pages/exams/ExamListPage';
import { ResultListPage } from '../pages/results/ResultListPage';
import { OpeneducatPage } from '../pages/openeducat/OpeneducatPage';
import { OpenedxPage } from '../pages/openedx/OpenedxPage';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { PublicRoute } from '../components/common/PublicRoute';
import { RoleGuard } from '../components/common/RoleGuard';
import { ROUTES } from '../utils/menu';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes - Redirect to dashboard if authenticated */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          </PublicRoute>
        }
      />
      {/* Protected Routes - Require authentication */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ShellLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={ROUTES.dashboard} replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route
          path="schools"
          element={
            <RoleGuard allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN']}>
              <SchoolListPage />
            </RoleGuard>
          }
        />
        <Route
          path="students"
          element={
            <RoleGuard allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STUDENT']}>
              <StudentListPage />
            </RoleGuard>
          }
        />
        <Route
          path="courses"
          element={
            <RoleGuard allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STUDENT']}>
              <CourseListPage />
            </RoleGuard>
          }
        />
        <Route
          path="enrollments"
          element={
            <RoleGuard allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN']}>
              <EnrollmentListPage />
            </RoleGuard>
          }
        />
        <Route
          path="attendance"
          element={
            <RoleGuard allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN']}>
              <AttendancePage />
            </RoleGuard>
          }
        />
        <Route
          path="exams"
          element={
            <RoleGuard allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN']}>
              <ExamListPage />
            </RoleGuard>
          }
        />
        <Route
          path="results"
          element={
            <RoleGuard allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STUDENT']}>
              <ResultListPage />
            </RoleGuard>
          }
        />
        <Route
          path="openeducat"
          element={
            <RoleGuard allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN']}>
              <OpeneducatPage />
            </RoleGuard>
          }
        />
        <Route
          path="openedx"
          element={
            <RoleGuard allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN']}>
              <OpenedxPage />
            </RoleGuard>
          }
        />
      </Route>
      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
