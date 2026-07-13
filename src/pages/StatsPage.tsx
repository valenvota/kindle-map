import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { BookOpen, Quote, Star, StickyNote, Tag } from 'lucide-react';
import { db } from '../db/db';
import { getDisplayTitle } from '../utils/displayTitle';

const STATUS_CONFIG = {
  'want-to-read': { label: 'Want to read', dot: 'want',     barColor: '#7A6A54' },
  'reading':      { label: 'Reading',      dot: 'reading',  barColor: '#3D6B8E' },
  'finished':     { label: 'Finished',     dot: 'finished', barColor: '#3A7A5C' },
} as const;

export function StatsPage() {
  const books      = useLiveQuery(() => db.books.toArray(), []);
  const highlights = useLiveQuery(() => db.highlights.toArray(), []);
  const bookNotes  = useLiveQuery(() => db.bookNotes.toArray(), []);

  const stats = useMemo(() => {
    if (!books || !highlights || !bookNotes) return null;

    const totalBooks      = books.length;
    const totalHighlights = highlights.length;
    const importantCount  = highlights.filter((h) => h.important).length;
    const booksWithNotes  = new Set(bookNotes.map((n) => n.bookId)).size;

    const byStatus = {
      'want-to-read': books.filter((b) => b.readingStatus === 'want-to-read').length,
      'reading':      books.filter((b) => b.readingStatus === 'reading').length,
      'finished':     books.filter((b) => b.readingStatus === 'finished').length,
      'none':         books.filter((b) => !b.readingStatus).length,
    };

    const tagCounts = new Map<string, number>();
    books.forEach((b) => (b.tags ?? []).filter(Boolean).forEach((t) => {
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    }));
    const topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const topBooks = [...books]
      .filter((b) => b.totalHighlights > 0)
      .sort((a, b) => b.totalHighlights - a.totalHighlights)
      .slice(0, 6);

    const booksWithHighlights = books.filter((b) => b.totalHighlights > 0);
    const avgHighlights = booksWithHighlights.length
      ? Math.round(totalHighlights / booksWithHighlights.length)
      : 0;

    return {
      totalBooks, totalHighlights, importantCount,
      booksWithNotes, byStatus, topTags, topBooks, avgHighlights,
    };
  }, [books, highlights, bookNotes]);

  return (
    <div className="lib-inner">
      <header className="lib-masthead">
        <h1 className="lib-h1">Reading Stats</h1>
      </header>

      <main className="mx-auto max-w-3xl pb-8">
        {!stats ? (
          <div className="py-20 text-center text-sm" style={{ color: 'var(--text-3)' }}>Loading…</div>
        ) : (
          <div className="flex flex-col gap-8">

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard
                icon={<BookOpen className="h-4 w-4" style={{ color: 'var(--brand)' }} />}
                value={stats.totalBooks} label="Books"
              />
              <StatCard
                icon={<Quote className="h-4 w-4" style={{ color: 'var(--accent)' }} />}
                value={stats.totalHighlights} label="Highlights"
              />
              <StatCard
                icon={<Star className="h-4 w-4" style={{ color: 'var(--warm)' }} />}
                value={stats.importantCount} label="Important"
              />
              <StatCard
                icon={<StickyNote className="h-4 w-4" style={{ color: '#3A7A5C' }} />}
                value={stats.booksWithNotes} label="With notes"
              />
            </div>

            {/* Reading status */}
            <Section title="Reading status">
              <div className="flex flex-col gap-4">
                {(Object.entries(STATUS_CONFIG) as [keyof typeof STATUS_CONFIG, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([key, cfg]) => {
                  const count = stats.byStatus[key];
                  const pct = stats.totalBooks > 0 ? Math.round((count / stats.totalBooks) * 100) : 0;
                  return (
                    <div key={key}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 font-medium" style={{ color: 'var(--text)' }}><span className={`lib-dot lib-dot--${cfg.dot}`} />{cfg.label}</span>
                        <span style={{ color: 'var(--text-3)' }}>{count} book{count !== 1 ? 's' : ''} · {pct}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-2)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: cfg.barColor }}
                        />
                      </div>
                    </div>
                  );
                })}
                {stats.byStatus.none > 0 && (
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium" style={{ color: 'var(--text-3)' }}>— No status</span>
                      <span style={{ color: 'var(--text-3)' }}>{stats.byStatus.none} book{stats.byStatus.none !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-2)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.round((stats.byStatus.none / stats.totalBooks) * 100)}%`, background: 'var(--border-md)' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Section>

            {/* Most highlighted */}
            {stats.topBooks.length > 0 && (
              <Section title="Most highlighted books">
                <div className="flex flex-col divide-y" style={{ borderColor: 'var(--border)' }}>
                  {stats.topBooks.map((book, i) => (
                    <div key={book.id} className="flex items-center gap-3 py-3">
                      <span className="w-5 shrink-0 text-right text-xs font-bold" style={{ color: 'var(--text-3)' }}>
                        {i + 1}
                      </span>
                      {book.coverImage && (
                        <img src={book.coverImage} alt="" className="h-8 w-6 shrink-0 rounded object-cover" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium" style={{ color: 'var(--text)' }}>{getDisplayTitle(book.title)}</p>
                        {book.author && <p className="truncate text-xs" style={{ color: 'var(--text-3)' }}>{book.author}</p>}
                      </div>
                      <span
                        className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
                      >
                        {book.totalHighlights}
                      </span>
                    </div>
                  ))}
                </div>
                {stats.avgHighlights > 0 && (
                  <p className="mt-3 text-xs" style={{ color: 'var(--text-3)' }}>
                    Average {stats.avgHighlights} highlights per book
                  </p>
                )}
              </Section>
            )}

            {/* Top tags */}
            {stats.topTags.length > 0 && (
              <Section title="Top tags">
                <div className="flex flex-wrap gap-2">
                  {stats.topTags.map(([tag, count]) => (
                    <div
                      key={tag}
                      className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm"
                      style={{ borderColor: 'var(--border-md)', background: 'var(--surface)' }}
                    >
                      <Tag className="h-3 w-3" style={{ color: 'var(--text-3)' }} />
                      <span className="font-medium" style={{ color: 'var(--text)' }}>#{tag}</span>
                      <span style={{ color: 'var(--text-3)' }}>{count}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div
      className="flex flex-col gap-1.5 rounded-xl border px-5 py-4 shadow-sm"
      style={{ borderColor: 'var(--border-md)', background: 'var(--surface)' }}
    >
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-3)' }}>
          {label}
        </span>
      </div>
      <p className="text-3xl font-light" style={{ color: 'var(--brand)' }}>{value.toLocaleString()}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2
        className="mb-4 text-[10px] font-bold uppercase tracking-[0.15em]"
        style={{ color: 'var(--text-3)' }}
      >
        {title}
      </h2>
      <div
        className="rounded-xl border px-5 py-4 shadow-sm"
        style={{ borderColor: 'var(--border-md)', background: 'var(--surface)' }}
      >
        {children}
      </div>
    </div>
  );
}
