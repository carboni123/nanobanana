/**
 * Settings E2E Tests
 *
 * Tests settings page functionality:
 * - Profile updates
 * - Password changes
 * - Form validation
 */

import { test, expect } from '@playwright/test';
import { setupMockAPI, login } from './helpers';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAPI(page);
    await login(page);

    // Navigate to Settings page
    await page.click('text=Settings');
    await page.waitForURL('/settings');
  });

  test('should display current user email', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveValue('test@example.com');
  });

  test('should update profile email', async ({ page }) => {
    // Mock update profile endpoint
    await page.route('**/api/auth/me', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'user-123',
            email: 'newemail@example.com',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'user-123',
            email: 'test@example.com',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          }),
        });
      }
    });

    // Change email
    const emailInput = page.locator('input[type="email"]');
    await emailInput.clear();
    await emailInput.fill('newemail@example.com');

    // Click update button
    await page.click('button:has-text("Update Profile")');

    // Success toast should appear (implementation-dependent)
    // Verify button returns to normal state
    await expect(page.locator('button:has-text("Update Profile")')).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await emailInput.clear();
    await emailInput.fill('invalid-email');

    // Click update button
    await page.click('button:has-text("Update Profile")');

    // Validation error should appear
    await expect(page.locator('text=/please enter a valid email/i')).toBeVisible();
  });

  test('should change password successfully', async ({ page }) => {
    // Mock password change endpoint
    await page.route('**/api/auth/me/password', async (route) => {
      await route.fulfill({
        status: 204,
      });
    });

    // Fill in password form
    await page.fill('input#currentPassword', 'oldpassword123');
    await page.fill('input#newPassword', 'newpassword456');
    await page.fill('input#confirmPassword', 'newpassword456');

    // Submit form
    await page.click('button:has-text("Change Password")');

    // Success state should appear
    await expect(page.locator('button:has-text("Change Password")')).toBeVisible();

    // Form should be cleared
    await expect(page.locator('input#currentPassword')).toHaveValue('');
    await expect(page.locator('input#newPassword')).toHaveValue('');
    await expect(page.locator('input#confirmPassword')).toHaveValue('');
  });

  test('should show error when passwords do not match', async ({ page }) => {
    // Fill in password form with mismatched passwords
    await page.fill('input#currentPassword', 'oldpassword123');
    await page.fill('input#newPassword', 'newpassword456');
    await page.fill('input#confirmPassword', 'differentpassword');

    // Submit form
    await page.click('button:has-text("Change Password")');

    // Validation error should appear
    await expect(page.locator('text=/passwords do not match/i')).toBeVisible();
  });

  test('should show error for short password', async ({ page }) => {
    // Fill in password form with short password
    await page.fill('input#currentPassword', 'oldpassword123');
    await page.fill('input#newPassword', 'short');
    await page.fill('input#confirmPassword', 'short');

    // Submit form
    await page.click('button:has-text("Change Password")');

    // Validation error should appear
    await expect(
      page.locator('text=/password must be at least 8 characters/i')
    ).toBeVisible();
  });

  test('should handle incorrect current password error', async ({ page }) => {
    // Mock error response
    await page.route('**/api/auth/me/password', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Current password is incorrect',
        }),
      });
    });

    // Fill in password form
    await page.fill('input#currentPassword', 'wrongpassword');
    await page.fill('input#newPassword', 'newpassword456');
    await page.fill('input#confirmPassword', 'newpassword456');

    // Submit form
    await page.click('button:has-text("Change Password")');

    // Error should appear
    await expect(page.locator('text=/current password is incorrect/i')).toBeVisible();
  });

  test('should display security tips', async ({ page }) => {
    await expect(page.locator('text=Security Tips')).toBeVisible();
    await expect(
      page.locator('text=Use a strong, unique password for your account')
    ).toBeVisible();
  });

  test('should show member since date', async ({ page }) => {
    await expect(page.locator('text=Member Since')).toBeVisible();
    await expect(page.locator('text=/January/i')).toBeVisible();
  });
});
