import { useCallback, useRef, useState } from 'react';
import { Upload, FileText } from 'lucide-react';

type Props = {
  onFile: (file: File) => void;
  disabled?: boolean;
  /** 'light' = the standalone import page; 'dark' = the compact onboarding guide. */
  tone?: 'light' | 'dark';
};

export function FileUploader({ onFile, disabled, tone = 'light' }: Props) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith('.txt')) {
        setError(`“${file.name}” isn’t a .txt file. Pick your Kindle My Clippings.txt.`);
        return;
      }
      setError(null);
      onFile(file);
    },
    [onFile],
  );

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const open = () => !disabled && inputRef.current?.click();
  const fileInput = (
    <input ref={inputRef} type="file" accept=".txt" className="hidden" onChange={onInputChange} disabled={disabled} />
  );

  // Compact dark variant — the onboarding import guide (steps already explain
  // where the file lives, so this is just the action).
  if (tone === 'dark') {
    return (
      <>
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload My Clippings.txt"
          onClick={open}
          onKeyDown={(e) => e.key === 'Enter' && open()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`km-onb__drop${dragging ? ' km-onb__drop--drag' : ''}`}
        >
          <span className="km-onb__drop-ico">
            {dragging ? <FileText className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
          </span>
          <span className="km-onb__drop-text">
            <b>{dragging ? 'Drop it to import' : 'Drop My Clippings.txt here'}</b>
            <small>or click to browse — .txt only</small>
          </span>
          {fileInput}
        </div>
        {error && <p className="km-onb__drop-err" role="alert">{error}</p>}
      </>
    );
  }

  // Light variant — the standalone import page.
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload My Clippings.txt"
      onClick={open}
      onKeyDown={(e) => e.key === 'Enter' && open()}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={[
        'relative flex flex-col items-center justify-center gap-4',
        'rounded-2xl border-2 border-dashed px-8 py-16 text-center transition-all',
        'cursor-pointer select-none',
        disabled ? 'pointer-events-none opacity-50' : '',
      ].join(' ')}
      style={dragging
        ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)' }
        : { borderColor: 'var(--border-md)', background: 'white' }}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'var(--brand-soft)' }}>
        {dragging ? (
          <FileText className="h-7 w-7" style={{ color: 'var(--brand)' }} />
        ) : (
          <Upload className="h-7 w-7" style={{ color: 'var(--brand)' }} />
        )}
      </div>

      <div>
        <p className="text-base font-medium" style={{ color: 'var(--text)' }}>
          {dragging ? 'Drop your file here' : 'Upload My Clippings.txt'}
        </p>
        <p className="mt-1 text-sm font-light" style={{ color: 'var(--text-2)' }}>
          Drag & drop or click to browse · Kindle exports only
        </p>
      </div>

      <p className="text-xs" style={{ color: 'var(--text-3)' }}>
        Find it at: <code className="rounded px-1 py-0.5" style={{ background: 'var(--surface-2)' }}>Kindle/documents/My Clippings.txt</code>
      </p>

      {fileInput}

      {error && (
        <p className="text-xs font-medium" style={{ color: 'var(--ember, #B06A4F)' }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
