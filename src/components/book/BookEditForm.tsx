import { useRef, useState } from 'react';
import { Sparkles, ImagePlus, X } from 'lucide-react';
import { cleanBookMetadata } from '../../utils/cleanBookMetadata';
import { updateBookMetadata, updateBookCover } from '../../db/booksRepository';
import { compressImageToDataUri } from '../../utils/compressImage';
import type { Book } from '../../types/book';

// Same palette as BookNode accent colors
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

const INPUT = [
  'w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900',
  'outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100',
  'placeholder:text-stone-300 bg-white',
].join(' ');

type Props = {
  book: Book;
  onClose: () => void;
};

export function BookEditForm({ book, onClose }: Props) {
  const suggestion = cleanBookMetadata(book.title);

  const [title, setTitle]           = useState(book.title);
  const [author, setAuthor]         = useState(book.author ?? '');
  const [description, setDesc]      = useState(book.description ?? '');
  const [color, setColor]           = useState(book.color ?? ACCENT_COLORS[0]);
  const [tags, setTags]             = useState((book.tags ?? []).join(', '));
  const [saving, setSaving]         = useState(false);
  const [suggestionApplied, setApplied] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(book.coverImage ?? null);
  const [coverChanged, setCoverChanged] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applySuggestion = () => {
    setTitle(suggestion.title);
    setApplied(true);
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setCoverError(null);
    try {
      const dataUri = await compressImageToDataUri(file);
      setCoverImage(dataUri);
      setCoverChanged(true);
    } catch {
      setCoverError('Could not read that image — try a different file.');
    }
  };

  const handleRemoveCover = () => {
    setCoverImage(null);
    setCoverChanged(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateBookMetadata(book.id, {
        title:       title.trim() || book.title,
        author:      author.trim() || undefined,
        description: description.trim() || undefined,
        color,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      if (coverChanged) {
        await updateBookCover(book.id, coverImage);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const showBanner = suggestion.hasChanges && !suggestionApplied;

  return (
    <div className="flex flex-col gap-5 px-6 py-5">
      {/* Suggested cleanup banner */}
      {showBanner && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-amber-800">Suggested cleanup</p>
            <p className="mt-0.5 truncate text-xs text-amber-700">"{suggestion.title}"</p>
          </div>
          <button
            onClick={applySuggestion}
            className="shrink-0 text-xs font-semibold text-amber-700 underline hover:text-amber-900"
          >
            Apply
          </button>
        </div>
      )}

      <Field label="Cover image">
        <div className="flex items-center gap-3">
          <div className="flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
            {coverImage ? (
              <img src={coverImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus className="h-5 w-5 text-stone-300" />
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
            >
              {coverImage ? 'Replace image' : 'Upload image'}
            </button>
            {coverImage && (
              <button
                type="button"
                onClick={handleRemoveCover}
                className="flex items-center gap-1 text-xs font-medium text-stone-400 hover:text-stone-600"
              >
                <X className="h-3 w-3" />
                Remove cover
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
            className="hidden"
          />
        </div>
        {coverError && <p className="mt-1 text-xs text-red-500">{coverError}</p>}
      </Field>

      <Field label="Title">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={INPUT}
          placeholder="Book title"
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
          placeholder="Your notes about this book…"
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
          className="flex-1 rounded-xl border border-stone-200 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 rounded-xl bg-stone-900 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
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
