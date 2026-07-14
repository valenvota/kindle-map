import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { BookCover } from '../book/BookCover';
import { getDisplayTitle } from '../../utils/displayTitle';
import type { Book } from '../../types/book';

export type BookNodeData = {
  book: Book;
  /** 'card' = metadata-rich; 'cover' = visual book object with a title-only caption. */
  displayMode: 'card' | 'cover';
};

/** Paper cover node — a book on the map desk, same visual language as the Library shelf. */
function BookNodeComponent({ data, selected }: NodeProps) {
  const { book, displayMode } = data as BookNodeData;
  const title = getDisplayTitle(book.title);
  const dot = book.readingStatus === 'reading' ? 'reading' : book.readingStatus === 'finished' ? 'finished' : null;
  const isCover = displayMode === 'cover';

  return (
    <div
      className={`km-booknode group${isCover ? ' km-booknode--cover' : ''}${selected ? ' selected' : ''}`}
      style={{ userSelect: 'none' }}
      title={book.title}
    >
      <Handle type="source" id="top"    position={Position.Top} />
      <Handle type="source" id="right"  position={Position.Right} />
      <Handle type="source" id="bottom" position={Position.Bottom} />
      <Handle type="source" id="left"   position={Position.Left} />

      <BookCover book={book} />

      <div className="km-booknode__cap">
        <span className="km-booknode__cap-t">{title}</span>
        {/* Cover mode stays a visual book object — title only, no metadata. */}
        {!isCover && (
          <span className="km-booknode__cap-m">
            {dot && <span className={`lib-dot lib-dot--${dot}`} />}
            {book.totalHighlights} highlights
          </span>
        )}
      </div>
      <p className="km-booknode__hint">double-click to open</p>
    </div>
  );
}

export const BookNode = memo(BookNodeComponent);
