import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/db';
import { ImportPage } from './pages/ImportPage';
import { LibraryPage } from './pages/LibraryPage';
import { MapsPage } from './pages/MapsPage';
import { ReadingCanvas } from './components/canvas/ReadingCanvas';

type Screen = 'import' | 'library' | 'maps' | 'canvas';

export default function App() {
  const bookCount = useLiveQuery(() => db.books.count(), []);
  const [screen, setScreen] = useState<Screen | null>(null);
  const [activeMapId, setActiveMapId] = useState<string | null>(null);

  // Default: no books → import; else → library (Library is now the home screen)
  const current: Screen = screen ?? (bookCount === 0 ? 'import' : 'library');

  const goToMap = (mapId: string) => {
    setActiveMapId(mapId);
    setScreen('canvas');
  };

  if (current === 'import') {
    return <ImportPage onDone={() => setScreen('library')} />;
  }

  if (current === 'maps') {
    return (
      <MapsPage
        onBack={() => setScreen('library')}
        onOpenMap={goToMap}
      />
    );
  }

  if (current === 'canvas' && activeMapId) {
    return (
      <ReadingCanvas
        mapId={activeMapId}
        onBack={() => setScreen('maps')}
        onLibrary={() => setScreen('library')}
      />
    );
  }

  // Default home: Library
  return (
    <LibraryPage
      onImport={() => setScreen('import')}
      onMapsView={() => setScreen('maps')}
    />
  );
}
