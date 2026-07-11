import type { ReactNode } from 'react';
import { Sidebar, type ShellScreen } from './Sidebar';

type Props = {
  active: ShellScreen;
  onNavigate: (screen: ShellScreen) => void;
  onSearch?: () => void;
  onImport?: () => void;
  bookCount?: number;
  mapCount?: number;
  children: ReactNode;
};

/**
 * Global app shell — persistent sidebar plus a scrolling main region.
 * Wraps the primary screens (Library / Maps / Stats). Full-bleed surfaces
 * (canvas, import) render outside the shell.
 */
export function AppShell({ children, ...sidebar }: Props) {
  return (
    <div className="km-shell">
      <Sidebar {...sidebar} />
      <main className="km-shell__main">{children}</main>
    </div>
  );
}
