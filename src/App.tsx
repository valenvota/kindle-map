import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/db';
import { ImportPage } from './pages/ImportPage';
import { LibraryPage } from './pages/LibraryPage';
import { ReadingCanvas } from './components/canvas/ReadingCanvas';

type Screen = 'import' | 'canvas' | 'list';

export default function App() {
  const bookCount = useLiveQuery(() => db.books.count(), []);
  const [screen, setScreen] = useState<Screen | null>(null);

  // Derive current screen: no books → import, otherwise → canvas (default)
  const current: Screen = screen ?? (bookCount === 0 ? 'import' : 'canvas');

  if (current === 'import') {
    return (
      <ImportPage
        onDone={() => setScreen('canvas')}
      />
    );
  }

  if (current === 'list') {
    return (
      <LibraryPage
        onImport={() => setScreen('import')}
        // LibraryPage toolbar will also show the toggle back to canvas
        onCanvasView={() => setScreen('canvas')}
      />
    );
  }

  return (
    <ReadingCanvas
      view="canvas"
      onToggleView={() => setScreen('list')}
      onImport={() => setScreen('import')}
    />
  );
}
