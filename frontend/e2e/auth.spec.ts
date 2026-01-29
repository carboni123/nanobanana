/**
 * Authentication E2E Tests
 *
 * Tests complete authentication flows:
 * - Login
 * - Registration
 * - Logout
 * - Protected route access
 */

import { test, expect } from '@playwright/test';
import { setupMockAPI, testUser, login, logout } from './helpers';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAPI(page);
  });

  test('should login successfully and redirect to dashboard', async ({ page }) => {
    await page.goto('/login');

    // Fill in login form
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL('/dashboard');

    // Dashboard content should be visible
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Override mock to return error
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Invalid email or password',
        }),
      });
    });

    await page.goto('/login');

    // Fill in login form with wrong credentials
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Error message should appear
    await expect(page.locator('text=Invalid email or password')).toBeVisible();

    // Should remain on login page
    expect(page.url()).toContain('/login');
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await login(page);

    // Verify we're on dashboard
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

    // Click logout button
    await page.click('button:has-text("Logout")');

    // Should redirect to login
    await page.waitForURL('/login');

    // Login form should be visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Try to access dashboard without logging in
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL('/login');
  });

  test('should redirect authenticated user from login to dashboard', async ({ page }) => {
    // Login first
    await login(page);

    // Try to access login page
    await page.goto('/login');

    // Should redirect back to dashboard
    await page.waitForURL('/dashboard');
  });

  test('should navigate between pages after login', async ({ page }) => {
    await login(page);

    // Navigate to API Keys
    await page.click('text=API Keys');
    await page.waitForURL('/api-keys');
    await expect(page.locator('h1:has-text("API Keys")')).toBeVisible();

    // Navigate to Usage
    await page.click('text=Usage Analytics');
    await page.waitForURL('/usage');
    await expect(page.locator('h1:has-text("Usage Analytics")')).toBeVisible();

    // Navigate to Settings
    await page.click('text=Settings');
    await page.waitForURL('/settings');
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible();

    // Navigate back to Dashboard
    await page.click('text=Dashboard');
    await page.waitForURL('/dashboard');
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });
});
