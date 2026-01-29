/**
 * Settings and Profile Management Page
 *
 * Features:
 * - View and update user profile (email)
 * - Change password with validation
 * - Form validation using react-hook-form
 * - Loading states and error handling
 * - Success/error feedback with toasts
 * - Mobile-responsive design
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, ApiClientError } from '../services/api';
import type { UpdateProfileRequest, ChangePasswordRequest } from '../types/api';

interface ProfileFormData {
  email: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    setError: setProfileError,
  } = useForm<ProfileFormData>({
    defaultValues: {
      email: user?.email || '',
    },
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    setError: setPasswordError,
    reset: resetPasswordForm,
    watch,
  } = useForm<PasswordFormData>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Watch newPassword for confirm validation
  const newPassword = watch('newPassword');

  /**
   * Handle profile update submission
   */
  const onSubmitProfile = async (data: ProfileFormData) => {
    setIsUpdatingProfile(true);

    try {
      const updateData: UpdateProfileRequest = {
        email: data.email,
      };

      await apiClient.updateProfile(updateData);
      await refreshUser();

      toast.success('Profile updated successfully!');
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.isConflictError()) {
          setProfileError('email', {
            type: 'manual',
            message: 'This email is already in use',
          });
          toast.error('Email already in use');
        } else if (error.isValidationError()) {
          toast.error(error.detail);
        } else {
          toast.error(error.detail || 'Failed to update profile');
        }
      } else {
        toast.error('An unexpected error occurred');
      }
      console.error('Failed to update profile:', error);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  /**
   * Handle password change submission
   */
  const onSubmitPassword = async (data: PasswordFormData) => {
    // Validate password confirmation
    if (data.newPassword !== data.confirmPassword) {
      setPasswordError('confirmPassword', {
        type: 'manual',
        message: 'Passwords do not match',
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const changeData: ChangePasswordRequest = {
        current_password: data.currentPassword,
        new_password: data.newPassword,
      };

      await apiClient.changePassword(changeData);

      toast.success('Password changed successfully!');
      resetPasswordForm();
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.isAuthError()) {
          setPasswordError('currentPassword', {
            type: 'manual',
            message: 'Current password is incorrect',
          });
          toast.error('Current password is incorrect');
        } else if (error.isValidationError()) {
          toast.error(error.detail);
        } else {
          toast.error(error.detail || 'Failed to change password');
        }
      } else {
        toast.error('An unexpected error occurred');
      }
      console.error('Failed to change password:', error);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-300 max-w-4xl">
      {/* Page Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4 sm:space-y-6">
        {/* Profile Information Section */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Profile Information</h2>
            <p className="mt-1 text-xs sm:text-sm text-gray-600">
              Update your account's profile information
            </p>
          </div>

          <form onSubmit={handleSubmitProfile(onSubmitProfile)}>
            <div className="space-y-4">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  {...registerProfile('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Please enter a valid email address',
                    },
                  })}
                  className={`w-full px-3 py-2.5 border text-base ${
                    profileErrors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] touch-manipulation`}
                  placeholder="you@example.com"
                  disabled={isUpdatingProfile}
                />
                {profileErrors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {profileErrors.email.message}
                  </p>
                )}
              </div>

              {/* Account Creation Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Since
                </label>
                <p className="text-sm text-gray-600">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[44px] touch-manipulation"
                >
                  {isUpdatingProfile ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Updating...
                    </>
                  ) : (
                    'Update Profile'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Change Password Section */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Change Password</h2>
            <p className="mt-1 text-xs sm:text-sm text-gray-600">
              Update your password to keep your account secure
            </p>
          </div>

          <form onSubmit={handleSubmitPassword(onSubmitPassword)}>
            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  {...registerPassword('currentPassword', {
                    required: 'Current password is required',
                  })}
                  className={`w-full px-3 py-2.5 border text-base ${
                    passwordErrors.currentPassword
                      ? 'border-red-300'
                      : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] touch-manipulation`}
                  placeholder="Enter your current password"
                  disabled={isChangingPassword}
                />
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {passwordErrors.currentPassword.message}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  {...registerPassword('newPassword', {
                    required: 'New password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                  })}
                  className={`w-full px-3 py-2.5 border text-base ${
                    passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] touch-manipulation`}
                  placeholder="Enter your new password"
                  disabled={isChangingPassword}
                />
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {passwordErrors.newPassword.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Must be at least 8 characters long
                </p>
              </div>

              {/* Confirm New Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  {...registerPassword('confirmPassword', {
                    required: 'Please confirm your new password',
                    validate: (value) =>
                      value === newPassword || 'Passwords do not match',
                  })}
                  className={`w-full px-3 py-2.5 border text-base ${
                    passwordErrors.confirmPassword
                      ? 'border-red-300'
                      : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] touch-manipulation`}
                  placeholder="Confirm your new password"
                  disabled={isChangingPassword}
                />
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[44px] touch-manipulation"
                >
                  {isChangingPassword ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Changing...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Security Note */}
        <div className="bg-banana-50 border border-banana-200 rounded-lg p-4 sm:p-5">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6 text-banana-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm sm:text-base font-medium text-banana-900">
                Security Tips
              </h3>
              <div className="mt-2 text-xs sm:text-sm text-banana-800">
                <ul className="list-disc list-inside space-y-1">
                  <li>Use a strong, unique password for your account</li>
                  <li>Never share your API keys or password with anyone</li>
                  <li>Regularly review your API key usage for suspicious activity</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
