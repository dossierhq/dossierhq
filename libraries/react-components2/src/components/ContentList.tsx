'use client';

import { cn } from '../lib/utils.js';
import type { ContentListState } from '../reducers/ContentListReducer.js';
import { EntityCard } from './EntityCard.js';

export function ContentList({
  className,
  contentListState,
  onItemClick,
}: {
  className?: string;
  contentListState: ContentListState;
  onItemClick?: (id: string) => void;
}) {
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
            onClick={onItemClick ? () => onItemClick(item.value.id) : undefined}
          />
        );
      })}
    </div>
  );
}
