import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { countBooks } from './db/booksRepository';
import { countMaps } from './db/mapsRepository';
import { countStrokes } from './db/canvasStrokesRepository';
import { ImportPage } from './pages/ImportPage';
import { LibraryPage } from './pages/LibraryPage';
import { MapsPage } from './pages/MapsPage';
import { StatsPage } from './pages/StatsPage';
import { ReadingCanvas } from './components/canvas/ReadingCanvas';
import { BookDetailView } from './components/book/BookDetailView';
import { CommandPalette } from './components/search/CommandPalette';
import { AppShell } from './components/shell/AppShell';
import type { ShellScreen } from './components/shell/Sidebar';
import { WelcomeScreen } from './components/onboarding/WelcomeScreen';
import { ImportGuide } from './components/onboarding/ImportGuide';
import { SampleDataBanner } from './components/onboarding/SampleDataBanner';
import { GettingStartedChecklist } from './components/onboarding/GettingStartedChecklist';
import { readOnboarding, writeOnboarding, type OnboardingState } from './utils/onboarding';
import { loadSampleData, clearSampleData } from './utils/sampleData';

type Screen = 'import' | 'library' | 'maps' | 'canvas' | 'stats';

// Which onboarding scene is showing. `null` means "derive from the data" (empty
// DB → welcome, otherwise → app). The explicit values are set by Back / next
// navigation and are ephemeral (reset on reload), so Welcome is always reachable
// and the user is never trapped.
type OnbNav = 'welcome' | 'guide' | 'app' | null;

export default function App() {
  const bookCount = useLiveQuery(() => countBooks(), []);
  const mapCount = useLiveQuery(() => countMaps(), []);
  const strokeCount = useLiveQuery(() => countStrokes(), []);
  const [screen, setScreen] = useState<Screen | null>(null);
  const [activeMapId, setActiveMapId] = useState<string | null>(null);
  const [onbNav, setOnbNav] = useState<OnbNav>(null);

  // Global "open book" drawer state — reachable from any screen
  const [openBookId, setOpenBookId] = useState<string | null>(null);
  const [focusHighlightId, setFocusHighlightId] = useState<string | null>(null);

  // Library tag filter pre-applied from a tag search result
  const [pendingTag, setPendingTag] = useState<string | null>(null);

  // Global command palette (Cmd/Ctrl+K)
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Onboarding UX state (localStorage-backed — see utils/onboarding.ts)
  const [onb, setOnb] = useState<OnboardingState>(() => readOnboarding());
  const patchOnb = (p: Partial<OnboardingState>) =>
    setOnb((prev) => { const next = { ...prev, ...p }; writeOnboarding(next); return next; });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const current: Screen = screen ?? (bookCount === 0 ? 'import' : 'library');

  const goToMap = (mapId: string) => {
    setActiveMapId(mapId);
    setScreen('canvas');
  };

  const openBook = (bookId: string, highlightId?: string) => {
    setOpenBookId(bookId);
    setFocusHighlightId(highlightId ?? null);
    if (!onb.openedBook) patchOnb({ openedBook: true });
  };

  const closeBook = () => {
    setOpenBookId(null);
    setFocusHighlightId(null);
  };

  const openTag = (tag: string) => {
    setPendingTag(tag);
    setScreen('library');
  };

  // ── Onboarding navigation ──────────────────────────────────────────────
  const handleExplore = async () => {
    await loadSampleData();
    patchOnb({ sampleLoaded: true });
    setScreen('library');
    setOnbNav('app');
  };

  const handleImportDone = () => {
    setScreen('library');
    setOnbNav('app');
  };

  const backToWelcome = () => {
    closeBook();
    setActiveMapId(null);
    setOnbNav('welcome');
  };

  const handleRemoveSample = async () => {
    await clearSampleData();
    patchOnb({ sampleLoaded: false });
    // The open book / active map may have been part of the sample — drop them,
    // and return to Welcome so the user can explore again or import their own.
    closeBook();
    setActiveMapId(null);
    setScreen(null);
    setOnbNav('welcome');
  };

  // Shared props for the global app shell (persistent sidebar navigation)
  const shellProps = {
    onNavigate: (s: ShellScreen) => setScreen(s),
    onSearch: () => setPaletteOpen(true),
    onImport: () => setScreen('import'),
    bookCount,
    mapCount,
  };

  // First render before Dexie resolves the count — avoid flashing the wrong screen.
  if (bookCount === undefined) return null;

  // Effective onboarding scene: explicit navigation wins; otherwise derive.
  const onbScreen: OnbNav = onbNav ?? (bookCount === 0 ? 'welcome' : 'app');

  // Getting-started checklist (calm, optional). Only in the app, once there's
  // something to work with, until dismissed or every step is done.
  const checklistSteps = [
    { label: 'Import your highlights', done: bookCount > 0 },
    { label: 'Open a book', done: onb.openedBook },
    { label: 'Create a map', done: (mapCount ?? 0) > 0 },
    { label: 'Draw on a canvas', done: (strokeCount ?? 0) > 0 },
  ];
  const showChecklist =
    onbScreen === 'app' &&
    !onb.checklistDismissed &&
    !checklistSteps.every((s) => s.done) &&
    bookCount > 0 &&
    !openBookId &&
    (current === 'library' || current === 'maps' || current === 'stats');

  const sampleBanner = onb.sampleLoaded
    ? <SampleDataBanner onBackToWelcome={backToWelcome} onRemove={handleRemoveSample} />
    : null;

  let content;
  if (onbScreen === 'welcome') {
    content = <WelcomeScreen onImport={() => setOnbNav('guide')} onExplore={handleExplore} />;
  } else if (onbScreen === 'guide') {
    content = <ImportGuide onBack={() => setOnbNav('welcome')} onDone={handleImportDone} />;
  } else if (openBookId) {
    // Full-screen book workspace, inside the shell (sidebar stays).
    content = (
      <AppShell
        active="library"
        {...shellProps}
        onNavigate={(s) => { closeBook(); setScreen(s); }}
        onImport={() => { closeBook(); setScreen('import'); }}
      >
        {sampleBanner}
        <BookDetailView bookId={openBookId} focusHighlightId={focusHighlightId} onClose={closeBook} />
      </AppShell>
    );
  } else if (current === 'import') {
    // Full-bleed, outside the shell (returning-user import from the sidebar)
    content = <ImportPage onDone={() => setScreen('library')} />;
  } else if (current === 'canvas' && activeMapId) {
    content = (
      <AppShell active="maps" {...shellProps}>
        <ReadingCanvas mapId={activeMapId} onBack={() => setScreen('maps')} onOpenBook={openBook} onOpenMap={goToMap} />
      </AppShell>
    );
  } else if (current === 'stats') {
    content = (
      <AppShell active="stats" {...shellProps}>
        {sampleBanner}
        <StatsPage />
      </AppShell>
    );
  } else if (current === 'maps') {
    content = (
      <AppShell active="maps" {...shellProps}>
        {sampleBanner}
        <MapsPage onOpenMap={goToMap} />
      </AppShell>
    );
  } else {
    content = (
      <AppShell active="library" {...shellProps}>
        {sampleBanner}
        <LibraryPage onImport={() => setScreen('import')} onOpenBook={openBook} initialTag={pendingTag} />
      </AppShell>
    );
  }

  return (
    <>
      {content}

      {showChecklist && (
        <GettingStartedChecklist
          steps={checklistSteps}
          onDismiss={() => patchOnb({ checklistDismissed: true })}
        />
      )}

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onOpenBook={(bookId, highlightId) => openBook(bookId, highlightId)}
        onOpenMap={goToMap}
        onOpenTag={openTag}
      />
    </>
  );
}
