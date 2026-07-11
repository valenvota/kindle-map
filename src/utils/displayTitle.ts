import { cleanBookMetadata } from './cleanBookMetadata';

/**
 * Display-only title cleanup for the Library visual layer.
 *
 * Real Kindle / PDF imports carry filename cruft that the curated mockups never
 * showed: source domains (OceanofPDF.com, dokumen.pub), ISBN suffixes, slug
 * hyphenation, underscores, extension noise. This produces a human-readable
 * title for rendering ONLY — it never mutates stored data. The full original
 * title is kept for tooltips via {@link fullTitle}.
 */

const SOURCE_TOKENS = [
  /oceanofpdf\.com/gi,
  /oceanofpdf/gi,
  /dokumen\.pub(?:\.[a-z]+)?/gi,
  /z-?lib(?:rary)?/gi,
  /lectulandia/gi,
  /anna'?s\s+archive/gi,
];

export function getDisplayTitle(raw: string | undefined): string {
  let t = (raw ?? '').trim();
  if (!t) return 'Untitled';

  // Strip known source domains / site names wherever they appear.
  for (const re of SOURCE_TOKENS) t = t.replace(re, ' ');

  // Drop ISBN-like digit runs and trailing "-<isbn>" fragments.
  t = t.replace(/\b\d{9,13}\b/g, ' ');
  t = t.replace(/[-_]\d{5,}/g, ' ');

  // Underscores are always separators in these filenames.
  t = t.replace(/_/g, ' ');

  // Slug detection: many hyphens and few spaces ⇒ hyphens are word separators.
  const hyphens = (t.match(/-/g) ?? []).length;
  const spaces = (t.match(/ /g) ?? []).length;
  if (hyphens >= 3 && hyphens > spaces) t = t.replace(/-/g, ' ');

  // Collapse whitespace and shave leftover edge punctuation.
  t = t.replace(/\s+/g, ' ').trim();
  t = t.replace(/^[-–—:,.\s]+|[-–—:,.\s]+$/g, '').trim();

  // Run the existing known-junk cleaner for "- OceanofPDF" style patterns.
  t = cleanBookMetadata(t).title;

  if (!t) return (raw ?? '').trim() || 'Untitled';

  // Slug titles come out lowercase — lift the first letter.
  if (/^[a-z]/.test(t)) t = t.charAt(0).toUpperCase() + t.slice(1);

  return t;
}

/** Shorten a (already cleaned) title on a word boundary for tight surfaces. */
export function getShortTitle(display: string, max = 70): string {
  if (display.length <= max) return display;
  const cut = display.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.55 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
}

/** The untouched original, for `title=` tooltips. */
export function fullTitle(raw: string | undefined): string {
  return (raw ?? '').trim();
}
