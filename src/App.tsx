import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/db';
import { ImportPage } from './pages/ImportPage';
import { LibraryPage } from './pages/LibraryPage';

type View = 'import' | 'library';

export default function App() {
  const bookCount = useLiveQuery(() => db.books.count(), []);
  const [forcedView, setForcedView] = useState<View | null>(null);

  // Show import page until user has books, then show library
  const view: View = forcedView ?? (bookCount === 0 ? 'import' : 'library');

  return (
    <>
      {view === 'import' ? (
        <ImportPage onDone={() => setForcedView('library')} />
      ) : (
        <LibraryPage onImport={() => setForcedView('import')} />
      )}
    </>
  );
}
