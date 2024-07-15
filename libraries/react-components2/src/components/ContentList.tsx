'use client';

import { SearchIcon } from 'lucide-react';
import { cn } from '../lib/utils.js';
import type { ContentListState } from '../reducers/ContentListReducer.js';
import { EmptyStateMessage } from './EmptyStateMessage.js';
import { EntityCard } from './EntityCard.js';

export function ContentList({
  className,
  contentListState,
  selectedItem,
  onItemClick,
}: {
  className?: string;
  contentListState: ContentListState;
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
        return (
          <EntityCard
            key={item.value.id}
            name={item.value.info.name}
            status={'status' in item.value.info ? item.value.info.status : undefined}
            type={item.value.info.type}
            updatedAt={'updatedAt' in item.value.info ? item.value.info.updatedAt : undefined}
            valid={item.value.info.valid}
            selected={selectedItem === item.value.id}
            onClick={onItemClick ? () => onItemClick(item.value.id) : undefined}
          />
        );
      })}
    </div>
  );
}
