/**
 * Test Utilities
 *
 * Custom render function and test helpers for React Testing Library
 * that includes all necessary providers (AuthProvider, Router, etc.)
 */

import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

// ============================================================================
// Provider Wrapper
// ============================================================================

interface AllProvidersProps {
  children: ReactNode;
}

/**
 * Wrapper component that includes all providers needed for testing
 */
function AllProviders({ children }: AllProvidersProps) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster />
        {children}
      </AuthProvider>
    </BrowserRouter>
  );
}

// ============================================================================
// Custom Render Function
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Initial route for the router
   * @default '/'
   */
  initialRoute?: string;
}

/**
 * Custom render function that wraps components with all necessary providers
 *
 * @example
 * const { getByText } = renderWithProviders(<MyComponent />);
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { initialRoute = '/', ...renderOptions } = options || {};

  // Set initial route if provided
  if (initialRoute !== '/') {
    window.history.pushState({}, 'Test page', initialRoute);
  }

  return render(ui, {
    wrapper: AllProviders,
    ...renderOptions,
  });
}

// ============================================================================
// Re-export everything from React Testing Library
// ============================================================================

export * from '@testing-library/react';
export { renderWithProviders as render };
