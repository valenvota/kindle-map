import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './Button';

type Props = {
  title?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
};

/**
 * Centered modal sheet — translucent scrim, floating rounded panel with a
 * serif title. Closes on backdrop click or Escape.
 */
export function Modal({ title, onClose, children, footer, maxWidth }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="km-modal__backdrop" onClick={onClose}>
      <div
        className="km-modal__panel"
        style={maxWidth ? { maxWidth } : undefined}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {title !== undefined && (
          <div className="km-modal__head">
            <h2 className="km-modal__title">{title}</h2>
            <IconButton onClick={onClose} aria-label="Close">
              <X />
            </IconButton>
          </div>
        )}
        <div className="km-modal__body">{children}</div>
        {footer && <div className="km-modal__foot">{footer}</div>}
      </div>
    </div>
  );
}
