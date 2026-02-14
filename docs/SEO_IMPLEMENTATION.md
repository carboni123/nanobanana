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
- `frontend/public/robots.txt` - Search engine crawler directives
- `frontend/public/sitemap.xml` - XML sitemap for search engines

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
- `frontend/nginx.conf` - Added robots.txt and sitemap.xml serving configuration

## SEO Best Practices Implemented

✅ **Unique page titles** - Each page has a descriptive, unique title
✅ **Descriptive meta descriptions** - All pages have relevant descriptions
✅ **Canonical URL** - Prevents duplicate content issues
✅ **Proper charset and viewport** - Mobile-friendly and properly encoded
✅ **Consistent branding** - Site name pulled from constants
✅ **Dynamic updates** - Meta tags update on navigation
✅ **Robots.txt** - Proper crawler directives with sitemap reference
✅ **XML Sitemap** - Well-formed sitemap listing public URLs
✅ **Protected areas** - API and dashboard excluded from crawling
✅ **Correct MIME types** - Proper Content-Type headers for SEO files

## Testing

### Manual Testing
1. Navigate to each page in the application
2. Check browser tab title updates correctly
3. Inspect `<meta name="description">` in DevTools
4. Verify it changes on each route
5. Access `/robots.txt` and verify content
6. Access `/sitemap.xml` and verify XML structure

### Build Validation
```bash
cd frontend
npm run build  # Should build successfully
npm test      # Tests should pass (pre-existing failures not related to SEO)
```

### SEO File Validation
```bash
# Validate robots.txt is accessible
curl -I http://localhost/robots.txt
# Should return: Content-Type: text/plain

# Validate sitemap.xml is accessible
curl -I http://localhost/sitemap.xml
# Should return: Content-Type: application/xml

# Validate XML structure
python -c "import xml.etree.ElementTree as ET; ET.parse('frontend/public/sitemap.xml'); print('XML is well-formed')"
```

### 5. Robots.txt Configuration

**File**: `frontend/public/robots.txt`

SEO-friendly robots.txt that:
- Allows all search engine crawlers (`User-agent: *`, `Allow: /`)
- Disallows crawling of authenticated areas (`Disallow: /api/`, `Disallow: /dashboard`)
- References the sitemap at `https://nanobanana.com.br/sitemap.xml`

**Nginx Configuration**: Served at `/robots.txt` with `Content-Type: text/plain`

### 6. XML Sitemap

**File**: `frontend/public/sitemap.xml`

Valid XML sitemap listing public URLs:
- Home page: `https://nanobanana.com.br/`
- Login page: `https://nanobanana.com.br/login`
- Register page: `https://nanobanana.com.br/register`

Each URL includes:
- `<loc>`: The page URL
- `<lastmod>`: Last modification date (2025-07-14)
- `<changefreq>`: Update frequency (weekly for home, monthly for auth pages)
- `<priority>`: Page priority (1.0 for home, 0.8 for auth pages)

**Nginx Configuration**: Served at `/sitemap.xml` with `Content-Type: application/xml`

### 7. Nginx SEO File Serving

**File**: `frontend/nginx.conf`

Dedicated location blocks ensure proper serving:
```nginx
location = /robots.txt {
    root /usr/share/nginx/html;
    add_header Content-Type text/plain;
    access_log off;
    log_not_found off;
}

location = /sitemap.xml {
    root /usr/share/nginx/html;
    add_header Content-Type application/xml;
    access_log off;
    log_not_found off;
}
```

**Benefits**:
- SEO files are served at the root path
- Correct MIME types for search engine crawlers
- No logging overhead for crawler requests
- Prevents SPA fallback to index.html

## Future Enhancements

Potential improvements for the future:
- Add Open Graph (og:) meta tags for social media sharing
- Add Twitter Card meta tags
- Implement structured data (JSON-LD)
- Add robots meta tag configuration per page
- Implement dynamic meta images for social sharing
- Add dynamic sitemap generation based on routes
- Add sitemap index for large sites
