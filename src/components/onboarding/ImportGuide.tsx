import { ChevronLeft } from 'lucide-react';
import { FileUploader } from '../import/FileUploader';
import { ImportSummary } from '../import/ImportSummary';
import { useImportClippings } from '../../hooks/useImportClippings';

type Props = {
  onBack: () => void;
  onDone: () => void;
};

function JourneyArt() {
  return (
    <svg viewBox="0 0 520 140" fill="none" aria-hidden="true" width="100%" height="100%">
      <rect className="km-onb-pop km-onb-p1" x="20" y="26" width="86" height="92" rx="12" fill="#22344A" stroke="#3C5064" strokeWidth="1.4" />
      <rect x="32" y="38" width="62" height="60" rx="5" fill="#2A3D53" />
      <rect x="40" y="48" width="40" height="5" rx="2.5" fill="#7E93A6" />
      <rect x="40" y="59" width="46" height="5" rx="2.5" fill="#54697D" />
      <rect x="40" y="70" width="30" height="5" rx="2.5" fill="#D19A57" />
      <circle cx="63" cy="108" r="3.5" fill="#3C5064" />
      <text x="63" y="134" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="11" fill="#8FA3B4">Kindle drive</text>
      <path className="km-onb-draw" d="M118 72 H172" stroke="#6E93AE" strokeWidth="2" fill="none" />
      <path d="M164 66 l9 6 -9 6" stroke="#6E93AE" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path className="km-onb-pop km-onb-p2" d="M196 48 h26 l7 9 h39 a5 5 0 0 1 5 5 v34 a5 5 0 0 1 -5 5 h-72 a5 5 0 0 1 -5 -5 v-43 a5 5 0 0 1 5 -5 z" fill="#22344A" stroke="#3C5064" strokeWidth="1.4" />
      <text x="238" y="134" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="11" fill="#8FA3B4">documents</text>
      <path className="km-onb-draw" d="M296 72 H350" stroke="#6E93AE" strokeWidth="2" fill="none" />
      <path d="M342 66 l9 6 -9 6" stroke="#6E93AE" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <g className="km-onb-pop km-onb-p3">
        <path d="M382 30 h48 l20 20 v58 a4 4 0 0 1 -4 4 h-64 a4 4 0 0 1 -4 -4 v-74 a4 4 0 0 1 4 -4 z" fill="#EDE9E2" />
        <path d="M430 30 v20 h20" fill="#D9D3C8" />
        <rect x="392" y="66" width="48" height="5" rx="2.5" fill="#5C6E80" />
        <rect x="392" y="77" width="38" height="5" rx="2.5" fill="#8a99a8" />
        <rect x="392" y="90" width="30" height="6" rx="3" fill="#B06A4F" />
      </g>
      <text x="418" y="134" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="11" fill="#CC8A67">My Clippings.txt</text>
    </svg>
  );
}

export function ImportGuide({ onBack, onDone }: Props) {
  const { state, importFile, reset } = useImportClippings();
  const idle = state.status === 'idle';

  return (
    <div className="km-onb">
      <div className="km-onb__top">
        <div className="km-onb__brand"><div className="km-onb__mark">K</div><div className="km-onb__word">KindleMap</div></div>
        <button className="km-onb__back" onClick={onBack}><ChevronLeft /> Back to welcome</button>
      </div>

      <div className="km-onb__stage">
        <div className="km-onb__guide">
          <h1 className="km-onb__gtitle km-onb-anim km-onb-d1">Bring in your highlights</h1>

          {idle ? (
            <>
              <p className="km-onb__gsub km-onb-anim km-onb-d1">Your Kindle keeps them as one plain text file. Here's where to find it.</p>
              <div className="km-onb__journey km-onb-anim km-onb-d2"><JourneyArt /></div>
              <ol className="km-onb__steps km-onb-anim km-onb-d3">
                <li><span className="km-onb__num">1</span><span className="t">Connect your Kindle to your computer with a USB cable.</span></li>
                <li><span className="km-onb__num">2</span><span className="t">Your Kindle appears as a drive, like a USB stick.</span></li>
                <li><span className="km-onb__num">3</span><span className="t">Open the Kindle drive, then the <code>documents</code> folder.</span></li>
                <li><span className="km-onb__num">4</span><span className="t">Find <code>My&nbsp;Clippings.txt</code>.</span></li>
                <li><span className="km-onb__num">5</span><span className="t">Drop it below, or click to browse.</span></li>
              </ol>
              <div className="km-onb-anim km-onb-d4">
                <FileUploader tone="dark" onFile={importFile} />
              </div>
            </>
          ) : (
            <div className="km-onb__summary">
              <ImportSummary state={state} onDone={onDone} onReset={reset} />
            </div>
          )}
        </div>
      </div>

      <p className="km-onb__privacy">Nothing leaves your device.</p>
    </div>
  );
}
