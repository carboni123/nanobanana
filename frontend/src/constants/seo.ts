/**
 * SEO constants — single source of truth for site name, descriptions, and page metadata.
 * Import from here instead of hardcoding strings in components.
 */

export const SITE_NAME = 'NanoBanana';
export const SITE_TAGLINE = 'AI Image Generation API';
export const SITE_URL = 'https://nanobanana.com.br';
export const SITE_DESCRIPTION =
  'NanoBanana is a SaaS API that wraps Google Gemini\'s image generation with simple API key authentication. Generate AI images without Google Cloud complexity.';

/** Build a page title in the format "Page - NanoBanana" */
export function pageTitle(page: string): string {
  return `${page} - ${SITE_NAME}`;
}

/** Per-page SEO metadata */
export const PAGE_META = {
  login: {
    title: pageTitle('Sign In'),
    description: `Sign in to your ${SITE_NAME} dashboard to manage API keys and monitor usage.`,
  },
  register: {
    title: pageTitle('Create Account'),
    description: `Create a free ${SITE_NAME} account to start generating AI images with a simple API.`,
  },
  dashboard: {
    title: pageTitle('Dashboard'),
    description: `Overview of your ${SITE_NAME} API usage, active keys, and image generation statistics.`,
  },
  apiKeys: {
    title: pageTitle('API Keys'),
    description: `Create, manage, and revoke your ${SITE_NAME} API keys for AI image generation.`,
  },
  usage: {
    title: pageTitle('Usage Analytics'),
    description: `Monitor your ${SITE_NAME} API usage with detailed analytics, charts, and per-key breakdowns.`,
  },
  settings: {
    title: pageTitle('Settings'),
    description: `Manage your ${SITE_NAME} account settings, profile information, and security preferences.`,
  },
  notFound: {
    title: pageTitle('Page Not Found'),
    description: `The page you're looking for doesn't exist on ${SITE_NAME}.`,
  },
} as const;
