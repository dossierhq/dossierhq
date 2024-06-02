import type { EntityInfo, PublishedEntityInfo } from '@dossierhq/core';
import { Key } from 'lucide-react';
import { cn } from '../lib/utils.js';
import { DateDisplay } from './DateDisplay.js';
import { Badge } from './ui/badge.js';

export function EntityCard({
  id,
  className,
  info,
  changed,
  selected,
  onClick,
}: {
  id?: string;
  className?: string;
  info: EntityInfo | PublishedEntityInfo;
  changed?: boolean;
  selected?: boolean;
  onClick?: () => void;
}) {
  if (!onClick) {
    return (
      <div
        id={id}
        className={cn(className, 'rounded border bg-background p-2', selected && 'bg-muted')}
      >
        <Content info={info} changed={changed} />
      </div>
    );
  }
  return (
    <button
      id={id}
      className={cn(
        className,
        'rounded border bg-background p-2 text-start hover:bg-accent',
        selected && 'bg-muted',
      )}
      onClick={onClick}
    >
      <Content info={info} changed={changed} />
    </button>
  );
}

const showAuthKey = false;

function Content({ info, changed }: { info: EntityInfo | PublishedEntityInfo; changed?: boolean }) {
  const isFull = 'status' in info;
  return (
    <>
      <div className="flex justify-between gap-2 align-top">
        <p className="w-0 flex-grow overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground">
          {info.type}
        </p>
        <div className="flex gap-2 align-baseline">
          {!info.valid && (
            <span className="relative">
              <Badge variant="destructive">Invalid</Badge>
            </span>
          )}
          {isFull && (
            <span className="relative">
              <Badge variant="outline">{info.status[0].toUpperCase() + info.status.slice(1)}</Badge>
            </span>
          )}
          {showAuthKey && (
            <span className="relative">
              <Key className="absolute left-2 top-1.5 h-3 w-3" />
              <Badge className="pl-6" variant="outline">
                {info.authKey}
              </Badge>
            </span>
          )}
          {changed && (
            <span className="inline-block h-3 w-3 self-center rounded-full bg-foreground" />
          )}
        </div>
      </div>
      <div className="flex justify-between gap-2 align-baseline">
        <p className="w-0 flex-grow overflow-hidden text-ellipsis whitespace-nowrap font-medium">
          {info.name}
        </p>
        {isFull && (
          <p className="overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground">
            Updated <DateDisplay date={info.updatedAt} />
          </p>
        )}
      </div>
    </>
  );
}
