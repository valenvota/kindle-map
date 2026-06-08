import type { ClippingType } from '../types/highlight';
import { generateStableId } from './generateStableId';

export type ParsedClipping = {
  bookTitle: string;
  author: string | undefined;
  type: ClippingType;
  location: string | undefined;
  page: string | undefined;
  addedAt: string | undefined;
  text: string;
  rawMetadata: string;
  bookId: string;
  highlightId: string;
};

export type ParseResult = {
  clippings: ParsedClipping[];
  skipped: number;
};

const SEPARATOR = '==========';

// Matches: "Book Title (Author Name)" — author is optional
function parseBookHeader(line: string): { title: string; author: string | undefined } {
  // Strip BOM if present at start of file
  const cleaned = line.replace(/^﻿/, '').trim();

  const match = cleaned.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (match) {
    return { title: match[1].trim(), author: match[2].trim() };
  }
  return { title: cleaned, author: undefined };
}

// Detects clipping type from the metadata line (EN + ES)
function parseClippingType(meta: string): ClippingType {
  const lower = meta.toLowerCase();
  if (lower.includes('highlight') || lower.includes('subrayado')) return 'highlight';
  if (lower.includes('note') || lower.includes('nota')) return 'note';
  if (lower.includes('bookmark') || lower.includes('marcador')) return 'bookmark';
  return 'unknown';
}

// Extracts location range from metadata line
// EN: "Location 123-456" / "location 123"
// ES: "posición 123-456" / "posicion 123"
function parseLocation(meta: string): string | undefined {
  const match = meta.match(/(?:location|posici[oó]n)\s+([\d\-–]+)/i);
  return match?.[1];
}

// Extracts page from metadata line
// EN: "page 12" / ES: "página 12"
function parsePage(meta: string): string | undefined {
  const match = meta.match(/(?:page|p[aá]gina)\s+([\d\-–]+)/i);
  return match?.[1];
}

// Extracts date string (keeps raw, no parsing to Date to avoid locale issues)
function parseDate(meta: string): string | undefined {
  // After "| Added on" or "| Añadido el"
  const match = meta.match(/\|\s*(?:added on|a[ñn]adido el)\s+(.+)$/i);
  return match?.[1]?.trim();
}

export function parseKindleClippings(raw: string): ParseResult {
  const blocks = raw.split(SEPARATOR);
  const clippings: ParsedClipping[] = [];
  let skipped = 0;

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    // A valid block needs at least 2 lines: header + metadata
    // Text content is optional (bookmarks have no text)
    if (lines.length < 2) {
      if (lines.length > 0) skipped++;
      continue;
    }

    const headerLine = lines[0];
    const metaLine = lines[1];

    // Metadata lines start with "- Your Highlight" / "- Tu subrayado" etc.
    if (!metaLine.startsWith('-')) {
      skipped++;
      continue;
    }

    const { title, author } = parseBookHeader(headerLine);
    const type = parseClippingType(metaLine);
    const location = parseLocation(metaLine);
    const page = parsePage(metaLine);
    const addedAt = parseDate(metaLine);

    // Everything after the metadata line is the highlight text
    const text = lines.slice(2).join(' ').trim();

    // Bookmarks have no text — that's valid
    if (!text && type !== 'bookmark') {
      skipped++;
      continue;
    }

    const bookId = generateStableId([title, author]);
    const highlightId = generateStableId([title, author, location, page, text]);

    clippings.push({
      bookTitle: title,
      author,
      type,
      location,
      page,
      addedAt,
      text,
      rawMetadata: metaLine,
      bookId,
      highlightId,
    });
  }

  return { clippings, skipped };
}

// Groups parsed clippings by book, returns unique books with their highlights
export type ParsedBook = {
  id: string;
  title: string;
  author: string | undefined;
  highlights: ParsedClipping[];
};

export function groupByBook(clippings: ParsedClipping[]): ParsedBook[] {
  const map = new Map<string, ParsedBook>();

  for (const c of clippings) {
    if (!map.has(c.bookId)) {
      map.set(c.bookId, { id: c.bookId, title: c.bookTitle, author: c.author, highlights: [] });
    }
    map.get(c.bookId)!.highlights.push(c);
  }

  return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title));
}
