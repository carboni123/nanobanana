/**
 * Mock API Client for Testing
 *
 * Provides utilities for mocking the API client in tests
 */

import { vi } from 'vitest';
import { ApiClient } from '../services/api';
import {
  mockTokenResponse,
  mockRegisterResponse,
  mockUser,
  mockKeyListResponse,
  mockCreateKeyResponse,
  mockUsageSummary,
  mockDailyUsage,
  mockKeyUsage,
} from './mockData';

/**
 * Create a mock API client with default successful responses
 */
export function createMockApiClient(overrides?: Partial<ApiClient>): ApiClient {
  const mockClient = {
    // Auth methods
    register: vi.fn().mockResolvedValue(mockRegisterResponse),
    login: vi.fn().mockResolvedValue(mockTokenResponse),
    getCurrentUser: vi.fn().mockResolvedValue(mockUser),
    updateProfile: vi.fn().mockResolvedValue(mockUser),
    changePassword: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
    isAuthenticated: vi.fn().mockReturnValue(true),

    // API Key methods
    createApiKey: vi.fn().mockResolvedValue(mockCreateKeyResponse),
    listApiKeys: vi.fn().mockResolvedValue(mockKeyListResponse),
    deleteApiKey: vi.fn().mockResolvedValue(undefined),

    // Usage methods
    getUsageSummary: vi.fn().mockResolvedValue(mockUsageSummary),
    getDailyUsage: vi.fn().mockResolvedValue(mockDailyUsage),
    getKeyUsage: vi.fn().mockResolvedValue(mockKeyUsage),

    // Configuration methods
    setAuthErrorHandler: vi.fn(),
    setRetryEnabled: vi.fn(),

    ...overrides,
  } as unknown as ApiClient;

  return mockClient;
}

/**
 * Mock the apiClient module
 * Call this in your test setup to mock the entire API client
 */
export function mockApiClientModule(mockClient: ApiClient) {
  vi.mock('../services/api', () => ({
    apiClient: mockClient,
    ApiClient,
    ApiClientError: class ApiClientError extends Error {
      status: number;
      statusText: string;
      detail: string;
      validationErrors?: unknown;

      constructor(
        message: string,
        status: number,
        statusText: string,
        detail?: string,
        validationErrors?: unknown
      ) {
        super(message);
        this.name = 'ApiClientError';
        this.status = status;
        this.statusText = statusText;
        this.detail = detail || message;
        this.validationErrors = validationErrors;
      }

      isAuthError() {
        return this.status === 401;
      }

      isValidationError() {
        return this.status === 422 && !!this.validationErrors;
      }

      isNotFoundError() {
        return this.status === 404;
      }

      isConflictError() {
        return this.status === 409;
      }

      isNetworkError() {
        return this.status === 0;
      }

      isRetryable() {
        return this.isNetworkError() || (this.status >= 500 && this.status < 600);
      }
    },
    tokenStorage: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      exists: vi.fn(),
    },
  }));
}

/**
 * Create a failing API client for error testing
 */
export function createFailingApiClient(error: Error): ApiClient {
  return createMockApiClient({
    login: vi.fn().mockRejectedValue(error),
    register: vi.fn().mockRejectedValue(error),
    getCurrentUser: vi.fn().mockRejectedValue(error),
    updateProfile: vi.fn().mockRejectedValue(error),
    changePassword: vi.fn().mockRejectedValue(error),
    createApiKey: vi.fn().mockRejectedValue(error),
    listApiKeys: vi.fn().mockRejectedValue(error),
    deleteApiKey: vi.fn().mockRejectedValue(error),
    getUsageSummary: vi.fn().mockRejectedValue(error),
    getDailyUsage: vi.fn().mockRejectedValue(error),
    getKeyUsage: vi.fn().mockRejectedValue(error),
  });
}
