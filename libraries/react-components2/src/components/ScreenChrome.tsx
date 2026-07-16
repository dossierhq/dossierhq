import type { ReactNode } from 'react';
import { cn } from '../lib/utils.js';

export interface ScreenChromeProps {
  /** Rendered above the screen, e.g. a navigation bar. */
  header?: ReactNode;
  /** Rendered below the screen, e.g. a status bar. */
  footer?: ReactNode;
}

export function ScreenChrome({
  header,
  footer,
  className,
  children,
}: ScreenChromeProps & { className?: string; children: ReactNode }) {
  return (
    <div className="flex h-dvh w-dvw flex-col overflow-hidden">
      {header}
      <div className={cn('flex min-h-0 grow overflow-hidden', className)}>{children}</div>
      {footer}
    </div>
  );
}
