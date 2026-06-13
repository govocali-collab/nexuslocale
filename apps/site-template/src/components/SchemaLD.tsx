type SchemaLDProps = { data: Record<string, unknown> | Record<string, unknown>[] };

export function SchemaLD({ data }: SchemaLDProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
