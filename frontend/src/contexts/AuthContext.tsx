/**
 * Authentication Context
 *
 * Provides centralized authentication state management including:
 * - Current user state
 * - Login/logout/register methods
 * - Authentication status
 * - Auto-fetching user data on mount
 * - Loading states
 */

/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiClient } from '../services/api';
import type { UserResponse, UserLoginRequest, UserRegisterRequest } from '../types/api';

// ============================================================================
// Types
// ============================================================================

interface AuthContextType {
  // State
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Methods
  login: (credentials: UserLoginRequest) => Promise<void>;
  register: (data: UserRegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

// ============================================================================
// Context Creation
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Auth Provider Component
// ============================================================================

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Derived state
  const isAuthenticated = user !== null;

  /**
   * Fetch current user data from API
   */
  const refreshUser = async () => {
    try {
      const userData = await apiClient.getCurrentUser();
      setUser(userData);
    } catch (error) {
      // If fetching user fails (e.g., invalid token), clear user state
      setUser(null);
      apiClient.logout();
      throw error;
    }
  };

  /**
   * Login with email and password
   */
  const login = async (credentials: UserLoginRequest) => {
    try {
      // API client automatically stores the token
      await apiClient.login(credentials);

      // Fetch user data after successful login
      await refreshUser();
    } catch (error) {
      // Clean up on error
      setUser(null);
      apiClient.logout();
      throw error;
    }
  };

  /**
   * Register new user account
   */
  const register = async (data: UserRegisterRequest) => {
    try {
      // API client automatically stores the token
      const response = await apiClient.register(data);

      // Set user from registration response
      setUser(response.user);
    } catch (error) {
      // Clean up on error
      setUser(null);
      apiClient.logout();
      throw error;
    }
  };

  /**
   * Logout user and clear state
   */
  const logout = () => {
    apiClient.logout();
    setUser(null);
  };

  /**
   * On mount, check if user is already authenticated and fetch user data
   */
  useEffect(() => {
    const initAuth = async () => {
      if (apiClient.isAuthenticated()) {
        try {
          await refreshUser();
        } catch (error) {
          // If token is invalid, user will be cleared by refreshUser
          console.error('Failed to fetch user on init:', error);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Setup global auth error handler to logout on 401
   */
  useEffect(() => {
    apiClient.setAuthErrorHandler(() => {
      setUser(null);
    });
  }, []);

  // Context value
  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// Custom Hook
// ============================================================================

/**
 * Custom hook to access auth context
 * Throws error if used outside AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

// Export context for advanced use cases
export { AuthContext };
export type { AuthContextType };
