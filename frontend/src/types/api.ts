/**
 * TypeScript types for NanoBanana API
 * Based on backend Pydantic schemas
 */

// ============================================================================
// Authentication Types
// ============================================================================

export interface UserRegisterRequest {
  email: string;
  password: string;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  created_at: string; // ISO 8601 datetime string
}

export interface RegisterResponse {
  user: UserResponse;
  access_token: string;
  token_type: string;
}

export interface UpdateProfileRequest {
  email: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// ============================================================================
// API Key Types
// ============================================================================

export interface CreateKeyRequest {
  name?: string | null;
}

export interface CreateKeyResponse {
  id: string;
  key: string; // Full key - only returned on creation
  name: string;
  prefix: string;
  created_at: string; // ISO 8601 datetime string
}

export interface KeyResponse {
  id: string;
  name: string;
  prefix: string;
  is_active: boolean;
  last_used_at: string | null; // ISO 8601 datetime string or null
  created_at: string; // ISO 8601 datetime string
}

export interface KeyListResponse {
  keys: KeyResponse[];
}

// ============================================================================
// Usage Analytics Types
// ============================================================================

export interface TopKeyUsage {
  key_id: string;
  key_name: string;
  key_prefix: string;
  image_count: number;
}

export interface UsageSummaryResponse {
  total_images: number;
  total_keys: number;
  active_keys: number;
  top_keys: TopKeyUsage[];
}

export interface DailyUsageEntry {
  usage_date: string; // ISO 8601 date string (YYYY-MM-DD)
  image_count: number;
}

export interface DailyUsageResponse {
  days: DailyUsageEntry[];
}

export interface KeyUsageResponse {
  key_id: string;
  key_name: string;
  key_prefix: string;
  total_images: number;
  daily_usage: DailyUsageEntry[];
}

// ============================================================================
// Error Types
// ============================================================================

export interface ApiError {
  detail: string;
  status?: number;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface ValidationErrorResponse {
  detail: ValidationError[];
}

// ============================================================================
// HTTP Client Types
// ============================================================================

export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
}
