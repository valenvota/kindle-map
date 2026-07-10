import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, X, ArrowLeft, BookOpen, Quote } from 'lucide-react';
import { db } from '../../db/db';
import { upsertCanvasNode } from '../../db/canvasRepository';
import type { Book } from '../../types/book';
import type { Highlight } from '../../types/highlight';

type Props = {
  mapId: string;
  newNodePosition: { x: number; y: number };
  onClose: () => void;
};

export function AddQuoteModal({ mapId, newNodePosition, onClose }: Props) {
  const [step, setStep] = useState<'book' | 'highlight'>('book');
  const [bookQuery, setBookQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [hlQuery, setHlQuery] = useState('');
  const [adding, setAdding] = useState(false);

  const books = useLiveQuery(() => db.books.orderBy('title').toArray(), []);

  // Load highlights when a book is selected
  useEffect(() => {
    if (!selectedBook) return;
    db.highlights.where('bookId').equals(selectedBook.id).toArray().then(setHighlights);
  }, [selectedBook]);

  const filteredBooks = books?.filter((b) => {
    if (!bookQuery) return true;
    const q = bookQuery.toLowerCase();
    return b.title.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q);
  });

  const filteredHighlights = highlights.filter((h) => {
    if (!hlQuery) return true;
    return h.text.toLowerCase().includes(hlQuery.toLowerCase());
  });

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    setStep('highlight');
  };

  const handleAddQuote = async (highlight: Highlight) => {
    if (!selectedBook || adding) return;
    setAdding(true);
    await upsertCanvasNode({
      id: `${mapId}:quote-${highlight.id}`,
      mapId,
      bookId: selectedBook.id,
      highlightId: highlight.id,
      type: 'quote',
      content: highlight.text,
      position: newNodePosition,
    });
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed left-1/2 top-1/2 z-50 flex w-full max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white shadow-2xl"
        style={{ maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-stone-100 px-5 py-4">
          {step === 'highlight' && (
            <button
              onClick={() => setStep('book')}
              className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex-1">
            <h2 className="text-base font-semibold text-stone-900">
              {step === 'book' ? 'Add Quote — pick a book' : 'Pick a highlight'}
            </h2>
            {step === 'highlight' && selectedBook && (
              <p className="truncate text-xs text-stone-500">{selectedBook.title}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step 1 — Book picker */}
        {step === 'book' && (
          <>
            <div className="border-b border-stone-100 px-5 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search books…"
                  value={bookQuery}
                  onChange={(e) => setBookQuery(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-[#3D6B8E] focus:ring-2 focus:ring-[#3D6B8E]/10"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {!filteredBooks || filteredBooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-stone-400">
                  <BookOpen className="mb-2 h-8 w-8 opacity-40" />
                  <p className="text-sm">No books found</p>
                </div>
              ) : (
                filteredBooks.map((book) => (
                  <button
                    key={book.id}
                    onClick={() => handleSelectBook(book)}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-stone-50"
                  >
                    <div
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: book.color ?? '#3D6B8E' }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-stone-900">{book.title}</p>
                      {book.author && (
                        <p className="truncate text-xs text-stone-500">{book.author}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-stone-400">
                      {book.totalHighlights} highlights
                    </span>
                  </button>
                ))
              )}
            </div>
          </>
        )}

        {/* Step 2 — Highlight picker */}
        {step === 'highlight' && (
          <>
            <div className="border-b border-stone-100 px-5 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search highlights…"
                  value={hlQuery}
                  onChange={(e) => setHlQuery(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-[#3D6B8E] focus:ring-2 focus:ring-[#3D6B8E]/10"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {filteredHighlights.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-stone-400">
                  <Quote className="mb-2 h-8 w-8 opacity-40" />
                  <p className="text-sm">
                    {hlQuery ? `No highlights match "${hlQuery}"` : 'No highlights in this book'}
                  </p>
                </div>
              ) : (
                filteredHighlights.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => handleAddQuote(h)}
                    disabled={adding}
                    className="flex w-full items-start gap-3 border-b border-stone-50 px-5 py-3 text-left last:border-0 hover:bg-stone-50 disabled:opacity-50"
                  >
                    <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
                    <p className="line-clamp-3 text-sm leading-relaxed text-stone-700 italic">
                      {h.text}
                    </p>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
