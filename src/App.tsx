import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/db';
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
import { SampleDataBanner } from './components/onboarding/SampleDataBanner';
import { GettingStartedChecklist } from './components/onboarding/GettingStartedChecklist';
import { readOnboarding, writeOnboarding, type OnboardingState } from './utils/onboarding';
import { loadSampleData, clearSampleData } from './utils/sampleData';

type Screen = 'import' | 'library' | 'maps' | 'canvas' | 'stats';

export default function App() {
  const bookCount = useLiveQuery(() => db.books.count(), []);
  const mapCount = useLiveQuery(() => db.maps.count(), []);
  const strokeCount = useLiveQuery(() => db.canvasStrokes.count(), []);
  const [screen, setScreen] = useState<Screen | null>(null);
  const [activeMapId, setActiveMapId] = useState<string | null>(null);

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

  // Default: no books → import; else → library (Library is now the home screen)
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

  const handleExplore = async () => {
    await loadSampleData();
    patchOnb({ welcomeSeen: true, sampleLoaded: true });
    setScreen('library');
  };

  const handleRemoveSample = async () => {
    await clearSampleData();
    patchOnb({ sampleLoaded: false });
    // The open book / active map may have been part of the sample — drop them.
    closeBook();
    setActiveMapId(null);
    setScreen(null); // recompute: real books → library, none → import
  };

  // Shared props for the global app shell (persistent sidebar navigation)
  const shellProps = {
    onNavigate: (s: ShellScreen) => setScreen(s),
    onSearch: () => setPaletteOpen(true),
    onImport: () => setScreen('import'),
    bookCount,
    mapCount,
  };

  // Getting-started checklist (calm, optional). Shown on the in-app screens once
  // there's something to work with, until dismissed or every step is done.
  const checklistSteps = [
    { label: 'Import your highlights', done: (bookCount ?? 0) > 0 },
    { label: 'Open a book', done: onb.openedBook },
    { label: 'Create a map', done: (mapCount ?? 0) > 0 },
    { label: 'Draw on a canvas', done: (strokeCount ?? 0) > 0 },
  ];
  const showChecklist =
    !onb.checklistDismissed &&
    !checklistSteps.every((s) => s.done) &&
    (bookCount ?? 0) > 0 &&
    !openBookId &&
    (current === 'library' || current === 'maps' || current === 'stats');

  const sampleBanner = onb.sampleLoaded ? <SampleDataBanner onRemove={handleRemoveSample} /> : null;

  // First render before Dexie resolves the count — avoid flashing the wrong screen.
  if (bookCount === undefined) return null;

  const showWelcome = screen === null && bookCount === 0 && !onb.welcomeSeen;

  let content;
  if (showWelcome) {
    content = (
      <WelcomeScreen
        onImport={() => { patchOnb({ welcomeSeen: true }); setScreen('import'); }}
        onExplore={handleExplore}
      />
    );
  } else if (openBookId) {
    // Full-screen book workspace, inside the shell (sidebar stays). Navigating
    // away via the sidebar closes the book first.
    content = (
      <AppShell
        active="library"
        {...shellProps}
        onNavigate={(s) => { closeBook(); setScreen(s); }}
        onImport={() => { closeBook(); setScreen('import'); }}
      >
        {sampleBanner}
        <BookDetailView
          bookId={openBookId}
          focusHighlightId={focusHighlightId}
          onClose={closeBook}
        />
      </AppShell>
    );
  } else if (current === 'import') {
    // Full-bleed, outside the shell (first-run / import flow)
    content = <ImportPage onDone={() => setScreen('library')} />;
  } else if (current === 'canvas' && activeMapId) {
    // Canvas inside the shell (dark sidebar stays, matching the Maps mockup).
    content = (
      <AppShell active="maps" {...shellProps}>
        <ReadingCanvas
          mapId={activeMapId}
          onBack={() => setScreen('maps')}
          onOpenBook={openBook}
        />
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
        <LibraryPage
          onImport={() => setScreen('import')}
          onOpenBook={openBook}
          initialTag={pendingTag}
        />
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
