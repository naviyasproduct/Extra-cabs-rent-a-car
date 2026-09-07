/**
 * Renders a structured-data block. Invisible to people, read by search engines.
 *
 * The `<` escape is not decoration: without it a stray "</script>" inside any
 * piece of content would close the tag early and the rest of the JSON would be
 * parsed as HTML.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
