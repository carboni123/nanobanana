/**
 * Login Page Integration Tests
 *
 * Tests login functionality including:
 * - Successful login flow
 * - Form validation
 * - Error states
 * - Loading states
 * - Navigation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test/test-utils';
import Login from '../Login';
import { useAuth } from '../../contexts/AuthContext';
import { ApiClientError } from '../../services/api';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the auth context
vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

// Mock the API client (needed because AuthProvider calls apiClient.isAuthenticated on mount)
vi.mock('../../services/api', async () => {
  const actual = await vi.importActual('../../services/api');
  return {
    ...actual,
    apiClient: {
      isAuthenticated: vi.fn().mockReturnValue(false),
      setAuthErrorHandler: vi.fn(),
      getCurrentUser: vi.fn(),
      logout: vi.fn(),
    },
  };
});

describe('Login Page', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup auth context mock (not authenticated by default)
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
  });

  describe('Initial Render', () => {
    it('should display login form', () => {
      render(<Login />);

      expect(screen.getByText(/sign in to/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should display link to register page', () => {
      render(<Login />);

      const registerLink = screen.getByRole('link', { name: /create a new account/i });
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute('href', '/register');
    });

    it('should redirect if already authenticated', () => {
      // Mock authenticated state
      vi.mocked(useAuth).mockReturnValue({
        user: { id: '1', email: 'test@example.com', created_at: '' },
        isAuthenticated: true,
        isLoading: false,
        login: mockLogin,
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      render(<Login />);

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  describe('Form Validation', () => {
    it('should show error for empty email', async () => {
      const user = userEvent.setup();

      render(<Login />);

      // Submit without email — native `required` validation prevents submission
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // The email input has required attribute, so the form won't submit
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      expect(emailInput).toBeRequired();
      expect(emailInput.validity.valid).toBe(false);
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should show error for invalid email format', async () => {
      const user = userEvent.setup();

      render(<Login />);

      // Enter invalid email
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      await user.type(emailInput, 'invalid-email');

      // Submit form — native type="email" validation prevents submission
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      expect(emailInput.validity.valid).toBe(false);
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should show error for empty password', async () => {
      const user = userEvent.setup();

      render(<Login />);

      // Enter only email
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      // Submit form — password has required attribute, so form won't submit
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      expect(passwordInput).toBeRequired();
      expect(passwordInput.validity.valid).toBe(false);
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  describe('Successful Login', () => {
    it('should login successfully and navigate to dashboard', async () => {
      mockLogin.mockResolvedValue(undefined);
      const user = userEvent.setup();

      render(<Login />);

      // Fill in form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Verify login was called
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      // Should navigate to dashboard
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error for invalid credentials', async () => {
      const error = new ApiClientError(
        'Invalid credentials',
        401,
        'Unauthorized',
        'Invalid email or password'
      );
      mockLogin.mockRejectedValue(error);
      const user = userEvent.setup();

      render(<Login />);

      // Fill in form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Error should be displayed
      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });
    });

    it('should display error for network issues', async () => {
      const error = new ApiClientError(
        'Network error',
        0,
        'Network Error',
        'No response received from server'
      );
      mockLogin.mockRejectedValue(error);
      const user = userEvent.setup();

      render(<Login />);

      // Fill in form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Error should be displayed
      await waitFor(() => {
        expect(
          screen.getByText(/no response received from server/i)
        ).toBeInTheDocument();
      });
    });

    it('should display generic error for unexpected errors', async () => {
      mockLogin.mockRejectedValue(new Error('Unexpected error'));
      const user = userEvent.setup();

      render(<Login />);

      // Fill in form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Generic error should be displayed
      await waitFor(() => {
        expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state during login', async () => {
      // Mock login to never resolve (loading state)
      mockLogin.mockImplementation(() => new Promise(() => {}));
      const user = userEvent.setup();

      render(<Login />);

      // Fill in form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Loading indicator should appear
      await waitFor(() => {
        expect(screen.getByText(/signing in\.\.\./i)).toBeInTheDocument();
      });

      // Form inputs should be disabled
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });
});
