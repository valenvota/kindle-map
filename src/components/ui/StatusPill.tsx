import type { HTMLAttributes, ReactNode } from 'react';

export type ReadingStatusValue = 'want-to-read' | 'reading' | 'finished';

const STATUS_LABEL: Record<ReadingStatusValue, string> = {
  'want-to-read': 'Want to read',
  'reading': 'Reading',
  'finished': 'Finished',
};

const STATUS_DOT: Record<ReadingStatusValue, string> = {
  'want-to-read': 'km-status__dot--want',
  'reading': 'km-status__dot--reading',
  'finished': 'km-status__dot--finished',
};

/**
 * Quiet reading-status indicator — a small dot + label in neutral type.
 * Status is communicated by form, not by a loud colored fill.
 */
export function StatusPill({ status, label }: { status: ReadingStatusValue; label?: string }) {
  return (
    <span className="km-status">
      <span className={`km-status__dot ${STATUS_DOT[status]}`} />
      {label ?? STATUS_LABEL[status]}
    </span>
  );
}

type PillProps = HTMLAttributes<HTMLSpanElement> & { children: ReactNode };

/** Generic small capsule (tags, counts, meta). Colors set by the caller. */
export function Pill({ className = '', children, ...rest }: PillProps) {
  return (
    <span className={['km-pill', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </span>
  );
}
