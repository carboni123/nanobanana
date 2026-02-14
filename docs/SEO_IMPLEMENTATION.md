# SEO Meta Tags Implementation

## Overview

This document describes the SEO meta tags implementation for the NanoBanana frontend application.

## What Was Implemented

### 1. Default Meta Tags in `index.html`

**File**: `frontend/index.html`

Added comprehensive meta tags for SEO and social sharing:
- **Title**: "NanoBanana - AI Image Generation API"
- **Description**: Descriptive meta tag explaining the service
- **Canonical URL**: `https://nanobanana.com.br/`
- **Viewport & Charset**: Proper mobile and encoding settings
- **Language**: `lang="pt-BR"` for Brazilian Portuguese

### 2. SEO Constants Module

**File**: `frontend/src/constants/seo.ts`

Centralized SEO constants to prevent hardcoded strings:
- `SITE_NAME`: "NanoBanana"
- `SITE_TAGLINE`: "AI Image Generation API"
- `SITE_URL`: "https://nanobanana.com.br"
- `SITE_DESCRIPTION`: Full site description
- `PAGE_META`: Per-page title and description metadata

**Benefits**:
- Single source of truth for site information
- Easy to update across the entire application
- Type-safe with TypeScript

### 3. Custom Hook for Dynamic Meta Tags

**File**: `frontend/src/hooks/useDocumentMeta.ts`

A lightweight React hook that dynamically updates:
- `document.title`
- `<meta name="description">` content

**Why not react-helmet-async?**
React Helmet is not compatible with React 19. This custom hook provides the same functionality with:
- Zero dependencies
- Proper cleanup on component unmount
- Full React 19 compatibility

### 4. Per-Page Meta Implementation

All route components now set unique meta tags:

| Page | Title | Description |
|------|-------|-------------|
| Login | "Sign In - NanoBanana" | Sign in to dashboard prompt |
| Register | "Create Account - NanoBanana" | Account creation prompt |
| Dashboard | "Dashboard - NanoBanana" | Overview of API usage |
| API Keys | "API Keys - NanoBanana" | API key management |
| Usage | "Usage Analytics - NanoBanana" | Analytics and charts |
| Settings | "Settings - NanoBanana" | Account settings |
| NotFound | "Page Not Found - NanoBanana" | 404 error page |

## Usage

### Using SEO Constants

```typescript
import { SITE_NAME, PAGE_META } from '../constants/seo';

// In JSX
<h1>Welcome to {SITE_NAME}</h1>

// For page metadata
useDocumentMeta(PAGE_META.dashboard);
```

### Adding Meta Tags to a New Page

```typescript
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { PAGE_META } from '../constants/seo';

export default function MyNewPage() {
  useDocumentMeta(PAGE_META.myPage);  // Or use a custom object

  // Or use custom meta:
  useDocumentMeta({
    title: 'My Custom Page - NanoBanana',
    description: 'This is a custom page description'
  });

  return <div>Page content</div>;
}
```

### Adding a New Page to SEO Constants

Edit `frontend/src/constants/seo.ts`:

```typescript
export const PAGE_META = {
  // ... existing pages
  myNewPage: {
    title: pageTitle('My New Page'),
    description: `Description for my new page in ${SITE_NAME}.`,
  },
} as const;
```

## Files Modified

### New Files Created
- `frontend/src/constants/seo.ts` - SEO constants
- `frontend/src/hooks/useDocumentMeta.ts` - Custom meta hook

### Modified Files
- `frontend/index.html` - Added default meta tags
- `frontend/src/pages/Login.tsx` - Added dynamic meta
- `frontend/src/pages/Register.tsx` - Added dynamic meta
- `frontend/src/pages/Dashboard.tsx` - Added dynamic meta
- `frontend/src/pages/ApiKeys.tsx` - Added dynamic meta
- `frontend/src/pages/Usage.tsx` - Added dynamic meta
- `frontend/src/pages/Settings.tsx` - Added dynamic meta
- `frontend/src/pages/NotFound.tsx` - Added dynamic meta
- `frontend/src/components/Layout.tsx` - Replaced hardcoded site name
- `frontend/src/pages/__tests__/ApiKeys.test.tsx` - Updated test assertion

## SEO Best Practices Implemented

✅ **Unique page titles** - Each page has a descriptive, unique title
✅ **Descriptive meta descriptions** - All pages have relevant descriptions
✅ **Canonical URL** - Prevents duplicate content issues
✅ **Proper charset and viewport** - Mobile-friendly and properly encoded
✅ **Consistent branding** - Site name pulled from constants
✅ **Dynamic updates** - Meta tags update on navigation

## Testing

### Manual Testing
1. Navigate to each page in the application
2. Check browser tab title updates correctly
3. Inspect `<meta name="description">` in DevTools
4. Verify it changes on each route

### Build Validation
```bash
cd frontend
npm run build  # Should build successfully
npm test      # Tests should pass (pre-existing failures not related to SEO)
```

## Future Enhancements

Potential improvements for the future:
- Add Open Graph (og:) meta tags for social media sharing
- Add Twitter Card meta tags
- Implement structured data (JSON-LD)
- Add robots meta tag configuration per page
- Implement dynamic meta images for social sharing
