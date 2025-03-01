import type { EntityStatus } from '@dossierhq/core';
import { Key } from 'lucide-react';
import { cn } from '../lib/utils.js';
import { DateDisplay } from './DateDisplay.js';
import { Badge } from './ui/badge.js';

interface Props extends ContentProps {
  id?: string;
  className?: string;
  selected?: boolean;
  onClick?: () => void;
}

interface ContentProps {
  authKey?: string | null;
  changed?: boolean;
  name: string;
  status?: EntityStatus;
  type: string;
  date?: Date;
  dateKind?: 'created' | 'updated';
  valid?: boolean;
}

export function EntityCard({ id, className, selected, onClick, ...props }: Props) {
  if (!onClick) {
    return (
      <div
        id={id}
        className={cn(className, 'bg-background rounded-sm border p-2', selected && 'bg-muted')}
      >
        <Content {...props} />
      </div>
    );
  }
  return (
    <button
      id={id}
      className={cn(
        className,
        'bg-background hover:bg-accent rounded-sm border p-2 text-start',
        selected && 'bg-muted',
      )}
      onClick={onClick}
    >
      <Content {...props} />
    </button>
  );
}

function Content({ authKey, changed, name, status, type, date, dateKind, valid }: ContentProps) {
  return (
    <>
      <div className="flex justify-between gap-2 align-top">
        <p className="text-muted-foreground w-0 grow overflow-hidden text-ellipsis whitespace-nowrap">
          {type}
        </p>
        <div className="flex gap-2 align-baseline">
          {valid === false && (
            <span className="relative">
              <Badge variant="destructive">Invalid</Badge>
            </span>
          )}
          {!!status && (
            <span className="relative">
              <Badge variant="outline">{status[0].toUpperCase() + status.slice(1)}</Badge>
            </span>
          )}
          {authKey && (
            <span className="relative">
              <Key className="absolute top-1.5 left-2 h-3 w-3" />
              <Badge className="pl-6" variant="outline">
                {authKey}
              </Badge>
            </span>
          )}
          {changed && (
            <span
              className="bg-foreground inline-block h-3 w-3 self-center rounded-full"
              title="Changed"
            />
          )}
        </div>
      </div>
      <div className="flex justify-between gap-2 align-baseline">
        <p className="w-0 grow overflow-hidden font-medium text-ellipsis whitespace-nowrap">
          {name}
        </p>
        {!!date && !!dateKind && (
          <p className="text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
            {{ created: 'Created', updated: 'Updated' }[dateKind]} <DateDisplay date={date} />
          </p>
        )}
      </div>
    </>
  );
}
