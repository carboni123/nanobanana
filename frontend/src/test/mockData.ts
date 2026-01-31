/**
 * Mock Data for Testing
 *
 * Provides consistent mock data for tests including:
 * - User objects
 * - API keys
 * - Usage statistics
 * - API responses
 */

import type {
  UserResponse,
  TokenResponse,
  RegisterResponse,
  KeyResponse,
  CreateKeyResponse,
  KeyListResponse,
  UsageSummaryResponse,
  DailyUsageResponse,
  KeyUsageResponse,
} from '../types/api';

// ============================================================================
// User Mock Data
// ============================================================================

export const mockUser: UserResponse = {
  id: 'user-123',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
};

export const mockUser2: UserResponse = {
  id: 'user-456',
  email: 'another@example.com',
  created_at: '2024-01-15T00:00:00Z',
};

// ============================================================================
// Token Mock Data
// ============================================================================

export const mockToken = 'mock-jwt-token-abc123';

export const mockTokenResponse: TokenResponse = {
  access_token: mockToken,
  token_type: 'bearer',
};

export const mockRegisterResponse: RegisterResponse = {
  access_token: mockToken,
  token_type: 'bearer',
  user: mockUser,
};

// ============================================================================
// API Key Mock Data
// ============================================================================

export const mockApiKey: KeyResponse = {
  id: 'key-123',
  name: 'Test API Key',
  prefix: 'nb_test',
  is_active: true,
  created_at: '2024-01-05T00:00:00Z',
  last_used_at: '2024-01-10T12:00:00Z',
};

export const mockApiKey2: KeyResponse = {
  id: 'key-456',
  name: 'Production Key',
  prefix: 'nb_prod',
  is_active: true,
  created_at: '2024-01-06T00:00:00Z',
  last_used_at: null,
};

export const mockRevokedApiKey: KeyResponse = {
  id: 'key-789',
  name: 'Old Key',
  prefix: 'nb_old',
  is_active: false,
  created_at: '2023-12-01T00:00:00Z',
  last_used_at: '2023-12-15T00:00:00Z',
};

export const mockCreateKeyResponse: CreateKeyResponse = {
  id: 'key-new',
  key: 'nb_test_1234567890abcdef',
  name: 'New Test Key',
  prefix: 'nb_test',
  created_at: '2024-01-20T00:00:00Z',
};

export const mockKeyListResponse: KeyListResponse = {
  keys: [mockApiKey, mockApiKey2, mockRevokedApiKey],
};

export const mockEmptyKeyListResponse: KeyListResponse = {
  keys: [],
};

// ============================================================================
// Usage Statistics Mock Data
// ============================================================================

export const mockUsageSummary: UsageSummaryResponse = {
  total_images: 15420,
  total_keys: 5,
  active_keys: 2,
  top_keys: [
    {
      key_id: 'key-123',
      key_name: 'Test API Key',
      key_prefix: 'nb_test',
      image_count: 8500,
    },
    {
      key_id: 'key-456',
      key_name: 'Production Key',
      key_prefix: 'nb_prod',
      image_count: 6920,
    },
  ],
};

export const mockDailyUsage: DailyUsageResponse = {
  days: [
    {
      usage_date: '2024-01-25',
      image_count: 120,
    },
    {
      usage_date: '2024-01-26',
      image_count: 150,
    },
    {
      usage_date: '2024-01-27',
      image_count: 95,
    },
    {
      usage_date: '2024-01-28',
      image_count: 180,
    },
    {
      usage_date: '2024-01-29',
      image_count: 200,
    },
  ],
};

export const mockKeyUsage: KeyUsageResponse = {
  key_id: 'key-123',
  key_name: 'Test API Key',
  key_prefix: 'nb_test',
  total_images: 5420,
  daily_usage: [
    {
      usage_date: '2024-01-08',
      image_count: 50,
    },
    {
      usage_date: '2024-01-09',
      image_count: 60,
    },
    {
      usage_date: '2024-01-10',
      image_count: 45,
    },
  ],
};

// ============================================================================
// Error Mock Data
// ============================================================================

export const mockValidationError = {
  detail: [
    {
      loc: ['body', 'email'],
      msg: 'Please enter a valid email address',
      type: 'value_error',
    },
  ],
};

export const mockApiError = {
  detail: 'Invalid credentials',
};

export const mockNetworkError = new Error('Network Error');
