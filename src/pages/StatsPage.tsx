import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, BookOpen, Quote, Star, StickyNote, Tag } from 'lucide-react';
import { db } from '../db/db';

const STATUS_CONFIG = {
  'want-to-read': { label: 'Want to read', emoji: '📚', color: 'bg-indigo-400' },
  'reading':      { label: 'Reading',       emoji: '📖', color: 'bg-amber-400' },
  'finished':     { label: 'Finished',      emoji: '✅', color: 'bg-green-400' },
} as const;

type Props = { onBack: () => void };

export function StatsPage({ onBack }: Props) {
  const books      = useLiveQuery(() => db.books.toArray(), []);
  const highlights = useLiveQuery(() => db.highlights.toArray(), []);
  const bookNotes  = useLiveQuery(() => db.bookNotes.toArray(), []);

  const stats = useMemo(() => {
    if (!books || !highlights || !bookNotes) return null;

    const totalBooks      = books.length;
    const totalHighlights = highlights.length;
    const importantCount  = highlights.filter((h) => h.important).length;
    const booksWithNotes  = new Set(bookNotes.map((n) => n.bookId)).size;

    // Status breakdown
    const byStatus = {
      'want-to-read': books.filter((b) => b.readingStatus === 'want-to-read').length,
      'reading':      books.filter((b) => b.readingStatus === 'reading').length,
      'finished':     books.filter((b) => b.readingStatus === 'finished').length,
      'none':         books.filter((b) => !b.readingStatus).length,
    };

    // Top tags (by book count, top 8)
    const tagCounts = new Map<string, number>();
    books.forEach((b) => (b.tags ?? []).filter(Boolean).forEach((t) => {
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    }));
    const topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    // Most highlighted books (top 6)
    const topBooks = [...books]
      .filter((b) => b.totalHighlights > 0)
      .sort((a, b) => b.totalHighlights - a.totalHighlights)
      .slice(0, 6);

    // Avg highlights per book (books with at least 1)
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
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Library
          </button>
          <h1 className="text-lg font-semibold text-stone-900">Reading Stats</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {!stats ? (
          <div className="py-20 text-center text-sm text-stone-400">Loading…</div>
        ) : (
          <div className="flex flex-col gap-8">

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard icon={<BookOpen className="h-4 w-4 text-amber-500" />} value={stats.totalBooks} label="Books" />
              <StatCard icon={<Quote className="h-4 w-4 text-blue-500" />} value={stats.totalHighlights} label="Highlights" />
              <StatCard icon={<Star className="h-4 w-4 text-amber-500" />} value={stats.importantCount} label="Important" />
              <StatCard icon={<StickyNote className="h-4 w-4 text-emerald-500" />} value={stats.booksWithNotes} label="With notes" />
            </div>

            {/* Reading status */}
            <Section title="Reading status">
              <div className="flex flex-col gap-3">
                {(Object.entries(STATUS_CONFIG) as [keyof typeof STATUS_CONFIG, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([key, cfg]) => {
                  const count = stats.byStatus[key];
                  const pct = stats.totalBooks > 0 ? Math.round((count / stats.totalBooks) * 100) : 0;
                  return (
                    <div key={key}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-stone-700">{cfg.emoji} {cfg.label}</span>
                        <span className="text-stone-400">{count} book{count !== 1 ? 's' : ''} · {pct}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                        <div
                          className={`h-full rounded-full transition-all ${cfg.color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {stats.byStatus.none > 0 && (
                  <div>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-stone-400">— No status</span>
                      <span className="text-stone-300">{stats.byStatus.none} book{stats.byStatus.none !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-stone-200 transition-all"
                        style={{ width: `${Math.round((stats.byStatus.none / stats.totalBooks) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Section>

            {/* Most highlighted */}
            {stats.topBooks.length > 0 && (
              <Section title="Most highlighted books">
                <div className="flex flex-col divide-y divide-stone-100">
                  {stats.topBooks.map((book, i) => (
                    <div key={book.id} className="flex items-center gap-3 py-2.5">
                      <span className="w-5 shrink-0 text-right text-xs font-semibold text-stone-300">
                        {i + 1}
                      </span>
                      {book.coverImage && (
                        <img src={book.coverImage} alt="" className="h-8 w-6 shrink-0 rounded object-cover" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-stone-800">{book.title}</p>
                        {book.author && <p className="truncate text-xs text-stone-400">{book.author}</p>}
                      </div>
                      <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
                        {book.totalHighlights}
                      </span>
                    </div>
                  ))}
                </div>
                {stats.avgHighlights > 0 && (
                  <p className="mt-3 text-xs text-stone-400">
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
                      className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1 text-sm"
                    >
                      <Tag className="h-3 w-3 text-stone-400" />
                      <span className="font-medium text-stone-700">#{tag}</span>
                      <span className="text-stone-400">{count}</span>
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
    <div className="flex flex-col gap-1 rounded-2xl border border-stone-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center gap-1.5 text-xs font-medium text-stone-400">
        {icon}
        {label}
      </div>
      <p className="text-3xl font-semibold text-stone-900">{value.toLocaleString()}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-stone-400">{title}</h2>
      <div className="rounded-2xl border border-stone-200 bg-white px-5 py-4 shadow-sm">
        {children}
      </div>
    </div>
  );
}
