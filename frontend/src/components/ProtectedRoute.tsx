import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { apiClient } from '../services/api';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute Component
 *
 * Wraps routes that require authentication. If the user is not authenticated,
 * they will be redirected to the login page.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = apiClient.isAuthenticated();

  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" replace />;
  }

  // Render the protected content if authenticated
  return <>{children}</>;
}
