/** JSON-LD を <script type="application/ld+json"> として埋め込む（詳細ページ用） */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
