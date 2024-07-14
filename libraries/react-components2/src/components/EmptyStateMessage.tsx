import type { ReactNode } from 'react';
import { cn } from '../lib/utils.js';

export function EmptyStateMessage({
  className,
  icon,
  title,
  description,
}: {
  className?: string;
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className={cn(className, 'rounded border p-4')}>
      <div className="mx-auto h-10 w-10 text-slate-600 dark:text-slate-300">{icon}</div>
      <p className="mt-3 text-center text-xl font-bold text-slate-600 dark:text-slate-300">
        {title}
      </p>
      {description && (
        <p className="mt-2 text-center text-slate-500 dark:text-slate-400">{description}</p>
      )}
    </div>
  );
}
