import { useEffect, useRef, useState } from 'react';
import { Upload, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  onImport: () => void;
  onExplore: () => Promise<void> | void;
};

// ─── Slide illustrations (inline SVG, animated on mount) ────────────────────

function ArtConnect() {
  return (
    <svg viewBox="0 0 460 232" fill="none" aria-hidden="true" width="100%" height="100%">
      <rect className="km-onb-pop km-onb-p1" x="150" y="28" width="230" height="176" rx="14" fill="none" stroke="#3C5064" strokeWidth="1.4" strokeDasharray="5 7" />
      <path className="km-onb-draw" d="M118 148 C160 148 168 76 214 68" stroke="#6E93AE" strokeWidth="2" fill="none" />
      <path className="km-onb-draw" d="M118 136 C176 126 210 118 300 126" stroke="#6E93AE" strokeWidth="2" fill="none" />
      <path className="km-onb-draw" d="M118 158 C150 174 178 184 214 186" stroke="#6E93AE" strokeWidth="2" fill="none" />
      <g className="km-onb-pop km-onb-p1">
        <rect x="52" y="94" width="78" height="112" rx="8" fill="#22344A" stroke="#3C5064" />
        <rect x="66" y="110" width="34" height="6" rx="3" fill="#D19A57" />
        <rect x="66" y="124" width="50" height="6" rx="3" fill="#7E93A6" />
        <rect x="66" y="148" width="50" height="5" rx="2.5" fill="#54697D" />
        <rect x="66" y="160" width="42" height="5" rx="2.5" fill="#54697D" />
      </g>
      <g className="km-onb-pop km-onb-p2">
        <rect x="214" y="42" width="150" height="52" rx="10" fill="#EDE9E2" />
        <text x="230" y="72" fontFamily="Georgia,serif" fontSize="24" fill="#1C2B3A">&#8220;</text>
        <rect x="248" y="58" width="98" height="6" rx="3" fill="#5C6E80" />
        <rect x="248" y="72" width="70" height="6" rx="3" fill="#8a99a8" />
      </g>
      <g className="km-onb-pop km-onb-p3">
        <rect x="300" y="110" width="120" height="52" rx="10" fill="#F5EFE7" />
        <rect x="316" y="126" width="26" height="6" rx="3" fill="#B06A4F" />
        <rect x="316" y="140" width="80" height="6" rx="3" fill="#9a8a76" />
      </g>
      <g className="km-onb-pop km-onb-p4">
        <rect x="196" y="174" width="104" height="34" rx="17" fill="#22344A" stroke="#6E93AE" strokeWidth="1.4" />
        <rect x="216" y="187" width="64" height="7" rx="3.5" fill="#9DB4C6" />
      </g>
    </svg>
  );
}

function ArtLibrary() {
  return (
    <svg viewBox="0 0 460 232" fill="none" aria-hidden="true" width="100%" height="100%">
      <g className="km-onb-pop km-onb-p1">
        <rect x="60" y="46" width="74" height="120" rx="8" fill="#22344A" stroke="#3C5064" />
        <rect x="74" y="62" width="30" height="6" rx="3" fill="#B06A4F" />
        <rect x="74" y="76" width="46" height="6" rx="3" fill="#8FA3B4" />
      </g>
      <g className="km-onb-pop km-onb-p2">
        <rect x="144" y="46" width="74" height="120" rx="8" fill="#2A3D53" stroke="#3C5064" />
        <rect x="158" y="62" width="30" height="6" rx="3" fill="#D19A57" />
        <rect x="158" y="76" width="46" height="6" rx="3" fill="#8FA3B4" />
      </g>
      <g className="km-onb-pop km-onb-p3">
        <rect x="228" y="46" width="74" height="120" rx="8" fill="#22344A" stroke="#3C5064" />
        <rect x="242" y="62" width="30" height="6" rx="3" fill="#6E93AE" />
        <rect x="242" y="76" width="46" height="6" rx="3" fill="#8FA3B4" />
      </g>
      <g className="km-onb-pop km-onb-p4">
        <rect x="320" y="52" width="86" height="40" rx="9" fill="#EDE9E2" />
        <text x="332" y="80" fontFamily="Georgia,serif" fontSize="22" fill="#1C2B3A">&#8220;</text>
        <rect x="348" y="66" width="46" height="6" rx="3" fill="#5C6E80" />
        <rect x="348" y="78" width="34" height="6" rx="3" fill="#8a99a8" />
        <rect x="320" y="106" width="86" height="46" rx="9" fill="#F5EFE7" />
        <rect x="332" y="120" width="24" height="6" rx="3" fill="#B06A4F" />
        <rect x="332" y="132" width="58" height="6" rx="3" fill="#9a8a76" />
      </g>
    </svg>
  );
}

function ArtMap() {
  return (
    <svg viewBox="0 0 460 232" fill="none" aria-hidden="true" width="100%" height="100%">
      <rect className="km-onb-pop km-onb-p1" x="44" y="30" width="250" height="172" rx="12" fill="none" stroke="#5B7085" strokeWidth="1.5" strokeDasharray="5 6" />
      <text className="km-onb-pop km-onb-p1" x="60" y="52" fontFamily="Inter,sans-serif" fontSize="10" letterSpacing="1.5" fill="#8FA3B4">REGION</text>
      <path className="km-onb-draw" d="M130 108 C160 116 172 132 196 142" stroke="#6E93AE" strokeWidth="2" fill="none" />
      <path className="km-onb-draw" d="M196 96 C240 92 300 96 330 84" stroke="#6E93AE" strokeWidth="2" fill="none" />
      <g className="km-onb-pop km-onb-p2">
        <rect x="64" y="72" width="76" height="52" rx="8" fill="#22344A" stroke="#3C5064" />
        <rect x="78" y="88" width="34" height="6" rx="3" fill="#D19A57" />
        <rect x="78" y="102" width="48" height="6" rx="3" fill="#7E93A6" />
      </g>
      <g className="km-onb-pop km-onb-p3">
        <rect x="180" y="128" width="86" height="52" rx="8" fill="#2A3D53" stroke="#3C5064" />
        <rect x="194" y="144" width="52" height="6" rx="3" fill="#8FA3B4" />
        <rect x="194" y="158" width="38" height="6" rx="3" fill="#8FA3B4" />
      </g>
      <g className="km-onb-pop km-onb-p4">
        <rect x="316" y="58" width="104" height="52" rx="10" fill="#EDE9E2" />
        <rect x="330" y="76" width="64" height="6" rx="3" fill="#5C6E80" />
        <rect x="330" y="90" width="44" height="6" rx="3" fill="#8a99a8" />
      </g>
      <path className="km-onb-draw" d="M318 150 c16 -18 30 8 46 -6 s30 8 46 -6" stroke="#CC8A67" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const SLIDES = [
  { Art: ArtConnect, headline: 'A visual map of your reading mind.', subline: 'Turn your Kindle highlights into a living, visual workspace.' },
  { Art: ArtLibrary, headline: 'Books, quotes, notes and concepts, together.', subline: 'Import once. Everything organized, searchable, yours.' },
  { Art: ArtMap, headline: 'Map how your ideas connect.', subline: 'Draw links, group regions, pin what matters, and export your thinking.' },
];

const AUTO_MS = 6000;

export function WelcomeScreen({ onImport, onExplore }: Props) {
  const [active, setActive] = useState(0);
  const [exploring, setExploring] = useState(false);
  const paused = useRef(false);
  const reduce = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Auto-advance (skipped for reduced motion; pauses on hover).
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => { if (!paused.current) setActive((i) => (i + 1) % SLIDES.length); }, AUTO_MS);
    return () => clearInterval(t);
  }, [reduce]);

  const go = (n: number) => setActive((n + SLIDES.length) % SLIDES.length);

  const handleExplore = async () => {
    setExploring(true);
    try { await onExplore(); } finally { setExploring(false); }
  };

  const slide = SLIDES[active];
  const Art = slide.Art;

  return (
    <div className="km-onb">
      <div className="km-onb__top">
        <div className="km-onb__brand"><div className="km-onb__mark">K</div><div className="km-onb__word">KindleMap</div></div>
        <span />
      </div>

      <div className="km-onb__stage"
        onMouseEnter={() => { paused.current = true; }}
        onMouseLeave={() => { paused.current = false; }}
      >
        <div className="km-onb__slides">
          {/* keyed so the entrance animation replays on each slide change */}
          <div className="km-onb__slide" key={active}>
            <div className="km-onb__art"><Art /></div>
            <h1 className="km-onb__headline km-onb-anim km-onb-d1">{slide.headline}</h1>
            <p className="km-onb__subline km-onb-anim km-onb-d2">{slide.subline}</p>
          </div>
        </div>

        <div className="km-onb__controls">
          <button className="km-onb__arrow" aria-label="Previous" onClick={() => go(active - 1)}><ChevronLeft /></button>
          <div className="km-onb__dots">
            {SLIDES.map((_, i) => (
              <button key={i} className={`km-onb__dot${i === active ? ' km-onb__dot--on' : ''}`} aria-label={`Slide ${i + 1}`} onClick={() => go(i)} />
            ))}
          </div>
          <button className="km-onb__arrow" aria-label="Next" onClick={() => go(active + 1)}><ChevronRight /></button>
        </div>

        <div className="km-onb__actions">
          <button className="km-onb__btn km-onb__btn--primary" onClick={onImport} disabled={exploring}>
            <Upload /> Import your highlights
          </button>
          <button className="km-onb__btn km-onb__btn--ghost" onClick={handleExplore} disabled={exploring}>
            <Sparkles /> {exploring ? 'Loading…' : 'Explore with sample data'}
          </button>
        </div>
      </div>

      <p className="km-onb__privacy">Everything stays on your device. No account, no uploads.</p>
    </div>
  );
}
