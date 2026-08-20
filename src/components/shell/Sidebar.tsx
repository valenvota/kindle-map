import { Home, BookOpen, Waypoints, Search, Map, BarChart2, Upload } from 'lucide-react';

export type ShellScreen = 'desk' | 'library' | 'locus' | 'maps' | 'stats';

type Props = {
  active: ShellScreen;
  onNavigate: (screen: ShellScreen) => void;
  onSearch?: () => void;
  onImport?: () => void;
  /** Accepted for shell-prop compatibility; the Loci nav no longer shows counts. */
  bookCount?: number;
  mapCount?: number;
};

type NavDef = { key: ShellScreen; label: string; icon: React.ReactNode };

/**
 * Persistent sidebar — the app's global navigation shell, styled to the approved
 * Loci mockups: near-black warm charcoal, a serif "Loci" wordmark, and the Loci
 * mental model as the primary nav (Desk / Library / Locus / Search). Maps (the
 * L1 fallback) and Stats stay reachable as quiet secondary utilities under a
 * divider — subordinate, not hidden, while Maps remains our fallback.
 */
export function Sidebar({ active, onNavigate, onSearch, onImport }: Props) {
  const primary: NavDef[] = [
    { key: 'desk',    label: 'Desk',    icon: <Home /> },
    { key: 'library', label: 'Library', icon: <BookOpen /> },
    { key: 'locus',   label: 'Locus',   icon: <Waypoints /> },
  ];
  const secondary: NavDef[] = [
    { key: 'maps',  label: 'Maps',  icon: <Map /> },
    { key: 'stats', label: 'Stats', icon: <BarChart2 /> },
  ];

  const renderNav = (item: NavDef, muted = false) => (
    <button
      key={item.key}
      className={`km-nav${muted ? ' km-nav--muted' : ''}${active === item.key ? ' on' : ''}`}
      onClick={() => onNavigate(item.key)}
    >
      {item.icon}
      {item.label}
    </button>
  );

  return (
    <aside className="km-side">
      <div className="km-side__brand">
        <span className="km-side__word">Loci</span>
      </div>

      <nav className="km-side__nav">
        {primary.map((item) => renderNav(item))}
        {/* Search is an action (opens the existing ⌘K command palette), not a screen. */}
        <button className="km-nav" onClick={onSearch}>
          <Search />
          Search
        </button>
      </nav>

      <div className="km-side__divider" />

      <nav className="km-side__nav">
        {secondary.map((item) => renderNav(item, true))}
      </nav>

      <div className="km-side__spacer" />

      <button className="km-side__import" onClick={onImport}>
        <Upload />
        Import highlights
      </button>
    </aside>
  );
}
