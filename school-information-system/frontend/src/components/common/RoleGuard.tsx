import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

interface RoleGuardProps {
  allowedRoles: string[];
  children: JSX.Element;
}

/**
 * RoleGuard Component
 *
 * Enforces role-based access control:
 * 1. Checks user role from Redux state
 * 2. Allows only users with allowed roles
 * 3. Redirects unauthorized users to dashboard
 *
 * Usage:
 * ```
 * <RoleGuard allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN']}>
 *   <SchoolListPage />
 * </RoleGuard>
 * ```
 */
export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const role = useAppSelector((state) => state.auth.user?.role);

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
