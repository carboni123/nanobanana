import { useEffect } from 'react';

interface DocumentMeta {
  title: string;
  description: string;
}

/**
 * Sets document.title and the <meta name="description"> tag.
 * Resets to defaults from index.html on unmount.
 */
export function useDocumentMeta({ title, description }: DocumentMeta): void {
  useEffect(() => {
    const prevTitle = document.title;

    document.title = title;

    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevDescription = meta?.getAttribute('content') ?? '';

    if (meta) {
      meta.setAttribute('content', description);
    } else {
      meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = description;
      document.head.appendChild(meta);
    }

    return () => {
      document.title = prevTitle;
      const descMeta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (descMeta) {
        descMeta.setAttribute('content', prevDescription);
      }
    };
  }, [title, description]);
}
