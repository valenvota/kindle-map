// ─── Types ───────────────────────────────────────────────────────────────────

export type AttentionIssue =
  | 'missing-author'
  | 'underscores'
  | 'junk-source'
  | 'artifact'
  | 'author-in-title';

export type MetadataSuggestion = {
  title: string;
  hasChanges: boolean;
};

// ─── Known junk sources ───────────────────────────────────────────────────────

const JUNK_SOURCES = [
  'oceanofpdf',
  "anna's archive",
  'annas archive',
  'lectulandia',
  'z-library',
  'zlibrary',
  'z library',
];

// ─── Clean ───────────────────────────────────────────────────────────────────

/**
 * Returns a deterministically cleaned title suggestion.
 * Never mutates the author — author changes must be manual.
 */
export function cleanBookMetadata(title: string): MetadataSuggestion {
  let t = title;

  // Replace underscores with spaces
  t = t.replace(/_/g, ' ');

  // Remove known junk source names in common patterns:
  //   "OceanofPDF - Title", "Title - OceanofPDF", "(OceanofPDF)", "OceanofPDF: "
  for (const junk of JUNK_SOURCES) {
    const esc = junk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    t = t.replace(
      new RegExp(
        `\\s*[-–—:]\\s*${esc}|${esc}\\s*[-–—:]\\s*|\\(\\s*${esc}\\s*\\)`,
        'gi',
      ),
      '',
    );
    // Also strip if it appears standalone at start/end
    t = t.replace(new RegExp(`^${esc}\\s+|\\s+${esc}$`, 'gi'), '');
  }

  // Remove Unabridged / Abridged artifacts
  t = t.replace(/\s*\(unabridged\)/gi, '');
  t = t.replace(/\s*\(abridged\)/gi, '');
  t = t.replace(/\bunabridged\b/gi, '');
  t = t.replace(/\babridged\b/gi, '');

  // Normalize spacing and trim leading/trailing punctuation artifacts
  t = t.replace(/\s+/g, ' ').trim();
  t = t.replace(/^[-–—:,\s]+|[-–—:,\s]+$/g, '').trim();

  return { title: t, hasChanges: t !== title };
}

// ─── Detect issues ───────────────────────────────────────────────────────────

/**
 * Returns a list of issues that make a book need attention.
 * Pure function — safe to call on every render.
 */
export function detectAttentionIssues(title: string, author?: string): AttentionIssue[] {
  const issues: AttentionIssue[] = [];
  const lower = title.toLowerCase();

  if (!author) issues.push('missing-author');

  if (title.includes('_')) issues.push('underscores');

  if (JUNK_SOURCES.some((j) => lower.includes(j))) issues.push('junk-source');

  if (/unabridged|abridged/i.test(title)) issues.push('artifact');

  // "Something – Something" when author is missing → author is likely baked into title
  if (!author && /^.+\s+[-–—]\s+.+$/.test(title)) issues.push('author-in-title');

  return issues;
}

export function issueLabel(issue: AttentionIssue): string {
  switch (issue) {
    case 'missing-author':   return 'Missing author';
    case 'underscores':      return 'Has underscores';
    case 'junk-source':      return 'Source name in title';
    case 'artifact':         return 'Has artifact';
    case 'author-in-title':  return 'Author may be in title';
  }
}
