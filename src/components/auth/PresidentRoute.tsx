// src/components/auth/PresidentRoute.tsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

interface PresidentRouteProps {
  children: React.ReactNode;
}

const PresidentRoute: React.FC<PresidentRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPresidentAuth = () => {
      const sessionData = localStorage.getItem('tweadup_president');
      
      if (!sessionData) {
        setIsAuthenticated(false);
        return;
      }

      try {
        const data = JSON.parse(sessionData);
        
        if (data.expiry > Date.now() && data.token && data.user?.role === 'PRESIDENT') {
          setIsAuthenticated(true);
        } else {
          // Session is invalid or expired
          localStorage.removeItem('tweadup_president');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error parsing president session data:", error);
        localStorage.removeItem('tweadup_president');
        setIsAuthenticated(false);
      }
    };

    checkPresidentAuth();
  }, []);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  // Redirect to president login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/president" replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default PresidentRoute;