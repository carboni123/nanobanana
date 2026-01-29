# NanoBanana Frontend

Modern React + TypeScript frontend for the NanoBanana API key management platform.

## Features

- 🔐 **Authentication**: Secure login/registration with JWT tokens
- 🔑 **API Key Management**: Create, view, and revoke API keys with ease
- 📊 **Usage Analytics**: Track API usage with interactive charts
- ⚙️ **Settings**: Manage profile and change password
- 🎨 **Modern UI**: Responsive design with Tailwind CSS
- 🧪 **Comprehensive Testing**: Integration and E2E test coverage

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **React Hook Form** - Form handling
- **Recharts** - Data visualization
- **Axios** - HTTP client

## Getting Started

### Prerequisites

- Node.js 18+ (20+ recommended)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Testing

This project has comprehensive test coverage including integration tests and end-to-end tests.

### Integration Tests (Vitest + React Testing Library)

Integration tests verify component behavior, user interactions, and state management.

**Run all tests:**
```bash
npm test
```

**Run tests in watch mode:**
```bash
npm test
```

**Run tests once (CI mode):**
```bash
npm run test:run
```

**Run tests with UI:**
```bash
npm run test:ui
```

**Generate coverage report:**
```bash
npm run test:coverage
```

**Test Coverage Includes:**
- ✅ Authentication flow (login, register, logout)
- ✅ API key CRUD operations
- ✅ Settings/profile updates
- ✅ Password changes
- ✅ Form validation
- ✅ Error states
- ✅ Loading states
- ✅ Protected route access

### E2E Tests (Playwright)

End-to-end tests verify complete user journeys across the application.

**First-time setup:**
```bash
npm run playwright:install
```

**Run E2E tests:**
```bash
npm run test:e2e
```

**Run E2E tests with UI mode:**
```bash
npm run test:e2e:ui
```

**Run E2E tests in headed mode (see browser):**
```bash
npm run test:e2e:headed
```

**Debug E2E tests:**
```bash
npm run test:e2e:debug
```

**E2E Test Coverage:**
- ✅ Complete authentication flow
- ✅ API key creation and management
- ✅ Settings updates
- ✅ Navigation between pages
- ✅ Protected route redirects
- ✅ Form submissions with validation

### Running All Tests

To run both integration and E2E tests:
```bash
npm run test:all
```

### Writing Tests

**Integration Test Example:**
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render and handle user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);

    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument();
    });
  });
});
```

**E2E Test Example:**
```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForURL('/dashboard');
  await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
});
```

## Project Structure

```
frontend/
├── e2e/                    # E2E tests (Playwright)
│   ├── auth.spec.ts
│   ├── api-keys.spec.ts
│   ├── settings.spec.ts
│   └── helpers.ts
├── src/
│   ├── components/         # Reusable components
│   │   ├── __tests__/      # Component tests
│   │   ├── ErrorBoundary.tsx
│   │   ├── Header.tsx
│   │   ├── Layout.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── Sidebar.tsx
│   ├── contexts/           # React contexts
│   │   ├── __tests__/      # Context tests
│   │   └── AuthContext.tsx
│   ├── pages/              # Page components
│   │   ├── __tests__/      # Page tests
│   │   ├── ApiKeys.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── NotFound.tsx
│   │   ├── Register.tsx
│   │   ├── Settings.tsx
│   │   └── Usage.tsx
│   ├── services/           # API and external services
│   │   └── api.ts
│   ├── test/               # Test utilities
│   │   ├── mockApiClient.ts
│   │   ├── mockData.ts
│   │   ├── setup.ts
│   │   └── test-utils.tsx
│   ├── types/              # TypeScript types
│   │   └── api.ts
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
├── playwright.config.ts    # Playwright configuration
├── vitest.config.ts        # Vitest configuration
└── package.json
```

## API Integration

The frontend communicates with the backend API using Axios. The API client is configured in `src/services/api.ts` with:

- Automatic token management
- Request/response interceptors
- Error handling
- Retry logic for failed requests

**API Base URL:**
- Development: `/api` (proxied to `http://localhost:8000`)
- Production: Configure via environment variables

## Development Guidelines

### Code Style

- Follow TypeScript best practices
- Use functional components and hooks
- Keep components small and focused
- Write tests for all new features
- Use meaningful variable names

### Testing Philosophy

1. **Test behavior, not implementation** - Focus on what users see and do
2. **Integration over unit** - Test components together when possible
3. **E2E for critical flows** - Cover main user journeys end-to-end
4. **Mock external dependencies** - Use mock API responses in tests
5. **Accessibility matters** - Use semantic HTML and ARIA labels

### Commit Guidelines

Before committing:
1. Run linter: `npm run lint`
2. Run tests: `npm run test:run`
3. Build successfully: `npm run build`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run integration tests in watch mode |
| `npm run test:run` | Run integration tests once |
| `npm run test:ui` | Run tests with Vitest UI |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:e2e` | Run E2E tests |
| `npm run test:e2e:ui` | Run E2E tests with Playwright UI |
| `npm run test:e2e:headed` | Run E2E tests in headed mode |
| `npm run test:e2e:debug` | Debug E2E tests |
| `npm run test:all` | Run all tests |
| `npm run playwright:install` | Install Playwright browsers |

## Troubleshooting

### Tests Failing

**Issue:** Integration tests fail with "Cannot find module" errors
**Solution:** Make sure all dependencies are installed: `npm install`

**Issue:** E2E tests fail with "Browser not found"
**Solution:** Run `npm run playwright:install` to install browsers

**Issue:** Tests timeout
**Solution:** Increase timeout in test configuration or check for infinite loops

### Development Server

**Issue:** Port 5173 is already in use
**Solution:** Kill the process using the port or change the port in `vite.config.ts`

**Issue:** API requests fail
**Solution:** Make sure the backend server is running on `http://localhost:8000`

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Ensure all tests pass
5. Submit a pull request

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
