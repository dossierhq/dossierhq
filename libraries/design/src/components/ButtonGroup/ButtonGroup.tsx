import type { ReactNode } from 'react';
import { toClassName } from '../../utils/ClassNameUtils.js';

export interface ButtonGroupProps {
  centered?: boolean;
  hasAddons?: boolean;
  noBottomMargin?: boolean;
  children: ReactNode;
}

export function ButtonGroup({ centered, hasAddons, noBottomMargin, children }: ButtonGroupProps) {
  return (
    <div
      className={toClassName(
        'buttons',
        centered && 'is-centered',
        hasAddons && 'has-addons',
        noBottomMargin && 'mb-0',
      )}
    >
      {children}
    </div>
  );
}
