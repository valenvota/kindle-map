import { Home, BookOpen, Shapes, Map, BarChart2, Upload, Search } from 'lucide-react';

export type ShellScreen = 'desk' | 'library' | 'locus' | 'maps' | 'stats';

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
 * Primary nav is the Loci mental model (Desk / Library / Locus); Maps (legacy
 * fallback) and Stats sit in a demoted secondary group. Relabel/regroup only —
 * the visual language redesign is a later slice.
 */
export function Sidebar({ active, onNavigate, onSearch, onImport, bookCount, mapCount }: Props) {
  const primary: NavDef[] = [
    { key: 'desk',    label: 'Desk',    icon: <Home /> },
    { key: 'library', label: 'Library', icon: <BookOpen />, count: bookCount },
    { key: 'locus',   label: 'Locus',   icon: <Shapes /> },
  ];
  const secondary: NavDef[] = [
    { key: 'maps',  label: 'Maps',  icon: <Map />,       count: mapCount },
    { key: 'stats', label: 'Stats', icon: <BarChart2 /> },
  ];

  const renderNav = (item: NavDef) => (
    <button
      key={item.key}
      className={`km-nav${active === item.key ? ' on' : ''}`}
      onClick={() => onNavigate(item.key)}
    >
      {item.icon}
      {item.label}
      {typeof item.count === 'number' && <span className="km-nav__count">{item.count}</span>}
    </button>
  );

  return (
    <aside className="km-side">
      <div className="km-side__brand">
        <div className="km-side__mark">L</div>
        <div className="km-side__name">Loci</div>
      </div>

      <button className="km-side__search" onClick={onSearch}>
        <Search size={15} strokeWidth={1.6} />
        <span>Search books &amp; highlights</span>
        <kbd>⌘K</kbd>
      </button>

      <div className="km-side__label">Workspace</div>
      <nav className="km-side__nav">
        {primary.map(renderNav)}
      </nav>

      <div className="km-side__label">More</div>
      <nav className="km-side__nav">
        {secondary.map(renderNav)}
      </nav>

      <div className="km-side__spacer" />

      <button className="km-side__import" onClick={onImport}>
        <Upload />
        Import highlights
      </button>
    </aside>
  );
}
