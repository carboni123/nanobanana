# Testing Guide

## Overview

This project includes comprehensive test coverage with both integration tests and E2E tests:

- **Integration Tests**: React Testing Library + Vitest for component and logic testing
- **E2E Tests**: Playwright for full user journey testing

## Prerequisites

**IMPORTANT**: Due to dependency compatibility with `jsdom` and newer Vite/Vitest versions, Node.js 20+ is required for running tests.

### Node Version Requirement

- **Minimum**: Node.js 20.0.0
- **Recommended**: Node.js 20.19.0 or later

If you're currently on Node 18, you can upgrade using:

```bash
# Using nvm
nvm install 20
nvm use 20

# Or using your package manager
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs

# macOS (Homebrew)
brew install node@20
```

## Test Structure

```
frontend/
├── e2e/                                 # E2E tests (Playwright)
│   ├── auth.spec.ts                     # Authentication flow tests
│   ├── api-keys.spec.ts                 # API key management tests
│   ├── settings.spec.ts                 # Settings page tests
│   └── helpers.ts                       # E2E test helpers
├── src/
│   ├── components/__tests__/            # Component tests
│   │   └── ProtectedRoute.test.tsx
│   ├── contexts/__tests__/              # Context tests
│   │   └── AuthContext.test.tsx
│   ├── pages/__tests__/                 # Page component tests
│   │   ├── ApiKeys.test.tsx
│   │   ├── Login.test.tsx
│   │   └── Settings.test.tsx
│   └── test/                            # Test utilities
│       ├── mockApiClient.ts             # Mock API client factory
│       ├── mockData.ts                  # Test data fixtures
│       ├── setup.ts                     # Global test setup
│       └── test-utils.tsx               # Custom render helpers
├── vitest.config.ts                     # Vitest configuration
└── playwright.config.ts                 # Playwright configuration
```

## Running Tests

### Integration Tests

Integration tests verify component behavior, state management, and user interactions.

**Run all integration tests:**
```bash
npm test
```

**Run tests in watch mode (development):**
```bash
npm test
```

**Run tests once (CI mode):**
```bash
npm run test:run
```

**Run with UI:**
```bash
npm run test:ui
```

**Generate coverage report:**
```bash
npm run test:coverage
```

### E2E Tests

E2E tests verify complete user workflows in a real browser environment.

**First-time setup** (install Playwright browsers):
```bash
npm run playwright:install
```

**Run E2E tests:**
```bash
npm run test:e2e
```

**Run with UI mode (interactive debugging):**
```bash
npm run test:e2e:ui
```

**Run in headed mode (see browser):**
```bash
npm run test:e2e:headed
```

**Debug specific test:**
```bash
npm run test:e2e:debug
```

### Run All Tests

```bash
npm run test:all
```

## Test Coverage

### Integration Tests Cover:

✅ **Authentication**
- Login with valid/invalid credentials
- Registration flow
- Logout functionality
- Protected route access control
- Auth state persistence

✅ **API Key Management**
- Listing all keys
- Creating new keys (with/without names)
- Copying keys to clipboard
- Revoking/deleting keys
- Empty state display
- Error handling

✅ **Settings**
- Profile email updates
- Password changes
- Form validation
- Conflict detection (email already in use)
- Wrong password errors

✅ **Error & Loading States**
- Network errors
- Validation errors
- Loading spinners
- Error messages
- Toast notifications

✅ **UI Components**
- Protected routes
- Form validation
- Modal interactions
- Button states
- Responsive layouts

### E2E Tests Cover:

✅ **Complete User Journeys**
- Full authentication flow (login → navigate → logout)
- API key creation and management workflow
- Settings update workflows
- Cross-page navigation
- Error recovery flows
- Protected route redirects

## Writing Tests

### Integration Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);

    const button = screen.getByRole('button', { name: /submit/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument();
    });
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';
import { login } from './helpers';

test('user can create API key', async ({ page }) => {
  await login(page);

  await page.click('text=API Keys');
  await page.click('button:has-text("Create New Key")');
  await page.fill('input[placeholder*="name"]', 'My Key');
  await page.click('button:has-text("Create Key")');

  await expect(page.locator('text=API Key Created Successfully')).toBeVisible();
});
```

## Test Utilities

### Custom Render Helper

The `renderWithProviders` function wraps components with all necessary context providers:

```typescript
import { render } from '../../test/test-utils';

// Automatically includes:
// - BrowserRouter
// - AuthProvider
// - Toaster
render(<MyComponent />);
```

### Mock Data

Consistent test data is available in `src/test/mockData.ts`:

```typescript
import { mockUser, mockApiKey, mockTokenResponse } from '../../test/mockData';
```

### Mock API Client

Create mock API clients for testing:

```typescript
import { createMockApiClient } from '../../test/mockApiClient';

const mockApi = createMockApiClient({
  login: vi.fn().mockResolvedValue(mockTokenResponse),
});
```

## Continuous Integration

For CI/CD pipelines, use these commands:

```bash
# Install dependencies
npm ci

# Install Playwright browsers (for E2E)
npm run playwright:install

# Run linter
npm run lint

# Run integration tests
npm run test:run

# Run E2E tests
npm run test:e2e

# Or run all tests
npm run test:all
```

## Troubleshooting

### Tests Won't Run (Node Version)

**Error**: `require() of ES Module not supported` or jsdom errors

**Solution**: Upgrade to Node.js 20+

```bash
node --version  # Should show v20.x.x or higher
```

### E2E Tests Fail - Browser Not Found

**Error**: `browserType.launch: Executable doesn't exist`

**Solution**: Install Playwright browsers

```bash
npm run playwright:install
```

### Tests Timeout

**Error**: Tests hang or timeout

**Solutions**:
1. Check for infinite loops in component useEffect hooks
2. Increase timeout in test configuration
3. Ensure mock API responses resolve properly
4. Check for missing await statements

### Mock API Not Working

**Issue**: Tests receive real API calls instead of mocks

**Solution**: Verify mock setup in test file:

```typescript
vi.mock('../../services/api', async () => {
  const actual = await vi.importActual('../../services/api');
  return {
    ...actual,
    apiClient: {
      login: vi.fn().mockResolvedValue(mockTokenResponse),
      // ... other mocked methods
    },
  };
});
```

### Coverage Reports

Generate and view coverage:

```bash
npm run test:coverage
```

Coverage report will be available in `coverage/index.html`

## Best Practices

### Integration Tests

1. **Test User Behavior** - Focus on what users see and do, not implementation details
2. **Use Accessible Queries** - Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Async Actions** - Always use `waitFor` for async state changes
4. **Mock External APIs** - Never hit real APIs in tests
5. **Setup/Teardown** - Clear mocks and local storage between tests

### E2E Tests

1. **Test Critical Paths** - Focus on core user workflows
2. **Independent Tests** - Each test should be self-contained
3. **Stable Selectors** - Use semantic selectors (role, text) over classes
4. **Wait Explicitly** - Use `waitForURL`, `waitFor` instead of arbitrary delays
5. **Mock API Responses** - Use route interception for consistent test data

### General

1. **Descriptive Names** - Test names should describe expected behavior
2. **One Assertion Focus** - Each test should verify one specific behavior
3. **Arrange-Act-Assert** - Structure tests clearly
4. **DRY with Helpers** - Extract common setup into helper functions
5. **Fast Tests** - Keep tests fast by mocking heavy operations

## Performance Tips

- Run tests in parallel where possible (Vitest does this by default)
- Use `test.skip()` or `test.only()` during development
- Keep E2E tests focused on happy paths, use integration tests for edge cases
- Use `vi.mock()` to avoid loading heavy dependencies

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:run
      - run: npm run playwright:install
      - run: npm run test:e2e
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Support

For testing issues or questions:
1. Check this guide
2. Review existing test files for examples
3. Consult the documentation links above
4. Open a GitHub issue with test output and error messages
