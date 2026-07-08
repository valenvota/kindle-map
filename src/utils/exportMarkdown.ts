import { db } from '../db/db';

import type { Book } from '../types/book';
import type { Highlight } from '../types/highlight';
import type { BookNote } from '../types/book';

const STATUS_LABEL: Record<string, string> = {
  'want-to-read': 'want-to-read',
  'reading': 'reading',
  'finished': 'finished',
};

const STATUS_EMOJI: Record<string, string> = {
  'want-to-read': '📚',
  'reading': '📖',
  'finished': '✅',
};

export async function exportBookToMarkdown(book: Book, highlights: Highlight[]): Promise<string> {
  // Load all notes for this book
  const notes = await db.bookNotes
    .where('bookId').equals(book.id)
    .toArray();
  const generalNote = notes.find((n) => !n.linkedHighlightId);
  const noteByHighlight = new Map<string, BookNote>(
    notes.filter((n) => n.linkedHighlightId).map((n) => [n.linkedHighlightId!, n]),
  );

  const exportedAt = new Date().toISOString().slice(0, 10);
  const importantHighlights = highlights.filter((h) => h.important);
  const lines: string[] = [];

  // ── YAML frontmatter ──────────────────────────────────────────────────────
  lines.push('---');
  lines.push(`title: "${book.title.replace(/"/g, '\\"')}"`);
  if (book.author) lines.push(`author: "${book.author.replace(/"/g, '\\"')}"`);
  if (book.readingStatus) lines.push(`status: ${STATUS_LABEL[book.readingStatus]}`);
  const tags = (book.tags ?? []).filter(Boolean);
  if (tags.length > 0) lines.push(`tags: [${tags.join(', ')}]`);
  lines.push(`source: ${book.source}`);
  lines.push(`highlights: ${highlights.length}`);
  if (importantHighlights.length > 0) lines.push(`important: ${importantHighlights.length}`);
  lines.push(`exported: ${exportedAt}`);
  lines.push('---');
  lines.push('');

  // ── Title block ───────────────────────────────────────────────────────────
  lines.push(`# ${book.title}`);
  if (book.author) lines.push(`*${book.author}*`);
  lines.push('');

  // Status + stats line
  const statParts: string[] = [];
  if (book.readingStatus) statParts.push(`${STATUS_EMOJI[book.readingStatus]} ${STATUS_LABEL[book.readingStatus]}`);
  statParts.push(`${highlights.length} highlight${highlights.length !== 1 ? 's' : ''}`);
  if (importantHighlights.length > 0) statParts.push(`⭐ ${importantHighlights.length} important`);
  statParts.push(book.source);
  lines.push(statParts.join(' · '));
  lines.push('');

  if (tags.length > 0) {
    lines.push(tags.map((t) => `#${t}`).join(' '));
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  // ── General notes ─────────────────────────────────────────────────────────
  if (generalNote?.text?.trim()) {
    lines.push('## Notes');
    lines.push('');
    lines.push(generalNote.text.trim());
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  // ── Highlights ────────────────────────────────────────────────────────────
  for (const h of highlights) {
    if (!h.text) continue;

    if (h.important) lines.push('⭐');
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

    const note = noteByHighlight.get(h.id);
    if (note?.text?.trim()) {
      lines.push(`💭 **Reflection:** ${note.text.trim()}`);
      lines.push('');
    }

    lines.push('---');
    lines.push('');
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
