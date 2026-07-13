import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { BookCover } from '../book/BookCover';
import { getDisplayTitle } from '../../utils/displayTitle';
import type { Book } from '../../types/book';

export type BookNodeData = {
  book: Book;
};

/** Paper cover node — a book on the map desk, same visual language as the Library shelf. */
function BookNodeComponent({ data, selected }: NodeProps) {
  const { book } = data as BookNodeData;
  const title = getDisplayTitle(book.title);
  const dot = book.readingStatus === 'reading' ? 'reading' : book.readingStatus === 'finished' ? 'finished' : null;

  return (
    <div
      className={`km-booknode group${selected ? ' selected' : ''}`}
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
        <span className="km-booknode__cap-m">
          {dot && <span className={`lib-dot lib-dot--${dot}`} />}
          {book.totalHighlights} highlights
        </span>
      </div>
      <p className="km-booknode__hint">double-click to open</p>
    </div>
  );
}

export const BookNode = memo(BookNodeComponent);
