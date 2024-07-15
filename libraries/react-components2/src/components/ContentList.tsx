'use client';

import type { EntityInfo } from '@dossierhq/core';
import { SearchIcon } from 'lucide-react';
import { cn } from '../lib/utils.js';
import type { ContentListState } from '../reducers/ContentListReducer.js';
import { EmptyStateMessage } from './EmptyStateMessage.js';
import { EntityCard } from './EntityCard.js';

export function ContentList({
  className,
  contentListState,
  showDate,
  selectedItem,
  onItemClick,
}: {
  className?: string;
  contentListState: ContentListState;
  showDate: 'createdAt' | 'updatedAt';
  selectedItem?: string | null;
  onItemClick?: (id: string) => void;
}) {
  if (contentListState.entities?.length === 0) {
    return (
      <div className={cn(className, 'flex flex-col items-center justify-center')}>
        <EmptyStateMessage
          className="w-full max-w-96"
          icon={<SearchIcon className="h-full w-full" />}
          title="No matches"
          description="No content match the filters."
        />
      </div>
    );
  }
  return (
    <div className={cn(className, 'flex flex-col gap-2')}>
      {contentListState.entities?.map((item) => {
        if (item.isError()) {
          return null;
        }
        const info = item.value.info;
        const dateKind = showDate === 'createdAt' || !('updatedAt' in info) ? 'created' : 'updated';
        return (
          <EntityCard
            key={item.value.id}
            name={info.name}
            status={'status' in info ? info.status : undefined}
            type={info.type}
            date={dateKind === 'created' ? info.createdAt : (info as EntityInfo).updatedAt}
            dateKind={dateKind}
            valid={info.valid}
            selected={selectedItem === item.value.id}
            onClick={onItemClick ? () => onItemClick(item.value.id) : undefined}
          />
        );
      })}
    </div>
  );
}
