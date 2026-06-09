import { useState, useEffect, useRef } from 'react';
import { Plus, X, BookOpen, Tag, FileText, Quote } from 'lucide-react';
import { upsertCanvasNode } from '../../db/canvasRepository';
import { AddBookModal } from './AddBookModal';
import { AddQuoteModal } from './AddQuoteModal';

// Grid-based position for newly placed nodes
function newNodePosition(existingCount: number): { x: number; y: number } {
  const col = existingCount % 4;
  const row = Math.floor(existingCount / 4);
  return {
    x: 60 + col * 248,
    y: 60 + row * 220,
  };
}

type ActiveModal = 'book' | 'topic' | 'note' | 'quote' | null;

type Props = {
  mapId: string;
  existingBookIds: Set<string>;
  existingNodeCount: number;
};

export function PlusMenu({ mapId, existingBookIds, existingNodeCount }: Props) {
  const [open, setOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on Escape or outside click
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onPointer = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  const openModal = (modal: ActiveModal) => {
    setOpen(false);
    setActiveModal(modal);
  };

  const closeModal = () => setActiveModal(null);

  const pos = newNodePosition(existingNodeCount);

  return (
    <>
      {/* FAB + menu */}
      <div ref={menuRef} className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
        {/* Menu items — slide up from button */}
        {open && (
          <div className="mb-3 flex flex-col items-center gap-2">
            <MenuItem
              icon={<Quote className="h-4 w-4" />}
              label="Quote"
              color="bg-violet-500 hover:bg-violet-600"
              onClick={() => openModal('quote')}
            />
            <MenuItem
              icon={<FileText className="h-4 w-4" />}
              label="Note"
              color="bg-yellow-500 hover:bg-yellow-600"
              onClick={() => openModal('note')}
            />
            <MenuItem
              icon={<Tag className="h-4 w-4" />}
              label="Topic"
              color="bg-amber-500 hover:bg-amber-600"
              onClick={() => openModal('topic')}
            />
            <MenuItem
              icon={<BookOpen className="h-4 w-4" />}
              label="Book"
              color="bg-stone-700 hover:bg-stone-900"
              onClick={() => openModal('book')}
            />
          </div>
        )}

        {/* Main + / × button */}
        <button
          onClick={() => setOpen((v) => !v)}
          title={open ? 'Close menu' : 'Add to map'}
          className={[
            'flex h-12 w-12 items-center justify-center rounded-full shadow-lg',
            'transition-all duration-150',
            open
              ? 'bg-stone-700 text-white hover:bg-stone-900'
              : 'bg-amber-500 text-white hover:bg-amber-600 hover:scale-105 active:scale-95',
          ].join(' ')}
        >
          {open ? <X className="h-5 w-5" /> : <Plus className="h-6 w-6" />}
        </button>
      </div>

      {/* Modals */}
      {activeModal === 'book' && (
        <AddBookModal
          mapId={mapId}
          existingBookIds={existingBookIds}
          existingNodeCount={existingNodeCount}
          onClose={closeModal}
        />
      )}

      {activeModal === 'topic' && (
        <AddTopicModal
          mapId={mapId}
          position={pos}
          onClose={closeModal}
        />
      )}

      {activeModal === 'note' && (
        <AddNoteModal
          mapId={mapId}
          position={pos}
          onClose={closeModal}
        />
      )}

      {activeModal === 'quote' && (
        <AddQuoteModal
          mapId={mapId}
          newNodePosition={pos}
          onClose={closeModal}
        />
      )}
    </>
  );
}

// ─── Menu item pill ───────────────────────────────────────────────────────────

function MenuItem({
  icon,
  label,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-md',
        'transition-transform hover:scale-105 active:scale-95',
        color,
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── AddTopicModal ────────────────────────────────────────────────────────────

function AddTopicModal({
  mapId,
  position,
  onClose,
}: {
  mapId: string;
  position: { x: number; y: number };
  onClose: () => void;
}) {
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    await upsertCanvasNode({
      id: `${mapId}:topic-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      mapId,
      type: 'topic',
      content: label.trim(),
      position,
    });
    onClose();
  };

  return (
    <SimpleModal title="Add Topic" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          autoFocus
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Topic label…"
          className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        />
        <ModalActions
          onClose={onClose}
          submitLabel="Add to map"
          disabled={!label.trim() || saving}
        />
      </form>
    </SimpleModal>
  );
}

// ─── AddNoteModal ─────────────────────────────────────────────────────────────

function AddNoteModal({
  mapId,
  position,
  onClose,
}: {
  mapId: string;
  position: { x: number; y: number };
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    await upsertCanvasNode({
      id: `${mapId}:note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      mapId,
      type: 'note',
      content: text.trim(),
      position,
    });
    onClose();
  };

  return (
    <SimpleModal title="Add Note" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your note…"
          rows={4}
          className="w-full resize-none rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        />
        <ModalActions
          onClose={onClose}
          submitLabel="Add to map"
          disabled={!text.trim() || saving}
        />
      </form>
    </SimpleModal>
  );
}

// ─── Shared modal shell ───────────────────────────────────────────────────────

function SimpleModal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="mb-4 text-base font-semibold text-stone-900">{title}</h2>
        {children}
      </div>
    </>
  );
}

function ModalActions({
  onClose,
  submitLabel,
  disabled,
}: {
  onClose: () => void;
  submitLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={disabled}
        className="flex-1 rounded-xl bg-stone-900 py-2.5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-40"
      >
        {submitLabel}
      </button>
    </div>
  );
}
