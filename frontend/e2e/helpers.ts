/**
 * E2E Test Helpers
 *
 * Utilities for Playwright E2E tests including:
 * - Mock API responses
 * - Authentication helpers
 * - Common test actions
 */

import { Page, expect } from '@playwright/test';

/**
 * Mock user data for E2E tests
 */
export const testUser = {
  email: 'test@example.com',
  password: 'TestPassword123!',
};

/**
 * Login helper that navigates to login page and authenticates
 */
export async function login(page: Page, email = testUser.email, password = testUser.password) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard
  await page.waitForURL('/dashboard');
}

/**
 * Logout helper
 */
export async function logout(page: Page) {
  // Click user menu or logout button (adjust selector based on your UI)
  await page.click('button:has-text("Logout")');

  // Wait for redirect to login
  await page.waitForURL('/login');
}

/**
 * Setup mock API responses using route interception
 */
export async function setupMockAPI(page: Page) {
  // Mock login endpoint
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-token-abc123',
        token_type: 'bearer',
      }),
    });
  });

  // Mock current user endpoint
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'user-123',
        email: testUser.email,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }),
    });
  });

  // Mock API keys list endpoint
  await page.route('**/api/keys', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          keys: [
            {
              id: 'key-1',
              name: 'Test Key',
              prefix: 'nb_test',
              is_active: true,
              created_at: '2024-01-05T00:00:00Z',
              last_used_at: '2024-01-10T00:00:00Z',
              user_id: 'user-123',
            },
          ],
          total: 1,
        }),
      });
    } else if (route.request().method() === 'POST') {
      // Mock create key
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'key-new',
          key: 'nb_test_1234567890abcdef',
          name: 'New Test Key',
          prefix: 'nb_test',
          is_active: true,
          created_at: new Date().toISOString(),
          user_id: 'user-123',
        }),
      });
    }
  });

  // Mock delete key endpoint
  await page.route('**/api/keys/*', async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({
        status: 204,
      });
    }
  });

  // Mock usage endpoints
  await page.route('**/api/usage/summary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        total_requests: 15420,
        total_tokens: 1245678,
        total_cost: 45.67,
        period_start: '2024-01-01T00:00:00Z',
        period_end: '2024-01-31T23:59:59Z',
        active_keys: 2,
      }),
    });
  });

  await page.route('**/api/usage/daily*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
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
        ],
        period_start: '2024-01-25T00:00:00Z',
        period_end: '2024-01-26T23:59:59Z',
      }),
    });
  });
}

/**
 * Wait for a toast message to appear
 */
export async function waitForToast(page: Page, message: string) {
  await expect(page.locator('text=' + message)).toBeVisible({ timeout: 5000 });
}

/**
 * Fill a form field by label
 */
export async function fillFormField(page: Page, label: string, value: string) {
  const input = page.locator(`label:has-text("${label}") + input, input[placeholder*="${label}"]`).first();
  await input.fill(value);
}
