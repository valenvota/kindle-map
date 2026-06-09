import { useState } from 'react';
import { X } from 'lucide-react';
import { createBook } from '../../db/booksRepository';

const ACCENT_COLORS = [
  '#f59e0b', // amber (default)
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f43f5e', // rose
  '#8b5cf6', // violet
  '#f97316', // orange
  '#06b6d4', // cyan
  '#84cc16', // lime
];

const INPUT =
  'w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 ' +
  'outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 ' +
  'placeholder:text-stone-300 bg-white';

type Props = {
  onClose: () => void;
};

export function AddBookModal({ onClose }: Props) {
  const [title, setTitle]       = useState('');
  const [author, setAuthor]     = useState('');
  const [description, setDesc]  = useState('');
  const [tags, setTags]         = useState('');
  const [color, setColor]       = useState(ACCENT_COLORS[0]);
  const [saving, setSaving]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await createBook({
        title: title.trim(),
        author:      author.trim()      || undefined,
        description: description.trim() || undefined,
        color,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <h2 className="text-base font-semibold text-stone-900">Add book manually</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-5">
          <Field label="Title *">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={INPUT}
              placeholder="Book title"
              required
            />
          </Field>

          <Field label="Author">
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className={INPUT}
              placeholder="Author name"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              className={`${INPUT} resize-none`}
              rows={3}
              placeholder="What is this book about? Why does it matter to you?"
            />
          </Field>

          <Field label="Tags">
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className={INPUT}
              placeholder="philosophy, productivity, 2024"
            />
            <p className="mt-1 text-xs text-stone-400">Comma-separated</p>
          </Field>

          <Field label="Color">
            <div className="flex flex-wrap gap-2">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  onClick={() => setColor(c)}
                  className={[
                    'h-7 w-7 rounded-full transition-transform hover:scale-110',
                    color === c ? 'scale-110 ring-2 ring-stone-400 ring-offset-2' : '',
                  ].join(' ')}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </Field>

          {/* Actions */}
          <div className="flex gap-2 border-t border-stone-100 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || saving}
              className="flex-1 rounded-xl bg-stone-900 py-2.5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-40"
            >
              {saving ? 'Adding…' : 'Add book'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-stone-400">
        {label}
      </label>
      {children}
    </div>
  );
}
