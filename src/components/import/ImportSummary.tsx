import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { ImportState } from '../../hooks/useImportClippings';
import { CoverSuggestionFlow } from './CoverSuggestionFlow';

type Props = {
  state: ImportState;
  onDone: () => void;
  onReset: () => void;
};

export function ImportSummary({ state, onDone, onReset }: Props) {
  if (state.status === 'idle') return null;

  if (state.status === 'parsing' || state.status === 'saving') {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-stone-600">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p className="text-sm font-medium">
          {state.status === 'parsing' ? 'Parsing your highlights…' : 'Saving to library…'}
        </p>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="font-medium">Import failed</p>
        </div>
        <p className="mt-1 text-sm text-red-600">{state.message}</p>
        <button
          onClick={onReset}
          className="mt-4 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
        >
          Try again
        </button>
      </div>
    );
  }

  const { stats, newBookInfos } = state;

  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-6">
      <div className="flex items-center gap-2 text-green-700">
        <CheckCircle className="h-5 w-5 shrink-0" />
        <p className="font-medium">Import complete</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatCard label="Books" total={stats.totalBooks} new_={stats.newBooks} />
        <StatCard label="Highlights" total={stats.totalHighlights} new_={stats.newHighlights} />
      </div>

      {stats.skippedBlocks > 0 && (
        <p className="mt-3 text-xs text-stone-500">
          {stats.skippedBlocks} blocks skipped (empty or malformed)
        </p>
      )}

      {newBookInfos.length > 0 && (
        <CoverSuggestionFlow newBooks={newBookInfos} />
      )}

      <div className="mt-5 flex gap-3">
        <button
          onClick={onDone}
          className="flex-1 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
        >
          View my library
        </button>
        <button
          onClick={onReset}
          className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
        >
          Import another
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, total, new_ }: { label: string; total: number; new_: number }) {
  return (
    <div className="rounded-lg bg-white px-4 py-3 shadow-sm">
      <p className="text-2xl font-semibold text-stone-900">{total}</p>
      <p className="text-sm text-stone-500">{label}</p>
      {new_ > 0 && (
        <p className="text-xs text-green-600 font-medium">+{new_} new</p>
      )}
    </div>
  );
}
