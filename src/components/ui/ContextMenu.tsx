import { useEffect, useRef, type ReactNode } from 'react';

export type MenuItem =
  | { type?: 'item'; label: string; icon?: ReactNode; onClick: () => void; danger?: boolean }
  | { type: 'separator' };

type Props = {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
};

/**
 * macOS-style context menu — translucent, rounded, roomy rows.
 * Renders at (x, y); closes on outside click, Escape, or item select.
 */
export function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div ref={ref} className="km-menu" style={{ left: x, top: y }} role="menu">
      {items.map((item, i) => {
        if ('type' in item && item.type === 'separator') {
          return <div key={i} className="km-menu__sep" />;
        }
        const it = item as Extract<MenuItem, { onClick: () => void }>;
        return (
          <button
            key={i}
            role="menuitem"
            className={`km-menu__item${it.danger ? ' km-menu__item--danger' : ''}`}
            onClick={() => {
              it.onClick();
              onClose();
            }}
          >
            {it.icon}
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
