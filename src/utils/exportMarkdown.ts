import type { Book } from '../types/book';
import type { Highlight } from '../types/highlight';

export function exportBookToMarkdown(book: Book, highlights: Highlight[]): string {
  const lines: string[] = [];

  lines.push(`# ${book.title}`);
  if (book.author) lines.push(`*${book.author}*`);
  lines.push('');
  lines.push(`${highlights.length} highlight${highlights.length !== 1 ? 's' : ''}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const h of highlights) {
    if (h.text) {
      lines.push(`> ${h.text}`);
      lines.push('');
      const meta: string[] = [];
      if (h.location) meta.push(`Location ${h.location}`);
      if (h.page) meta.push(`Page ${h.page}`);
      if (h.addedAt) meta.push(h.addedAt);
      if (meta.length > 0) {
        lines.push(`*${meta.join(' · ')}*`);
        lines.push('');
      }
    }
  }

  return lines.join('\n');
}

export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.md') ? filename : `${filename}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
