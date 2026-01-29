/**
 * Settings Page Integration Tests
 *
 * Tests settings and profile management including:
 * - Profile update (email change)
 * - Password change with validation
 * - Form validation
 * - Error handling
 * - Success feedback
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test/test-utils';
import Settings from '../Settings';
import { apiClient, ApiClientError } from '../../services/api';
import { mockUser } from '../../test/mockData';
import { useAuth } from '../../contexts/AuthContext';

// Mock the auth context
vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

// Mock the API client
vi.mock('../../services/api', async () => {
  const actual = await vi.importActual('../../services/api');
  return {
    ...actual,
    apiClient: {
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
    },
    ApiClientError: actual.ApiClientError,
  };
});

describe('Settings Page', () => {
  const mockRefreshUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup auth context mock
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: mockRefreshUser,
    });
  });

  describe('Profile Information', () => {
    it('should display current user email', () => {
      render(<Settings />);

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      expect(emailInput.value).toBe(mockUser.email);
    });

    it('should display member since date', () => {
      render(<Settings />);

      expect(screen.getByText(/member since/i)).toBeInTheDocument();
      expect(screen.getByText(/January 1, 2024/i)).toBeInTheDocument();
    });

    it('should update profile successfully', async () => {
      const updatedUser = { ...mockUser, email: 'newemail@example.com' };
      vi.mocked(apiClient.updateProfile).mockResolvedValue(updatedUser);
      const user = userEvent.setup();

      render(<Settings />);

      // Change email
      const emailInput = screen.getByLabelText(/email address/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'newemail@example.com');

      // Submit form
      const updateButton = screen.getByRole('button', { name: /update profile/i });
      await user.click(updateButton);

      // Verify API was called
      await waitFor(() => {
        expect(apiClient.updateProfile).toHaveBeenCalledWith({
          email: 'newemail@example.com',
        });
      });

      // Verify user was refreshed
      expect(mockRefreshUser).toHaveBeenCalled();
    });

    it('should show validation error for invalid email', async () => {
      const user = userEvent.setup();

      render(<Settings />);

      // Enter invalid email
      const emailInput = screen.getByLabelText(/email address/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'invalid-email');

      // Submit form
      const updateButton = screen.getByRole('button', { name: /update profile/i });
      await user.click(updateButton);

      // Validation error should appear
      await waitFor(() => {
        expect(
          screen.getByText(/please enter a valid email address/i)
        ).toBeInTheDocument();
      });

      // API should not be called
      expect(apiClient.updateProfile).not.toHaveBeenCalled();
    });

    it('should show error for empty email', async () => {
      const user = userEvent.setup();

      render(<Settings />);

      // Clear email
      const emailInput = screen.getByLabelText(/email address/i);
      await user.clear(emailInput);

      // Submit form
      const updateButton = screen.getByRole('button', { name: /update profile/i });
      await user.click(updateButton);

      // Validation error should appear
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });

      // API should not be called
      expect(apiClient.updateProfile).not.toHaveBeenCalled();
    });

    it('should handle email conflict error', async () => {
      const error = new ApiClientError(
        'Email already in use',
        409,
        'Conflict',
        'This email is already in use'
      );
      vi.mocked(apiClient.updateProfile).mockRejectedValue(error);
      const user = userEvent.setup();

      render(<Settings />);

      // Change email
      const emailInput = screen.getByLabelText(/email address/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'taken@example.com');

      // Submit form
      const updateButton = screen.getByRole('button', { name: /update profile/i });
      await user.click(updateButton);

      // Error should be displayed
      await waitFor(() => {
        expect(screen.getByText(/this email is already in use/i)).toBeInTheDocument();
      });
    });

    it('should handle generic update error', async () => {
      const error = new ApiClientError(
        'Server error',
        500,
        'Internal Server Error',
        'Failed to update profile'
      );
      vi.mocked(apiClient.updateProfile).mockRejectedValue(error);
      const user = userEvent.setup();

      render(<Settings />);

      // Change email
      const emailInput = screen.getByLabelText(/email address/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'new@example.com');

      // Submit form
      const updateButton = screen.getByRole('button', { name: /update profile/i });
      await user.click(updateButton);

      // Toast error should be triggered (we can't easily test toast, but API should be called)
      await waitFor(() => {
        expect(apiClient.updateProfile).toHaveBeenCalled();
      });
    });
  });

  describe('Change Password', () => {
    it('should change password successfully', async () => {
      vi.mocked(apiClient.changePassword).mockResolvedValue(undefined);
      const user = userEvent.setup();

      render(<Settings />);

      // Fill in password form
      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(currentPasswordInput, 'oldpassword123');
      await user.type(newPasswordInput, 'newpassword456');
      await user.type(confirmPasswordInput, 'newpassword456');

      // Submit form
      const changeButton = screen.getByRole('button', { name: /change password/i });
      await user.click(changeButton);

      // Verify API was called
      await waitFor(() => {
        expect(apiClient.changePassword).toHaveBeenCalledWith({
          current_password: 'oldpassword123',
          new_password: 'newpassword456',
        });
      });

      // Form should be reset
      await waitFor(() => {
        expect((currentPasswordInput as HTMLInputElement).value).toBe('');
        expect((newPasswordInput as HTMLInputElement).value).toBe('');
        expect((confirmPasswordInput as HTMLInputElement).value).toBe('');
      });
    });

    it('should show validation error if passwords do not match', async () => {
      const user = userEvent.setup();

      render(<Settings />);

      // Fill in password form with mismatched passwords
      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(currentPasswordInput, 'oldpassword123');
      await user.type(newPasswordInput, 'newpassword456');
      await user.type(confirmPasswordInput, 'differentpassword789');

      // Submit form
      const changeButton = screen.getByRole('button', { name: /change password/i });
      await user.click(changeButton);

      // Validation error should appear
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });

      // API should not be called
      expect(apiClient.changePassword).not.toHaveBeenCalled();
    });

    it('should show validation error for short password', async () => {
      const user = userEvent.setup();

      render(<Settings />);

      // Fill in password form with short password
      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(currentPasswordInput, 'oldpassword123');
      await user.type(newPasswordInput, 'short');
      await user.type(confirmPasswordInput, 'short');

      // Submit form
      const changeButton = screen.getByRole('button', { name: /change password/i });
      await user.click(changeButton);

      // Validation error should appear
      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 8 characters/i)
        ).toBeInTheDocument();
      });

      // API should not be called
      expect(apiClient.changePassword).not.toHaveBeenCalled();
    });

    it('should show validation errors for empty fields', async () => {
      const user = userEvent.setup();

      render(<Settings />);

      // Submit form without filling fields
      const changeButton = screen.getByRole('button', { name: /change password/i });
      await user.click(changeButton);

      // Validation errors should appear
      await waitFor(() => {
        expect(screen.getByText(/current password is required/i)).toBeInTheDocument();
        expect(screen.getByText(/new password is required/i)).toBeInTheDocument();
        expect(
          screen.getByText(/please confirm your new password/i)
        ).toBeInTheDocument();
      });

      // API should not be called
      expect(apiClient.changePassword).not.toHaveBeenCalled();
    });

    it('should handle incorrect current password error', async () => {
      const error = new ApiClientError(
        'Invalid password',
        401,
        'Unauthorized',
        'Current password is incorrect'
      );
      vi.mocked(apiClient.changePassword).mockRejectedValue(error);
      const user = userEvent.setup();

      render(<Settings />);

      // Fill in password form
      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(currentPasswordInput, 'wrongpassword');
      await user.type(newPasswordInput, 'newpassword456');
      await user.type(confirmPasswordInput, 'newpassword456');

      // Submit form
      const changeButton = screen.getByRole('button', { name: /change password/i });
      await user.click(changeButton);

      // Error should be displayed
      await waitFor(() => {
        expect(
          screen.getByText(/current password is incorrect/i)
        ).toBeInTheDocument();
      });
    });

    it('should handle generic password change error', async () => {
      const error = new ApiClientError(
        'Server error',
        500,
        'Internal Server Error',
        'Failed to change password'
      );
      vi.mocked(apiClient.changePassword).mockRejectedValue(error);
      const user = userEvent.setup();

      render(<Settings />);

      // Fill in password form
      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(currentPasswordInput, 'oldpassword123');
      await user.type(newPasswordInput, 'newpassword456');
      await user.type(confirmPasswordInput, 'newpassword456');

      // Submit form
      const changeButton = screen.getByRole('button', { name: /change password/i });
      await user.click(changeButton);

      // API should be called
      await waitFor(() => {
        expect(apiClient.changePassword).toHaveBeenCalled();
      });
    });
  });

  describe('UI Elements', () => {
    it('should display security tips section', () => {
      render(<Settings />);

      expect(screen.getByText(/security tips/i)).toBeInTheDocument();
      expect(
        screen.getByText(/use a strong, unique password for your account/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/never share your api keys or password with anyone/i)
      ).toBeInTheDocument();
    });

    it('should show loading state when updating profile', async () => {
      vi.mocked(apiClient.updateProfile).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      const user = userEvent.setup();

      render(<Settings />);

      // Change email and submit
      const emailInput = screen.getByLabelText(/email address/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'new@example.com');

      const updateButton = screen.getByRole('button', { name: /update profile/i });
      await user.click(updateButton);

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByText(/updating\.\.\./i)).toBeInTheDocument();
      });
    });

    it('should show loading state when changing password', async () => {
      vi.mocked(apiClient.changePassword).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      const user = userEvent.setup();

      render(<Settings />);

      // Fill password form and submit
      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(currentPasswordInput, 'oldpassword123');
      await user.type(newPasswordInput, 'newpassword456');
      await user.type(confirmPasswordInput, 'newpassword456');

      const changeButton = screen.getByRole('button', { name: /change password/i });
      await user.click(changeButton);

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByText(/changing\.\.\./i)).toBeInTheDocument();
      });
    });
  });
});
