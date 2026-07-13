import { useState } from 'react';
import { X } from 'lucide-react';
import { createBook } from '../../db/booksRepository';

const ACCENT_COLORS = [
  '#3D6B8E', // accent blue (default)
  '#C4894A', // warm caramel
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f43f5e', // rose
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#84cc16', // lime
];

const INPUT = 'km-field';

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
      <div
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl shadow-2xl"
        style={{ background: 'var(--surface)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--hair)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--ink)' }}>Add book manually</h2>
          <button onClick={onClose} className="km-iconbtn h-8 w-8">
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
            <p className="mt-1 text-xs" style={{ color: 'var(--ink-faint)' }}>Comma-separated</p>
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
                    color === c ? 'scale-110 ring-2 ring-offset-2 ring-[var(--accent)]' : '',
                  ].join(' ')}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </Field>

          {/* Actions */}
          <div className="flex gap-2 border-t pt-4" style={{ borderColor: 'var(--hair)' }}>
            <button type="button" onClick={onClose} className="km-btn km-btn--secondary km-btn--md flex-1">
              Cancel
            </button>
            <button type="submit" disabled={!title.trim() || saving} className="km-btn km-btn--primary km-btn--md flex-1">
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
      <label className="km-label">{label}</label>
      {children}
    </div>
  );
}
