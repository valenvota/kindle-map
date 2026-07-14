import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { BookCover } from '../book/BookCover';
import { getDisplayTitle } from '../../utils/displayTitle';
import type { Book } from '../../types/book';

export type BookNodeData = {
  book: Book;
  /** 'cover' = vertical book object; 'card' = horizontal information card. */
  displayMode: 'card' | 'cover';
  /** Important-highlight count — quiet metadata, card mode only. */
  importantCount: number;
};

/**
 * A book on the map desk, in one of two shapes:
 *
 *  • cover — a vertical 2:3 book object, cover-led, title-only caption.
 *  • card  — a horizontal paper card: thumbnail + title + author + quiet
 *            metadata, same language as the Library's Cards index.
 */
function BookNodeComponent({ data, selected }: NodeProps) {
  const { book, displayMode, importantCount } = data as BookNodeData;
  const title = getDisplayTitle(book.title);
  const dot = book.readingStatus === 'reading' ? 'reading' : book.readingStatus === 'finished' ? 'finished' : null;
  const isCover = displayMode === 'cover';

  return (
    <div
      className={`km-booknode group km-booknode--${isCover ? 'cover' : 'card'}${selected ? ' selected' : ''}`}
      style={{ userSelect: 'none' }}
      title={book.title}
    >
      <Handle type="source" id="top"    position={Position.Top} />
      <Handle type="source" id="right"  position={Position.Right} />
      <Handle type="source" id="bottom" position={Position.Bottom} />
      <Handle type="source" id="left"   position={Position.Left} />

      {isCover ? (
        <>
          <BookCover book={book} />
          <div className="km-booknode__cap">
            <span className="km-booknode__cap-t">{title}</span>
          </div>
        </>
      ) : (
        <div className="km-booknode__card">
          <div className="km-booknode__thumb">
            <BookCover book={book} variant="row" />
          </div>
          <div className="km-booknode__body">
            <span className="km-booknode__title">{title}</span>
            {book.author && <span className="km-booknode__author">{book.author}</span>}
            <span className="km-booknode__meta">
              {dot && <span className={`lib-dot lib-dot--${dot}`} />}
              {book.totalHighlights} highlight{book.totalHighlights !== 1 ? 's' : ''}
              {importantCount > 0 && <> · <b>{importantCount} important</b></>}
            </span>
          </div>
        </div>
      )}

      <p className="km-booknode__hint">double-click to open</p>
    </div>
  );
}

export const BookNode = memo(BookNodeComponent);
