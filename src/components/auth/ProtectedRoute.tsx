import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, UserRole } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: UserRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRole
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  console.log('ProtectedRoute - Auth State:', { isAuthenticated, user, isLoading, allowedRole });

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // If not authenticated, always redirect to login
  if (!isAuthenticated) {
    console.log('ProtectedRoute - Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Normalize role for comparison - make it uppercase and remove any prefix
  const normalizeRole = (role: string) => {
    if (!role) return '';
    // First remove any prefix like 'ROLE_' then convert to uppercase
    return role.replace('ROLE_', '').toUpperCase();
  };

  // Normalized user role
  const userRole = normalizeRole(user?.role || '');
  const requiredRole = allowedRole ? normalizeRole(allowedRole) : '';

  // If role check is required and user doesn't have the correct role
  if (allowedRole && requiredRole !== userRole) {
    console.log(`ProtectedRoute - Role mismatch: user has '${user?.role}' (normalized: ${userRole}), needs '${allowedRole}' (normalized: ${requiredRole})`);

    // Determine where to redirect based on the user's actual role
    // Use case-insensitive comparison here as well
    const redirectPath = userRole === 'ADMIN' ? '/admin' : '/trainer';
    console.log(`ProtectedRoute - Redirecting to ${redirectPath}`);

    return <Navigate to={redirectPath} replace />;
  }

  // User is authenticated and has the correct role
  console.log('ProtectedRoute - Access granted');
  return <>{children}</>;
};

export default ProtectedRoute;