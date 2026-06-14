import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/db';
import { ImportPage } from './pages/ImportPage';
import { LibraryPage } from './pages/LibraryPage';
import { MapsPage } from './pages/MapsPage';
import { ReadingCanvas } from './components/canvas/ReadingCanvas';
import { BookDetailView } from './components/book/BookDetailView';
import { CommandPalette } from './components/search/CommandPalette';

type Screen = 'import' | 'library' | 'maps' | 'canvas';

export default function App() {
  const bookCount = useLiveQuery(() => db.books.count(), []);
  const [screen, setScreen] = useState<Screen | null>(null);
  const [activeMapId, setActiveMapId] = useState<string | null>(null);

  // Global "open book" drawer state — reachable from any screen
  const [openBookId, setOpenBookId] = useState<string | null>(null);
  const [focusHighlightId, setFocusHighlightId] = useState<string | null>(null);

  // Library tag filter pre-applied from a tag search result
  const [pendingTag, setPendingTag] = useState<string | null>(null);

  // Global command palette (Cmd/Ctrl+K)
  const [paletteOpen, setPaletteOpen] = useState(false);

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
  };

  const closeBook = () => {
    setOpenBookId(null);
    setFocusHighlightId(null);
  };

  const openTag = (tag: string) => {
    setPendingTag(tag);
    setScreen('library');
  };

  let content;
  if (current === 'import') {
    content = <ImportPage onDone={() => setScreen('library')} />;
  } else if (current === 'maps') {
    content = (
      <MapsPage
        onBack={() => setScreen('library')}
        onOpenMap={goToMap}
      />
    );
  } else if (current === 'canvas' && activeMapId) {
    content = (
      <ReadingCanvas
        mapId={activeMapId}
        onBack={() => setScreen('maps')}
        onLibrary={() => setScreen('library')}
        onOpenBook={openBook}
      />
    );
  } else {
    content = (
      <LibraryPage
        onImport={() => setScreen('import')}
        onMapsView={() => setScreen('maps')}
        onOpenBook={openBook}
        onOpenSearch={() => setPaletteOpen(true)}
        initialTag={pendingTag}
      />
    );
  }

  return (
    <>
      {content}

      {openBookId && (
        <BookDetailView
          bookId={openBookId}
          focusHighlightId={focusHighlightId}
          onClose={closeBook}
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
