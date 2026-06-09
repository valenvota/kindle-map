import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  type Node,
  type OnNodeDrag,
  type NodeMouseHandler,
  BackgroundVariant,
} from '@xyflow/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { upsertCanvasNode } from '../../db/canvasRepository';
import { BookNode, type BookNodeData } from './BookNode';
import { CanvasToolbar } from './CanvasToolbar';
import { BookDetailView } from '../book/BookDetailView';
import type { Book } from '../../types/book';

const NODE_WIDTH = 208; // w-52 = 208px
const NODE_HEIGHT = 180;
const GRID_COL_GAP = 40;
const GRID_ROW_GAP = 40;
const COLS = 4;

const nodeTypes = { book: BookNode };

function buildInitialPosition(index: number): { x: number; y: number } {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  return {
    x: 60 + col * (NODE_WIDTH + GRID_COL_GAP),
    y: 60 + row * (NODE_HEIGHT + GRID_ROW_GAP),
  };
}

function bookToNode(book: Book, position: { x: number; y: number }): Node<BookNodeData> {
  return {
    id: book.id,
    type: 'book',
    position,
    data: { book },
    // Prevent React Flow from drawing any handles/edges
    connectable: false,
  };
}

type Props = {
  view: 'canvas' | 'list';
  onToggleView: () => void;
  onImport: () => void;
};

export function ReadingCanvas({ view, onToggleView, onImport }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<BookNodeData>>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const initialized = useRef(false);

  const books = useLiveQuery(() => db.books.orderBy('title').toArray(), []);

  // Initialize nodes from Dexie — runs once when books first load
  useEffect(() => {
    if (!books || initialized.current) return;

    const init = async () => {
      const savedPositions = await db.canvasNodes.toArray();
      const posMap = new Map(savedPositions.map((n) => [n.bookId, n.position]));

      const initialNodes = books.map((book, i) => {
        const position = posMap.get(book.id) ?? buildInitialPosition(i);
        return bookToNode(book, position);
      });

      setNodes(initialNodes);
      initialized.current = true;
    };

    init();
  }, [books]);

  // When new books are added after initialization, append them without resetting existing nodes
  useEffect(() => {
    if (!initialized.current || !books) return;

    setNodes((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));
      const newBooks = books.filter((b) => !existingIds.has(b.id));

      if (newBooks.length === 0) return prev;

      const newNodes = newBooks.map((book, i) =>
        bookToNode(book, buildInitialPosition(prev.length + i)),
      );

      return [...prev, ...newNodes];
    });
  }, [books]);

  // Persist position only on drag stop
  const onNodeDragStop: OnNodeDrag<Node<BookNodeData>> = useCallback(async (_, node) => {
    await upsertCanvasNode({
      id: node.id,
      bookId: node.id,
      type: 'book',
      position: node.position,
    });
  }, []);

  // Double click → open book detail
  const onNodeDoubleClick: NodeMouseHandler<Node<BookNodeData>> = useCallback(
    (_, node) => {
      const book = (node.data as BookNodeData).book;
      setSelectedBook(book);
    },
    [],
  );

  // Auto arrange — grid layout, persists all positions
  const handleAutoArrange = useCallback(async () => {
    const arranged = nodes.map((node, i) => ({
      ...node,
      position: buildInitialPosition(i),
    }));

    setNodes(arranged);

    // Persist all positions
    await Promise.all(
      arranged.map((node) =>
        upsertCanvasNode({
          id: node.id,
          bookId: node.id,
          type: 'book',
          position: node.position,
        }),
      ),
    );
  }, [nodes, setNodes]);

  const isEmpty = books && books.length === 0;

  return (
    <div className="relative h-screen w-full bg-stone-50">
      <CanvasToolbar
        view={view}
        onToggleView={onToggleView}
        onImport={onImport}
        onAutoArrange={handleAutoArrange}
      />

      <ReactFlow
        nodes={nodes}
        edges={[]}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        minZoom={0.1}
        maxZoom={2}
        deleteKeyCode={null}     // disable delete key removing nodes
        selectionKeyCode={null}  // disable shift-select box
        panOnScroll
        panOnDrag
        zoomOnScroll={false}     // scroll = pan, pinch = zoom (more natural)
        zoomOnPinch
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="#d6d3d1"
        />
        <Controls
          position="bottom-right"
          showInteractive={false}
          style={{ bottom: '24px', right: '24px' }}
        />
      </ReactFlow>

      {/* Empty state overlay */}
      {isEmpty && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-stone-400">Your canvas is empty</p>
            <p className="mt-1 text-sm text-stone-400">Import a Kindle file to get started</p>
          </div>
        </div>
      )}

      {/* Book detail drawer */}
      {selectedBook && (
        <BookDetailView book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </div>
  );
}
