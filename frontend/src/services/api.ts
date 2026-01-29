/**
 * NanoBanana API Client
 *
 * Provides a comprehensive HTTP client for interacting with the NanoBanana backend API.
 * Features:
 * - Bearer token authentication
 * - Request/response interceptors
 * - Error handling with proper typing
 * - Token refresh logic
 * - Methods for auth, API keys, and usage endpoints
 */

import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type {
  // Auth types
  UserRegisterRequest,
  UserLoginRequest,
  RegisterResponse,
  TokenResponse,
  UserResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
  // API Key types
  CreateKeyRequest,
  CreateKeyResponse,
  KeyListResponse,
  // Usage types
  UsageSummaryResponse,
  DailyUsageResponse,
  KeyUsageResponse,
  // Error types
  ApiError,
  ValidationErrorResponse,
  ApiClientConfig,
} from '../types/api';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_BASE_URL = '/api';
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const TOKEN_STORAGE_KEY = 'nanobanana_token';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  baseDelay: number = RETRY_DELAY
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry if it's not a retryable error
      if (error instanceof ApiClientError && !error.isRetryable()) {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate exponential backoff delay
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Request failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
      await sleep(delay);
    }
  }

  throw lastError!;
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Custom API error class with proper typing
 */
export class ApiClientError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly detail: string;
  public readonly validationErrors?: ValidationErrorResponse['detail'];

  constructor(
    message: string,
    status: number,
    statusText: string,
    detail?: string,
    validationErrors?: ValidationErrorResponse['detail']
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.statusText = statusText;
    this.detail = detail || message;
    this.validationErrors = validationErrors;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (Error as any).captureStackTrace === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Error as any).captureStackTrace(this, ApiClientError);
    }
  }

  /**
   * Check if error is due to authentication failure
   */
  isAuthError(): boolean {
    return this.status === 401;
  }

  /**
   * Check if error is due to validation failure
   */
  isValidationError(): boolean {
    return this.status === 422 && !!this.validationErrors;
  }

  /**
   * Check if error is due to resource not found
   */
  isNotFoundError(): boolean {
    return this.status === 404;
  }

  /**
   * Check if error is due to conflict (e.g., email already exists)
   */
  isConflictError(): boolean {
    return this.status === 409;
  }

  /**
   * Check if error is a network error (no response from server)
   */
  isNetworkError(): boolean {
    return this.status === 0;
  }

  /**
   * Check if error is retryable (network error or 5xx server error)
   */
  isRetryable(): boolean {
    return this.isNetworkError() || (this.status >= 500 && this.status < 600);
  }
}

/**
 * Convert Axios error to ApiClientError
 */
function handleApiError(error: AxiosError): never {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const status = error.response.status;
    const statusText = error.response.statusText;
    const data = error.response.data as ApiError | ValidationErrorResponse | undefined;

    // Handle validation errors (422)
    if (status === 422 && data && 'detail' in data && Array.isArray(data.detail)) {
      const validationData = data as ValidationErrorResponse;
      const firstError = validationData.detail[0];
      const message = `Validation error: ${firstError.msg}`;
      throw new ApiClientError(
        message,
        status,
        statusText,
        message,
        validationData.detail
      );
    }

    // Handle standard API errors
    if (data && 'detail' in data && typeof data.detail === 'string') {
      const apiError = data as ApiError;
      throw new ApiClientError(
        apiError.detail,
        status,
        statusText,
        apiError.detail
      );
    }

    // Generic error with status code
    const message = `Request failed with status ${status}`;
    throw new ApiClientError(message, status, statusText);
  } else if (error.request) {
    // The request was made but no response was received
    throw new ApiClientError(
      'No response received from server',
      0,
      'Network Error',
      'The server did not respond. Please check your connection.'
    );
  } else {
    // Something happened in setting up the request that triggered an Error
    throw new ApiClientError(
      error.message || 'Request setup failed',
      0,
      'Client Error',
      error.message
    );
  }
}

// ============================================================================
// Token Management
// ============================================================================

/**
 * Token storage utilities
 */
export const tokenStorage = {
  get(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  },

  set(token: string): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  },

  remove(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  },

  exists(): boolean {
    return !!this.get();
  },
};

// ============================================================================
// API Client Class
// ============================================================================

/**
 * Main API client class
 */
export class ApiClient {
  private client: AxiosInstance;
  private onAuthError?: () => void;
  private retryEnabled: boolean;

  constructor(config: ApiClientConfig = {}) {
    this.client = axios.create({
      baseURL: config.baseURL || DEFAULT_BASE_URL,
      timeout: config.timeout || DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.retryEnabled = true; // Enable retry by default
    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor: Add auth token to requests
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = tokenStorage.get();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor: Handle errors globally
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Handle 401 errors (authentication failures)
        if (error.response?.status === 401) {
          tokenStorage.remove();
          if (this.onAuthError) {
            this.onAuthError();
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Register callback for authentication errors
   */
  public setAuthErrorHandler(handler: () => void): void {
    this.onAuthError = handler;
  }

  /**
   * Enable or disable automatic retry for failed requests
   */
  public setRetryEnabled(enabled: boolean): void {
    this.retryEnabled = enabled;
  }

  /**
   * Execute a request with optional retry logic
   */
  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    if (this.retryEnabled) {
      return retryWithBackoff(fn);
    }
    return fn();
  }

  // ==========================================================================
  // Authentication Endpoints
  // ==========================================================================

  /**
   * Register a new user account
   */
  async register(data: UserRegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await this.client.post<RegisterResponse>('/auth/register', data);
      // Store the token automatically
      tokenStorage.set(response.data.access_token);
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  }

  /**
   * Login with email and password
   */
  async login(data: UserLoginRequest): Promise<TokenResponse> {
    try {
      const response = await this.client.post<TokenResponse>('/auth/login', data);
      // Store the token automatically
      tokenStorage.set(response.data.access_token);
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<UserResponse> {
    return this.executeWithRetry(async () => {
      try {
        const response = await this.client.get<UserResponse>('/auth/me');
        return response.data;
      } catch (error) {
        throw handleApiError(error as AxiosError);
      }
    });
  }

  /**
   * Update user profile information
   */
  async updateProfile(data: UpdateProfileRequest): Promise<UserResponse> {
    try {
      const response = await this.client.put<UserResponse>('/auth/me', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  }

  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    try {
      await this.client.post('/auth/me/password', data);
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  }

  /**
   * Logout (clear local token)
   */
  logout(): void {
    tokenStorage.remove();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return tokenStorage.exists();
  }

  // ==========================================================================
  // API Key Management Endpoints
  // ==========================================================================

  /**
   * Create a new API key
   */
  async createApiKey(data: CreateKeyRequest = {}): Promise<CreateKeyResponse> {
    try {
      const response = await this.client.post<CreateKeyResponse>('/keys', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  }

  /**
   * List all API keys for the authenticated user
   */
  async listApiKeys(): Promise<KeyListResponse> {
    return this.executeWithRetry(async () => {
      try {
        const response = await this.client.get<KeyListResponse>('/keys');
        return response.data;
      } catch (error) {
        throw handleApiError(error as AxiosError);
      }
    });
  }

  /**
   * Delete (revoke) an API key
   */
  async deleteApiKey(keyId: string): Promise<void> {
    try {
      await this.client.delete(`/keys/${keyId}`);
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  }

  // ==========================================================================
  // Usage Analytics Endpoints
  // ==========================================================================

  /**
   * Get usage summary across all user's API keys
   */
  async getUsageSummary(): Promise<UsageSummaryResponse> {
    return this.executeWithRetry(async () => {
      try {
        const response = await this.client.get<UsageSummaryResponse>('/usage/summary');
        return response.data;
      } catch (error) {
        throw handleApiError(error as AxiosError);
      }
    });
  }

  /**
   * Get daily usage breakdown for the last N days
   */
  async getDailyUsage(days: number = 30): Promise<DailyUsageResponse> {
    return this.executeWithRetry(async () => {
      try {
        const response = await this.client.get<DailyUsageResponse>('/usage/daily', {
          params: { days },
        });
        return response.data;
      } catch (error) {
        throw handleApiError(error as AxiosError);
      }
    });
  }

  /**
   * Get usage statistics for a specific API key
   */
  async getKeyUsage(keyId: string): Promise<KeyUsageResponse> {
    return this.executeWithRetry(async () => {
      try {
        const response = await this.client.get<KeyUsageResponse>(`/usage/key/${keyId}`);
        return response.data;
      } catch (error) {
        throw handleApiError(error as AxiosError);
      }
    });
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Default API client instance
 * Use this for most cases, or create a new instance with custom config
 */
export const apiClient = new ApiClient();

// Export default instance
export default apiClient;
