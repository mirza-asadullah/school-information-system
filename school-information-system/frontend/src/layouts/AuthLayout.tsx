import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * AuthLayout renders the login/auth pages without any container constraints.
 * The LoginPage itself manages its own full-screen split layout.
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  return <>{children}</>;
}
