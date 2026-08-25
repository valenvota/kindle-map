import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight, FileText, Sparkles, Waypoints } from 'lucide-react';
import { getRootMap, getRecentRooms } from '../db/mapsRepository';
import { getRecentNotes } from '../db/bookNotesRepository';
import { getRecentMarkedHighlights } from '../db/highlightsRepository';
import { getDisplayTitle } from '../utils/displayTitle';

type Props = {
  /** Open the Locus root canvas — App resolves/creates the root (ensureLocusRoot). */
  onOpenLocus: () => void;
  /** Enter a Room (its own map) — same primitive the canvas uses. */
  onOpenMap: (mapId: string) => void;
  /** Open a book, optionally focused on one highlight. */
  onOpenBook: (bookId: string, highlightId?: string) => void;
  /**
   * Live Room count, reusing the shell's existing `countMaps()` query (live maps
   * minus the Locus root) rather than adding one. In L1 every Room hangs directly
   * off the root, so this is the Room count.
   */
  roomCount?: number;
};

/** "Today" / "Yesterday" / "3 days ago" / "Apr 28" — calendar-day based. */
function relativeDay(iso: string): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(new Date()) - startOfDay(then)) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Notes are free text with no title — the first line stands in for one. */
function noteHeadline(text: string): string {
  return text.trim().split('\n')[0].trim() || 'Untitled note';
}

/**
 * Deterministic scatter — width, horizontal offset, vertical pull and tilt per
 * scrap. These ride normal block flow (each scrap is pulled up over the previous
 * with a negative margin), so scraps genuinely overlap and sit at different
 * widths like paper tossed on a desk, yet longer text still just pushes the pile
 * down instead of colliding. DOM order is the stacking order.
 */
const SCATTER = [
  { w: '60%', ml: '0%',  mt: '0px',   rot: '-2.2deg' },
  { w: '52%', ml: '43%', mt: '-24px', rot: '1.8deg' },
  { w: '57%', ml: '3%',  mt: '-12px', rot: '-1.1deg' },
  { w: '50%', ml: '45%', mt: '-20px', rot: '2.7deg' },
  { w: '55%', ml: '13%', mt: '-16px', rot: '-1.9deg' },
];

/**
 * Abstract Room mark — a small glyph standing in for the Room's shape. A real
 * mini-graph render is deliberately deferred (agreed: abstract now, improve later),
 * so this stays cheap and cannot degrade with many Rooms.
 */
function RoomMark({ index }: { index: number }) {
  const shapes = [
    <g key="a"><circle cx="9" cy="10" r="2.6" /><circle cx="21" cy="7" r="2" /><circle cx="20" cy="19" r="2.4" /><path d="M11 10.5 L19 8 M11.4 12 L18.6 17.6" /></g>,
    <g key="b"><circle cx="15" cy="8" r="2.4" /><circle cx="8" cy="19" r="2.2" /><circle cx="22" cy="19" r="2.2" /><path d="M13.4 10 L9.4 17 M16.6 10 L20.6 17" /></g>,
    <g key="c"><circle cx="8" cy="9" r="2.2" /><circle cx="19" cy="12" r="2.6" /><circle cx="11" cy="20" r="2" /><path d="M10 10 L17 11.6 M17.6 14 L12.4 18.4" /></g>,
  ];
  return (
    <span className="desk-row__mark" aria-hidden="true">
      <svg viewBox="0 0 30 28" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        {shapes[index % shapes.length]}
      </svg>
    </span>
  );
}

/**
 * Desk — the return surface (Loci L1, Slice 4).
 *
 * A threshold, not a dashboard: it holds no metrics and nothing is edited here.
 * Its single question is "what was I thinking about?", and every element is a
 * door back into the work.
 *
 * Composition follows the approved mockup: a warm wooden desk surface with the
 * physical, tactile material on the left (highlights as paper snippets) and the
 * structured column on the right (Continue in Locus, Rooms, Notes). The wood is
 * CSS-generated and lives behind `--desk-wood-*` tokens, so a photographic
 * texture can replace it later without touching this component.
 *
 * Step 2A ships surface + composition; the left/right content is placeholder
 * (see above) until the recency queries land.
 */
export function DeskPage({ onOpenLocus, onOpenMap, onOpenBook, roomCount }: Props) {
  const root = useLiveQuery(() => getRootMap(), []);
  const marked = useLiveQuery(() => getRecentMarkedHighlights(5), []);
  const rooms = useLiveQuery(() => getRecentRooms(3), []);
  const notes = useLiveQuery(() => getRecentNotes(3), []);
  const locusName = root?.name ?? 'My Locus';

  return (
    <div className="desk">
      <div className="desk__inner">
        <header className="desk__head">
          <h1 className="desk__title">Desk</h1>
          <p className="desk__sub">Your active space for thinking.</p>
        </header>

        <div className="desk__grid">
          {/* ── Left: the physical surface ─────────────────────────────── */}
          <section className="desk__col">
            <p className="desk__eyebrow"><Sparkles /> Recent Highlights</p>

            {marked && marked.length === 0 ? (
              <p className="desk__empty">
                Nothing marked yet. Star a highlight in a book and it lands here.
              </p>
            ) : (
              <div className="desk__snips">
                {(marked ?? []).map((h, i) => {
                  const sc = SCATTER[i % SCATTER.length];
                  const where = h.page ?? h.location;
                  return (
                    <article
                      key={h.id}
                      className="desk-snip"
                      style={{
                        ['--w' as string]: sc.w,
                        ['--ml' as string]: sc.ml,
                        ['--mt' as string]: sc.mt,
                        ['--rot' as string]: sc.rot,
                      }}
                    >
                      <button
                        className="desk-snip__paper"
                        onClick={() => onOpenBook(h.bookId, h.id)}
                        title={h.text}
                      >
                        <span className="desk-snip__text">{h.text}</span>
                        <span className="desk-snip__src">
                          Source: {getDisplayTitle(h.bookTitle)}
                          {where && <> <span className="desk-snip__dot">·</span> {where}</>}
                        </span>
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Right: the structured column ───────────────────────────── */}
          <section className="desk__col">
            <p className="desk__eyebrow"><Waypoints /> Continue in Locus</p>

            {/* Continue — a stacked notebook object, not a flat tile. Opens the
                Locus root; returning to the *last* Room needs lastRoomId, which
                is deliberately deferred (agreed) and will land later. */}
            <button className="desk-book" onClick={onOpenLocus}>
              <span className="desk-book__stack" aria-hidden="true" />
              <span className="desk-book__page">
                <span className="desk-book__bind" aria-hidden="true" />
                <span className="desk-book__title">{locusName}</span>
                <span className="desk-book__note">
                  Where your Rooms, notes and connections live.
                </span>
                <span className="desk-book__cta">
                  Open in Locus <ArrowRight />
                </span>
              </span>
            </button>

            {rooms && rooms.length > 0 && (
              <div className="desk-panel">
                <p className="desk-panel__head"><Waypoints /> Recent Rooms</p>
                <ul className="desk-panel__list">
                  {rooms.map((r, i) => (
                    <li key={r.id}>
                      <button className="desk-row" onClick={() => onOpenMap(r.id)}>
                        <RoomMark index={i} />
                        <span className="desk-row__body">
                          <span className="desk-row__name">{r.name}</span>
                          <span className="desk-row__meta">
                            {r.nodeCount} {r.nodeCount === 1 ? 'node' : 'nodes'} · Edited {relativeDay(r.lastActivity).toLowerCase()}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {notes && notes.length > 0 && (
              <div className="desk-panel">
                <p className="desk-panel__head"><FileText /> Recent Notes</p>
                <ul className="desk-panel__list">
                  {notes.map((n) => (
                    <li key={n.id}>
                      <button className="desk-row" onClick={() => onOpenBook(n.bookId)} title={n.text}>
                        <span className="desk-row__mark desk-row__mark--doc" aria-hidden="true"><FileText /></span>
                        <span className="desk-row__body">
                          <span className="desk-row__name">{noteHeadline(n.text)}</span>
                          <span className="desk-row__meta">{getDisplayTitle(n.bookTitle)}</span>
                        </span>
                        <span className="desk-row__when">{relativeDay(n.updatedAt)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {roomCount !== undefined && roomCount > 0 && (
              <p className="desk__count">
                {roomCount} {roomCount === 1 ? 'Room' : 'Rooms'} in {locusName}
              </p>
            )}
          </section>
        </div>

        <p className="desk__quote">
          <span>“We shape our tools, and thereafter our tools shape us.”</span>
          <span className="desk__quote-by">— M. McLuhan</span>
        </p>
      </div>
    </div>
  );
}
