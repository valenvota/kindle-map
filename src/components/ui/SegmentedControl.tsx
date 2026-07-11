import type { ReactNode } from 'react';

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  icon?: ReactNode;
};

type Props<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  'aria-label'?: string;
};

/**
 * Apple-style segmented control with a sliding thumb.
 * Equal-width segments; the thumb translates to the active index.
 */
export function SegmentedControl<T extends string>({ options, value, onChange, ...aria }: Props<T>) {
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const pct = 100 / options.length;

  return (
    <div className="km-seg" role="tablist" aria-label={aria['aria-label']}>
      <div
        className="km-seg__thumb"
        style={{
          width: `calc((100% - 6px) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          className={`km-seg__btn${o.value === value ? ' on' : ''}`}
          style={{ width: `${pct}%`, minWidth: 78 }}
          onClick={() => onChange(o.value)}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}
