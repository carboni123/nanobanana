# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - SEO Sprint

### Added
- **Meta tags**: Comprehensive `<title>`, `<meta name="description">`, `<link rel="canonical">`, and viewport meta tags in `index.html`; per-page dynamic titles via `useDocumentMeta` hook
- **Open Graph tags**: Full set of OG meta tags (`og:title`, `og:description`, `og:type`, `og:url`, `og:image`, `og:site_name`, `og:locale`) for rich social sharing previews
- **Twitter Card tags**: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` meta tags for Twitter/X link previews
- **JSON-LD structured data**: Schema.org `WebApplication` and `Organization` structured data via `JsonLd` component and `useJsonLd` hook for improved search engine understanding
- **robots.txt**: Search engine crawling directives allowing all crawlers, linking to sitemap
- **sitemap.xml**: XML sitemap listing all public routes with priorities and change frequencies
- **Nginx Content-Type headers**: Proper MIME types for `robots.txt` and `sitemap.xml` in nginx config
- **SEO constants module**: Centralized `frontend/src/constants/seo.ts` with site metadata and per-page SEO config
- **Default OG image**: `og-default.png` and `og-default.svg` placeholder images for social sharing

### Changed
- **Semantic HTML improvements**: Replaced generic `<div>` wrappers with semantic elements (`<main>`, `<section>`, `<nav>`, `<header>`, `<footer>`, `<article>`) across all page components (Dashboard, ApiKeys, Usage, Settings, Login, Register, NotFound)
- **Layout component**: Enhanced with semantic `<header>`, `<main>`, and `<aside>` landmark elements
- **Hardcoded strings replaced**: Site name references consolidated into `SITE_NAME` constant to prevent drift

### Fixed
- **Pre-existing test failures**: Repaired broken tests in `AuthContext.test.tsx`, `ApiKeys.test.tsx`, `Login.test.tsx`, and `Settings.test.tsx` to align with SEO and semantic HTML changes
