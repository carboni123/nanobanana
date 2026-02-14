import { useEffect } from 'react';
import { SITE_NAME, SITE_URL, OG_IMAGE_DEFAULT } from '../constants/seo';

interface DocumentMeta {
  title: string;
  description: string;
  /** Absolute canonical URL for this page (used as og:url) */
  url?: string;
  /** Open Graph image URL override (defaults to OG_IMAGE_DEFAULT) */
  image?: string;
}

/** OG and Twitter meta tags managed by this hook */
const META_TAGS: ReadonlyArray<{ property: string; build: (m: Required<DocumentMeta>) => string }> = [
  { property: 'og:title',            build: (m) => m.title },
  { property: 'og:description',      build: (m) => m.description },
  { property: 'og:type',             build: ()  => 'website' },
  { property: 'og:url',              build: (m) => m.url },
  { property: 'og:image',            build: (m) => m.image },
  { property: 'og:site_name',        build: ()  => SITE_NAME },
  { property: 'og:locale',           build: ()  => 'pt_BR' },
  { property: 'twitter:card',        build: ()  => 'summary_large_image' },
  { property: 'twitter:title',       build: (m) => m.title },
  { property: 'twitter:description', build: (m) => m.description },
  { property: 'twitter:image',       build: (m) => m.image },
];

/**
 * Helper: get or create a <meta> element by property or name attribute.
 * OG tags use `property`, Twitter tags use `name`.
 */
function upsertMeta(key: string, content: string): string {
  const isOg = key.startsWith('og:');
  const attr = isOg ? 'property' : 'name';
  const selector = `meta[${attr}="${key}"]`;
  let el = document.querySelector<HTMLMetaElement>(selector);
  const prev = el?.getAttribute('content') ?? '';
  if (el) {
    el.setAttribute('content', content);
  } else {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    el.content = content;
    document.head.appendChild(el);
  }
  return prev;
}

/**
 * Sets document.title, <meta name="description">, and all Open Graph / Twitter Card tags.
 * Resets to previous values on unmount so index.html defaults are restored.
 */
export function useDocumentMeta({ title, description, url, image }: DocumentMeta): void {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    // Description meta
    let descMeta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevDescription = descMeta?.getAttribute('content') ?? '';
    if (descMeta) {
      descMeta.setAttribute('content', description);
    } else {
      descMeta = document.createElement('meta');
      descMeta.name = 'description';
      descMeta.content = description;
      document.head.appendChild(descMeta);
    }

    // Build resolved meta values
    const resolved: Required<DocumentMeta> = {
      title,
      description,
      url: url ?? SITE_URL,
      image: image ?? OG_IMAGE_DEFAULT,
    };

    // Set OG + Twitter tags and collect previous values for cleanup
    const prevValues = META_TAGS.map((tag) => ({
      property: tag.property,
      prev: upsertMeta(tag.property, tag.build(resolved)),
    }));

    return () => {
      document.title = prevTitle;
      const dm = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (dm) dm.setAttribute('content', prevDescription);
      // Restore previous OG/Twitter values
      for (const { property, prev } of prevValues) {
        const isOg = property.startsWith('og:');
        const attr = isOg ? 'property' : 'name';
        const el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${property}"]`);
        if (el) el.setAttribute('content', prev);
      }
    };
  }, [title, description, url, image]);
}
