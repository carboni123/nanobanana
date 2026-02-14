/**
 * JSON-LD Structured Data Component
 *
 * Renders one or more <script type="application/ld+json"> blocks in the DOM.
 * Used for Schema.org structured data (WebApplication, Organization, WebPage).
 */

interface JsonLdProps {
  /** A single JSON-LD object or an array of objects to render */
  data: Record<string, unknown> | Record<string, unknown>[];
}

export default function JsonLd({ data }: JsonLdProps) {
  const items = Array.isArray(data) ? data : [data];

  return (
    <>
      {items.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
