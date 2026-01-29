/**
 * AuthContext Integration Tests
 *
 * Tests authentication flow including:
 * - Initial auth state loading
 * - Login flow
 * - Register flow
 * - Logout flow
 * - Token persistence
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../AuthContext';
import { apiClient, ApiClientError } from '../../services/api';
import { mockUser, mockTokenResponse, mockRegisterResponse } from '../../test/mockData';

// Mock the API client
vi.mock('../../services/api', async () => {
  const actual = await vi.importActual('../../services/api');
  return {
    ...actual,
    apiClient: {
      login: vi.fn(),
      register: vi.fn(),
      getCurrentUser: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: vi.fn(),
      setAuthErrorHandler: vi.fn(),
    },
  };
});

// Wrapper for the hook
const wrapper = ({ children }: { children: ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should start with loading state when not authenticated', async () => {
      vi.mocked(apiClient.isAuthenticated).mockReturnValue(false);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should fetch user data when authenticated on mount', async () => {
      vi.mocked(apiClient.isAuthenticated).mockReturnValue(true);
      vi.mocked(apiClient.getCurrentUser).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for user to be loaded
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiClient.getCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('should handle failed user fetch on mount', async () => {
      vi.mocked(apiClient.isAuthenticated).mockReturnValue(true);
      vi.mocked(apiClient.getCurrentUser).mockRejectedValue(
        new Error('Failed to fetch user')
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should logout on failed fetch
      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
      expect(apiClient.logout).toHaveBeenCalled();
    });
  });

  describe('Login', () => {
    it('should login successfully and fetch user data', async () => {
      vi.mocked(apiClient.isAuthenticated).mockReturnValue(false);
      vi.mocked(apiClient.login).mockResolvedValue(mockTokenResponse);
      vi.mocked(apiClient.getCurrentUser).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Perform login
      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      // Verify login was called
      expect(apiClient.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      // Verify user was fetched after login
      expect(apiClient.getCurrentUser).toHaveBeenCalled();

      // Verify user state
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle login errors', async () => {
      vi.mocked(apiClient.isAuthenticated).mockReturnValue(false);
      const loginError = new ApiClientError(
        'Invalid credentials',
        401,
        'Unauthorized',
        'Invalid credentials'
      );
      vi.mocked(apiClient.login).mockRejectedValue(loginError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Attempt login
      await expect(
        result.current.login({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid credentials');

      // User should remain null
      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
      expect(apiClient.logout).toHaveBeenCalled();
    });
  });

  describe('Register', () => {
    it('should register successfully and set user data', async () => {
      vi.mocked(apiClient.isAuthenticated).mockReturnValue(false);
      vi.mocked(apiClient.register).mockResolvedValue(mockRegisterResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Perform registration
      await act(async () => {
        await result.current.register({
          email: 'newuser@example.com',
          password: 'password123',
        });
      });

      // Verify register was called
      expect(apiClient.register).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
      });

      // Verify user state (registration response includes user)
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle registration errors', async () => {
      vi.mocked(apiClient.isAuthenticated).mockReturnValue(false);
      const registerError = new ApiClientError(
        'Email already exists',
        409,
        'Conflict',
        'Email already exists'
      );
      vi.mocked(apiClient.register).mockRejectedValue(registerError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Attempt registration
      await expect(
        result.current.register({
          email: 'existing@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Email already exists');

      // User should remain null
      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
      expect(apiClient.logout).toHaveBeenCalled();
    });
  });

  describe('Logout', () => {
    it('should logout and clear user data', async () => {
      vi.mocked(apiClient.isAuthenticated).mockReturnValue(true);
      vi.mocked(apiClient.getCurrentUser).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for user to be loaded
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Perform logout
      act(() => {
        result.current.logout();
      });

      // Verify logout was called
      expect(apiClient.logout).toHaveBeenCalled();

      // Verify user state is cleared
      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Refresh User', () => {
    it('should refresh user data', async () => {
      vi.mocked(apiClient.isAuthenticated).mockReturnValue(true);
      vi.mocked(apiClient.getCurrentUser).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial user load
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Clear mock to track new calls
      vi.mocked(apiClient.getCurrentUser).mockClear();

      // Update the mock to return updated user
      const updatedUser = { ...mockUser, email: 'updated@example.com' };
      vi.mocked(apiClient.getCurrentUser).mockResolvedValue(updatedUser);

      // Refresh user
      await act(async () => {
        await result.current.refreshUser();
      });

      // Verify user was fetched again
      expect(apiClient.getCurrentUser).toHaveBeenCalledTimes(1);

      // Verify user state is updated
      expect(result.current.user).toEqual(updatedUser);
    });

    it('should handle refresh errors', async () => {
      vi.mocked(apiClient.isAuthenticated).mockReturnValue(true);
      vi.mocked(apiClient.getCurrentUser).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial user load
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Mock error on refresh
      vi.mocked(apiClient.getCurrentUser).mockRejectedValue(
        new Error('Token expired')
      );

      // Attempt refresh
      await expect(result.current.refreshUser()).rejects.toThrow('Token expired');

      // User should be cleared on error
      expect(result.current.user).toBe(null);
      expect(apiClient.logout).toHaveBeenCalled();
    });
  });

  describe('Auth Error Handler', () => {
    it('should setup auth error handler on mount', async () => {
      vi.mocked(apiClient.isAuthenticated).mockReturnValue(false);

      renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(apiClient.setAuthErrorHandler).toHaveBeenCalled();
      });
    });
  });
});
