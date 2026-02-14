import { useEffect } from 'react';

const JSONLD_ATTR = 'data-jsonld-page';

/**
 * Injects a WebPage JSON-LD script into <head> for the current page.
 * Removes the script on unmount so each page manages its own structured data.
 */
export function useJsonLd(schema: Record<string, unknown>): void {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute(JSONLD_ATTR, 'true');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
    // Stringify to detect deep changes without requiring stable references
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(schema)]);
}
