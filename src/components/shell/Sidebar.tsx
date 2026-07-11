import { BookOpen, Map, BarChart2, Upload, Search } from 'lucide-react';

export type ShellScreen = 'library' | 'maps' | 'stats';

type Props = {
  active: ShellScreen;
  onNavigate: (screen: ShellScreen) => void;
  onSearch?: () => void;
  onImport?: () => void;
  bookCount?: number;
  mapCount?: number;
};

type NavDef = { key: ShellScreen; label: string; icon: React.ReactNode; count?: number };

/**
 * Persistent midnight ink-blue sidebar — the app's global navigation shell.
 * Top-level nav (Library / Maps / Stats), ⌘K search, and Import at the base.
 */
export function Sidebar({ active, onNavigate, onSearch, onImport, bookCount, mapCount }: Props) {
  const nav: NavDef[] = [
    { key: 'library', label: 'Library', icon: <BookOpen />, count: bookCount },
    { key: 'maps',    label: 'Maps',    icon: <Map />,      count: mapCount },
    { key: 'stats',   label: 'Stats',   icon: <BarChart2 /> },
  ];

  return (
    <aside className="km-side">
      <div className="km-side__brand">
        <div className="km-side__mark">K</div>
        <div className="km-side__name">KindleMap</div>
      </div>

      <button className="km-side__search" onClick={onSearch}>
        <Search size={15} strokeWidth={1.6} />
        <span>Search books &amp; highlights</span>
        <kbd>⌘K</kbd>
      </button>

      <div className="km-side__label">Workspace</div>
      <nav className="km-side__nav">
        {nav.map((n) => (
          <button
            key={n.key}
            className={`km-nav${active === n.key ? ' on' : ''}`}
            onClick={() => onNavigate(n.key)}
          >
            {n.icon}
            {n.label}
            {typeof n.count === 'number' && <span className="km-nav__count">{n.count}</span>}
          </button>
        ))}
      </nav>

      <div className="km-side__spacer" />

      <button className="km-side__import" onClick={onImport}>
        <Upload />
        Import highlights
      </button>
    </aside>
  );
}
