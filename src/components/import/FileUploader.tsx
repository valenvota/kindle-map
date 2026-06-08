import { useCallback, useRef, useState } from 'react';
import { Upload, FileText } from 'lucide-react';

type Props = {
  onFile: (file: File) => void;
  disabled?: boolean;
};

export function FileUploader({ onFile, disabled }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.txt')) return;
      onFile(file);
    },
    [onFile],
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

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

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload My Clippings.txt"
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={[
        'relative flex flex-col items-center justify-center gap-4',
        'rounded-2xl border-2 border-dashed px-8 py-16 text-center transition-all',
        'cursor-pointer select-none',
        dragging
          ? 'border-amber-400 bg-amber-50'
          : 'border-stone-200 bg-white hover:border-stone-400 hover:bg-stone-50',
        disabled ? 'pointer-events-none opacity-50' : '',
      ].join(' ')}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
        {dragging ? (
          <FileText className="h-7 w-7 text-amber-600" />
        ) : (
          <Upload className="h-7 w-7 text-amber-600" />
        )}
      </div>

      <div>
        <p className="text-base font-medium text-stone-800">
          {dragging ? 'Drop your file here' : 'Upload My Clippings.txt'}
        </p>
        <p className="mt-1 text-sm text-stone-500">
          Drag & drop or click to browse · Kindle exports only
        </p>
      </div>

      <p className="text-xs text-stone-400">
        Find it at: <code className="rounded bg-stone-100 px-1 py-0.5">Kindle/documents/My Clippings.txt</code>
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".txt"
        className="hidden"
        onChange={onInputChange}
        disabled={disabled}
      />
    </div>
  );
}
