/**
 * API Keys E2E Tests
 *
 * Tests complete API key management flow:
 * - Viewing API keys
 * - Creating API keys
 * - Copying keys to clipboard
 * - Deleting/revoking keys
 */

import { test, expect } from '@playwright/test';
import { setupMockAPI, login } from './helpers';

test.describe('API Keys Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAPI(page);
    await login(page);

    // Navigate to API Keys page
    await page.click('text=API Keys');
    await page.waitForURL('/api-keys');
  });

  test('should display list of API keys', async ({ page }) => {
    // Wait for keys to load
    await expect(page.locator('text=Test Key')).toBeVisible();

    // Check key details are displayed
    await expect(page.locator('text=nb_test...')).toBeVisible();
    await expect(page.locator('text=Active').first()).toBeVisible();
  });

  test('should create new API key', async ({ page }) => {
    // Click create button
    await page.click('button:has-text("Create New Key")');

    // Modal should appear
    await expect(page.locator('text=Create New API Key')).toBeVisible();

    // Fill in key name
    await page.fill('input[placeholder*="Production"]', 'My Production Key');

    // Submit form
    await page.click('button:has-text("Create Key")');

    // Success modal should appear with the key
    await expect(page.locator('text=API Key Created Successfully')).toBeVisible();
    await expect(page.locator('input[value*="nb_test_"]')).toBeVisible();
  });

  test('should copy API key to clipboard', async ({ page }) => {
    // Create a new key first
    await page.click('button:has-text("Create New Key")');
    await page.click('button:has-text("Create Key")');

    // Wait for success modal
    await expect(page.locator('text=API Key Created Successfully')).toBeVisible();

    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // Click copy button
    await page.click('button:has-text("Copy")');

    // Button should show "Copied!"
    await expect(page.locator('text=✓ Copied!')).toBeVisible();

    // Verify clipboard content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('nb_test_');
  });

  test('should revoke API key', async ({ page }) => {
    // Click revoke button on first key
    await page.click('button:has-text("Revoke")').first();

    // Confirmation modal should appear
    await expect(page.locator('text=Revoke API Key')).toBeVisible();
    await expect(
      page.locator('text=Are you sure you want to revoke this API key?')
    ).toBeVisible();

    // Confirm deletion
    await page.click('button:has-text("Revoke Key")');

    // Should show success toast (if visible in implementation)
    // Keys should be reloaded
    await expect(page.locator('text=Test Key')).toBeVisible();
  });

  test('should cancel key deletion', async ({ page }) => {
    // Click revoke button
    await page.click('button:has-text("Revoke")').first();

    // Confirmation modal should appear
    await expect(page.locator('text=Revoke API Key')).toBeVisible();

    // Click cancel
    await page.click('button:has-text("Cancel")');

    // Modal should close
    await expect(page.locator('text=Revoke API Key')).not.toBeVisible();

    // Key should still be there
    await expect(page.locator('text=Test Key')).toBeVisible();
  });

  test('should show empty state when no keys exist', async ({ page }) => {
    // Mock empty keys response
    await page.route('**/api/keys', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            keys: [],
            total: 0,
          }),
        });
      }
    });

    // Reload page
    await page.reload();

    // Empty state should be visible
    await expect(page.locator('text=No API keys yet')).toBeVisible();
    await expect(
      page.locator('text=Get started by creating your first API key')
    ).toBeVisible();
  });

  test('should close new key modal after saving', async ({ page }) => {
    // Create a new key
    await page.click('button:has-text("Create New Key")');
    await page.click('button:has-text("Create Key")');

    // Wait for success modal
    await expect(page.locator('text=API Key Created Successfully')).toBeVisible();

    // Click "I've Saved My Key"
    await page.click('button:has-text("I\'ve Saved My Key")');

    // Modal should close
    await expect(page.locator('text=API Key Created Successfully')).not.toBeVisible();
  });
});
