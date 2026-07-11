import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

/**
 * KindleMap primary button primitive.
 * Variants: primary (accent), secondary (surface), ghost, danger.
 */
export function Button({ variant = 'secondary', size = 'md', className = '', children, ...rest }: Props) {
  const cls = ['km-btn', `km-btn--${variant}`, `km-btn--${size}`, className].filter(Boolean).join(' ');
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode };

/** Square icon-only button. */
export function IconButton({ className = '', children, ...rest }: IconButtonProps) {
  return (
    <button className={['km-iconbtn', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </button>
  );
}
