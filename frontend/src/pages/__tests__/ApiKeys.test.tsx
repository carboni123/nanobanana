/**
 * ApiKeys Page Integration Tests
 *
 * Tests API key management CRUD operations including:
 * - Listing API keys
 * - Creating new API keys
 * - Deleting/revoking API keys
 * - Copy to clipboard functionality
 * - Empty states
 * - Error handling
 * - Loading states
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test/test-utils';
import ApiKeys from '../ApiKeys';
import { apiClient, ApiClientError } from '../../services/api';
import {
  mockKeyListResponse,
  mockEmptyKeyListResponse,
  mockCreateKeyResponse,
  mockApiKey,
} from '../../test/mockData';

// Mock the API client
vi.mock('../../services/api', async () => {
  const actual = await vi.importActual('../../services/api');
  return {
    ...actual,
    apiClient: {
      listApiKeys: vi.fn(),
      createApiKey: vi.fn(),
      deleteApiKey: vi.fn(),
    },
  };
});

describe('ApiKeys Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading skeleton initially', () => {
      vi.mocked(apiClient.listApiKeys).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<ApiKeys />);

      expect(screen.getByText('API Keys')).toBeInTheDocument();
      // Loading skeleton should be visible
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('API Keys List', () => {
    it('should display list of API keys', async () => {
      vi.mocked(apiClient.listApiKeys).mockResolvedValue(mockKeyListResponse);

      render(<ApiKeys />);

      await waitFor(() => {
        expect(screen.getByText('Test API Key')).toBeInTheDocument();
        expect(screen.getByText('Production Key')).toBeInTheDocument();
        expect(screen.getByText('Old Key')).toBeInTheDocument();
      });

      // Check for key prefixes
      expect(screen.getByText('nb_test...')).toBeInTheDocument();
      expect(screen.getByText('nb_prod...')).toBeInTheDocument();
      expect(screen.getByText('nb_old...')).toBeInTheDocument();

      // Check for active status
      const activeStatuses = screen.getAllByText('Active');
      expect(activeStatuses).toHaveLength(2);

      const revokedStatus = screen.getByText('Revoked');
      expect(revokedStatus).toBeInTheDocument();

      expect(apiClient.listApiKeys).toHaveBeenCalledTimes(1);
    });

    it('should display empty state when no keys exist', async () => {
      vi.mocked(apiClient.listApiKeys).mockResolvedValue(mockEmptyKeyListResponse);

      render(<ApiKeys />);

      await waitFor(() => {
        expect(screen.getByText('No API keys yet')).toBeInTheDocument();
        expect(
          screen.getByText(
            'Get started by creating your first API key to access the NanoBanana API.'
          )
        ).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', {
        name: /create your first key/i,
      });
      expect(createButton).toBeInTheDocument();
    });

    it('should handle fetch error', async () => {
      const error = new Error('Failed to load API keys');
      vi.mocked(apiClient.listApiKeys).mockRejectedValue(error);

      render(<ApiKeys />);

      await waitFor(() => {
        expect(screen.getByText('Error loading API keys')).toBeInTheDocument();
        expect(screen.getByText('Failed to load API keys')).toBeInTheDocument();
      });

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      expect(tryAgainButton).toBeInTheDocument();
    });
  });

  describe('Create API Key', () => {
    it('should open create modal when clicking create button', async () => {
      vi.mocked(apiClient.listApiKeys).mockResolvedValue(mockKeyListResponse);
      const user = userEvent.setup();

      render(<ApiKeys />);

      // Wait for keys to load
      await waitFor(() => {
        expect(screen.getByText('Test API Key')).toBeInTheDocument();
      });

      // Click create button
      const createButton = screen.getByRole('button', { name: /create new key/i });
      await user.click(createButton);

      // Modal should be visible
      expect(screen.getByText('Create New API Key')).toBeInTheDocument();
      expect(screen.getByLabelText(/key name/i)).toBeInTheDocument();
    });

    it('should create API key successfully', async () => {
      vi.mocked(apiClient.listApiKeys).mockResolvedValue(mockKeyListResponse);
      vi.mocked(apiClient.createApiKey).mockResolvedValue(mockCreateKeyResponse);
      const user = userEvent.setup();

      render(<ApiKeys />);

      // Wait for keys to load
      await waitFor(() => {
        expect(screen.getByText('Test API Key')).toBeInTheDocument();
      });

      // Open create modal
      const createButton = screen.getByRole('button', { name: /create new key/i });
      await user.click(createButton);

      // Fill in key name
      const nameInput = screen.getByLabelText(/key name/i);
      await user.type(nameInput, 'My New Key');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create key/i });
      await user.click(submitButton);

      // Verify API was called
      await waitFor(() => {
        expect(apiClient.createApiKey).toHaveBeenCalledWith({
          name: 'My New Key',
        });
      });

      // Success modal should appear with the new key
      await waitFor(() => {
        expect(screen.getByText('API Key Created Successfully')).toBeInTheDocument();
        expect(screen.getByDisplayValue(mockCreateKeyResponse.key)).toBeInTheDocument();
      });

      // Keys should be refetched
      expect(apiClient.listApiKeys).toHaveBeenCalledTimes(2);
    });

    it('should create API key without name', async () => {
      vi.mocked(apiClient.listApiKeys).mockResolvedValue(mockKeyListResponse);
      vi.mocked(apiClient.createApiKey).mockResolvedValue(mockCreateKeyResponse);
      const user = userEvent.setup();

      render(<ApiKeys />);

      // Wait for keys to load
      await waitFor(() => {
        expect(screen.getByText('Test API Key')).toBeInTheDocument();
      });

      // Open create modal
      const createButton = screen.getByRole('button', { name: /create new key/i });
      await user.click(createButton);

      // Submit without entering name
      const submitButton = screen.getByRole('button', { name: /create key/i });
      await user.click(submitButton);

      // Verify API was called with undefined name
      await waitFor(() => {
        expect(apiClient.createApiKey).toHaveBeenCalledWith({
          name: undefined,
        });
      });
    });

    it('should handle create API key error', async () => {
      vi.mocked(apiClient.listApiKeys).mockResolvedValue(mockKeyListResponse);
      const error = new ApiClientError(
        'Rate limit exceeded',
        429,
        'Too Many Requests',
        'You have reached your API key limit'
      );
      vi.mocked(apiClient.createApiKey).mockRejectedValue(error);
      const user = userEvent.setup();

      render(<ApiKeys />);

      // Wait for keys to load
      await waitFor(() => {
        expect(screen.getByText('Test API Key')).toBeInTheDocument();
      });

      // Open create modal
      const createButton = screen.getByRole('button', { name: /create new key/i });
      await user.click(createButton);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create key/i });
      await user.click(submitButton);

      // Error should be displayed
      await waitFor(() => {
        expect(
          screen.getByText('You have reached your API key limit')
        ).toBeInTheDocument();
      });
    });

    it('should copy API key to clipboard', async () => {
      vi.mocked(apiClient.listApiKeys).mockResolvedValue(mockKeyListResponse);
      vi.mocked(apiClient.createApiKey).mockResolvedValue(mockCreateKeyResponse);
      const user = userEvent.setup();

      render(<ApiKeys />);

      // Wait for keys to load
      await waitFor(() => {
        expect(screen.getByText('Test API Key')).toBeInTheDocument();
      });

      // Create a new key
      const createButton = screen.getByRole('button', { name: /create new key/i });
      await user.click(createButton);

      const submitButton = screen.getByRole('button', { name: /create key/i });
      await user.click(submitButton);

      // Wait for success modal
      await waitFor(() => {
        expect(screen.getByText('API Key Created Successfully')).toBeInTheDocument();
      });

      // Click copy button
      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);

      // Verify clipboard was called
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        mockCreateKeyResponse.key
      );

      // Button text should change
      await waitFor(() => {
        expect(screen.getByText('✓ Copied!')).toBeInTheDocument();
      });
    });
  });

  describe('Delete API Key', () => {
    it('should open delete confirmation modal', async () => {
      vi.mocked(apiClient.listApiKeys).mockResolvedValue(mockKeyListResponse);
      const user = userEvent.setup();

      render(<ApiKeys />);

      // Wait for keys to load
      await waitFor(() => {
        expect(screen.getByText('Test API Key')).toBeInTheDocument();
      });

      // Click revoke button (on desktop view, check first revoke button)
      const revokeButtons = screen.getAllByRole('button', { name: /revoke/i });
      await user.click(revokeButtons[0]);

      // Confirmation modal should appear
      expect(screen.getByText('Revoke API Key')).toBeInTheDocument();
      expect(
        screen.getByText(/are you sure you want to revoke this api key/i)
      ).toBeInTheDocument();
    });

    it('should delete API key successfully', async () => {
      vi.mocked(apiClient.listApiKeys).mockResolvedValue(mockKeyListResponse);
      vi.mocked(apiClient.deleteApiKey).mockResolvedValue(undefined);
      const user = userEvent.setup();

      render(<ApiKeys />);

      // Wait for keys to load
      await waitFor(() => {
        expect(screen.getByText('Test API Key')).toBeInTheDocument();
      });

      // Click revoke button
      const revokeButtons = screen.getAllByRole('button', { name: /revoke/i });
      await user.click(revokeButtons[0]);

      // Confirm deletion in modal
      const confirmButton = within(
        screen.getByText('Revoke API Key').closest('div')!
      ).getByRole('button', { name: /revoke key/i });
      await user.click(confirmButton);

      // Verify API was called
      await waitFor(() => {
        expect(apiClient.deleteApiKey).toHaveBeenCalledWith(mockApiKey.id);
      });

      // Keys should be refetched
      expect(apiClient.listApiKeys).toHaveBeenCalledTimes(2);
    });

    it('should handle delete API key error', async () => {
      vi.mocked(apiClient.listApiKeys).mockResolvedValue(mockKeyListResponse);
      const error = new ApiClientError(
        'Failed to delete key',
        500,
        'Internal Server Error',
        'An error occurred while deleting the key'
      );
      vi.mocked(apiClient.deleteApiKey).mockRejectedValue(error);
      const user = userEvent.setup();

      render(<ApiKeys />);

      // Wait for keys to load
      await waitFor(() => {
        expect(screen.getByText('Test API Key')).toBeInTheDocument();
      });

      // Click revoke button
      const revokeButtons = screen.getAllByRole('button', { name: /revoke/i });
      await user.click(revokeButtons[0]);

      // Confirm deletion
      const confirmButton = within(
        screen.getByText('Revoke API Key').closest('div')!
      ).getByRole('button', { name: /revoke key/i });
      await user.click(confirmButton);

      // Error should be displayed
      await waitFor(() => {
        expect(
          screen.getByText('An error occurred while deleting the key')
        ).toBeInTheDocument();
      });
    });

    it('should cancel delete operation', async () => {
      vi.mocked(apiClient.listApiKeys).mockResolvedValue(mockKeyListResponse);
      const user = userEvent.setup();

      render(<ApiKeys />);

      // Wait for keys to load
      await waitFor(() => {
        expect(screen.getByText('Test API Key')).toBeInTheDocument();
      });

      // Click revoke button
      const revokeButtons = screen.getAllByRole('button', { name: /revoke/i });
      await user.click(revokeButtons[0]);

      // Click cancel button
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText('Revoke API Key')).not.toBeInTheDocument();
      });

      // Delete API should not be called
      expect(apiClient.deleteApiKey).not.toHaveBeenCalled();
    });
  });
});
