import type { HTMLAttributes, ReactNode } from 'react';

type Props = HTMLAttributes<HTMLDivElement> & {
  elevated?: boolean;
  children: ReactNode;
};

/**
 * Surface / card primitive — the paper object that content sits on.
 * `elevated` swaps the hairline border for a soft shadow.
 */
export function Surface({ elevated = false, className = '', children, ...rest }: Props) {
  const cls = ['km-surface', elevated ? 'km-surface--elevated' : '', className].filter(Boolean).join(' ');
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  );
}
