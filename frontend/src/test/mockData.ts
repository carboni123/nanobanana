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
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockUser2: UserResponse = {
  id: 'user-456',
  email: 'another@example.com',
  is_active: true,
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
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
  user_id: 'user-123',
};

export const mockApiKey2: KeyResponse = {
  id: 'key-456',
  name: 'Production Key',
  prefix: 'nb_prod',
  is_active: true,
  created_at: '2024-01-06T00:00:00Z',
  last_used_at: null,
  user_id: 'user-123',
};

export const mockRevokedApiKey: KeyResponse = {
  id: 'key-789',
  name: 'Old Key',
  prefix: 'nb_old',
  is_active: false,
  created_at: '2023-12-01T00:00:00Z',
  last_used_at: '2023-12-15T00:00:00Z',
  user_id: 'user-123',
};

export const mockCreateKeyResponse: CreateKeyResponse = {
  id: 'key-new',
  key: 'nb_test_1234567890abcdef',
  name: 'New Test Key',
  prefix: 'nb_test',
  is_active: true,
  created_at: '2024-01-20T00:00:00Z',
  user_id: 'user-123',
};

export const mockKeyListResponse: KeyListResponse = {
  keys: [mockApiKey, mockApiKey2, mockRevokedApiKey],
  total: 3,
};

export const mockEmptyKeyListResponse: KeyListResponse = {
  keys: [],
  total: 0,
};

// ============================================================================
// Usage Statistics Mock Data
// ============================================================================

export const mockUsageSummary: UsageSummaryResponse = {
  total_requests: 15420,
  total_tokens: 1245678,
  total_cost: 45.67,
  period_start: '2024-01-01T00:00:00Z',
  period_end: '2024-01-31T23:59:59Z',
  active_keys: 2,
};

export const mockDailyUsage: DailyUsageResponse = {
  data: [
    {
      date: '2024-01-25',
      requests: 120,
      tokens: 9500,
      cost: 0.35,
    },
    {
      date: '2024-01-26',
      requests: 150,
      tokens: 12000,
      cost: 0.44,
    },
    {
      date: '2024-01-27',
      requests: 95,
      tokens: 7800,
      cost: 0.29,
    },
    {
      date: '2024-01-28',
      requests: 180,
      tokens: 14500,
      cost: 0.53,
    },
    {
      date: '2024-01-29',
      requests: 200,
      tokens: 16000,
      cost: 0.59,
    },
  ],
  period_start: '2024-01-25T00:00:00Z',
  period_end: '2024-01-29T23:59:59Z',
};

export const mockKeyUsage: KeyUsageResponse = {
  key_id: 'key-123',
  key_name: 'Test API Key',
  total_requests: 5420,
  total_tokens: 445678,
  total_cost: 16.45,
  first_used_at: '2024-01-05T10:00:00Z',
  last_used_at: '2024-01-10T12:00:00Z',
  daily_breakdown: [
    {
      date: '2024-01-08',
      requests: 50,
      tokens: 4000,
      cost: 0.15,
    },
    {
      date: '2024-01-09',
      requests: 60,
      tokens: 4800,
      cost: 0.18,
    },
    {
      date: '2024-01-10',
      requests: 45,
      tokens: 3600,
      cost: 0.13,
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
