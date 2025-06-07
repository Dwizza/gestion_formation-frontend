import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import axios from 'axios';

// Disable development mode to use real authentication
// const DEV_MODE = false;

export type UserRole = 'ADMIN' | 'TRAINER';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthSessionData {
  user: User;
  token: string;
  expiry: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshToken: () => Promise<boolean>;
  getAuthToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create an axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

// Helper function to safely get auth data
const getStoredAuthData = (): AuthSessionData | null => {
  try {
    const storedData = localStorage.getItem('tweadup_user');
    if (!storedData) return null;
    return JSON.parse(storedData) as AuthSessionData;
  } catch (error) {
    console.error('Error parsing stored auth data:', error);
    return null;
  }
};

// Add interceptor to include token in every request
api.interceptors.request.use(
  (config) => {
    // Regular authentication flow
    const authData = getStoredAuthData();
    if (authData?.token) {
      config.headers.Authorization = `Bearer ${authData.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get auth token safely
  const getAuthToken = (): string | null => {
    // Try from state first
    if (token) return token;

    // Fallback to localStorage
    const authData = getStoredAuthData();
    return authData?.token || null;
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const authData = getStoredAuthData();

      if (!authData?.token) {
        console.log('No token found to refresh');
        return false;
      }

      if (Date.now() < authData.expiry) {
        // Token still valid, no need to refresh
        console.log('Token still valid, no refresh needed');
        return true;
      }

      console.log('Attempting to refresh token...');
      // Token expired, try to refresh
      const refreshResponse = await api.post('/auth/refresh-token', {
        token: authData.token
      });

      if (refreshResponse.data && refreshResponse.data.token) {
        // Update stored session with new token and expiry
        const updatedSession: AuthSessionData = {
          ...authData,
          token: refreshResponse.data.token,
          expiry: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };

        localStorage.setItem('tweadup_user', JSON.stringify(updatedSession));
        setToken(refreshResponse.data.token);
        api.defaults.headers.common.Authorization = `Bearer ${refreshResponse.data.token}`;
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  };

  useEffect(() => {
    // Regular authentication flow for production
    const authData = getStoredAuthData();

    if (authData) {
      const { user: storedUser, token: storedToken, expiry } = authData;

      // Check if the session is still valid
      if (expiry && Date.now() < expiry) {
        setUser(storedUser);
        setToken(storedToken);
        api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
      } else {
        // Session expired, try to refresh token
        refreshToken().then(refreshed => {
          if (!refreshed) {
            // If refresh failed, clear storage
            console.log('Auth session expired and refresh failed');
            localStorage.removeItem('tweadup_user');
            setToken(null);
            delete api.defaults.headers.common.Authorization;
          }
        });
      }
    }

    setIsLoading(false);
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Real API call to backend
      console.log('kifach lblan')
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response:', response.data);

      if (response.data && response.data.token && response.data.user) {
        const userData: User = {
          id: response.data.user.id,
          name: response.data.user.name || response.data.user.nom || email.split('@')[0],
          email: response.data.user.email,
          role: response.data.user.role as UserRole
        };

        console.log('Processed user data:', userData);
        console.log('User role from API:', response.data.user.role);

        // Store session with expiry (24 hours from now)
        const sessionData: AuthSessionData = {
          user: userData,
          token: response.data.token,
          expiry: Date.now() + (24 * 60 * 60 * 1000)
        };

        // Set auth header for future requests
        api.defaults.headers.common.Authorization = `Bearer ${response.data.token}`;

        setUser(userData);
        setToken(response.data.token);
        localStorage.setItem('tweadup_user', JSON.stringify(sessionData));
      } else {
        console.error('Invalid login response format:', response.data);
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('tweadup_user');
    delete api.defaults.headers.common.Authorization;
  };

  const value = {
    user,
    login,
    logout,
    refreshToken,
    getAuthToken,
    isAuthenticated: !!user && !!token,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export the api instance for use in other components
export { api };