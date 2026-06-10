export interface MarkdownH2 {
  text: string;
  id: string;
}

// ASCII: spaces→hyphens, lowercase, strip non-alphanumeric-hyphen.
// Non-ASCII (Japanese etc.): kept as-is; the browser handles URI encoding on anchor links.
export function slugifyHeading(text: string): string {
  const trimmed = text.trim();
  if (/^[\x00-\x7F]*$/.test(trimmed)) {
    return trimmed
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');
  }
  return trimmed;
}

// Extracts ## headings from Markdown source. Skips lines inside fenced code blocks.
// h3 and deeper are intentionally ignored — TOC only tracks h2 this release.
// Editorial rule: h2 text must be plain text (no links/bold/code) and unique within the article.
export function extractH2Headings(markdown: string): MarkdownH2[] {
  const results: MarkdownH2[] = [];
  let inCodeBlock = false;

  for (const line of markdown.split('\n')) {
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = line.match(/^## (.+)$/);
    if (match) {
      const text = match[1].trim();
      results.push({ text, id: slugifyHeading(text) });
    }
  }

  return results;
}
