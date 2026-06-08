import { FileUploader } from '../components/import/FileUploader';
import { ImportSummary } from '../components/import/ImportSummary';
import { useImportClippings } from '../hooks/useImportClippings';

type Props = {
  onDone: () => void;
};

export function ImportPage({ onDone }: Props) {
  const { state, importFile, reset } = useImportClippings();

  const busy = state.status === 'parsing' || state.status === 'saving';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        {/* Logo / wordmark */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500">
              <span className="text-lg font-bold text-white">K</span>
            </div>
            <span className="text-xl font-semibold text-stone-900">KindleMap</span>
          </div>
          <p className="mt-3 text-sm text-stone-500">A visual map of your reading mind.</p>
        </div>

        {state.status === 'idle' || busy ? (
          <FileUploader onFile={importFile} disabled={busy} />
        ) : null}

        {state.status !== 'idle' && (
          <div className="mt-6">
            <ImportSummary state={state} onDone={onDone} onReset={reset} />
          </div>
        )}

        {state.status === 'idle' && (
          <p className="mt-6 text-center text-xs text-stone-400">
            Everything stays on your device. No uploads, no accounts.
          </p>
        )}
      </div>
    </div>
  );
}
