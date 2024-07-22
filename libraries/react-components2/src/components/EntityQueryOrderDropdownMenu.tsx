import { EntityQueryOrder } from '@dossierhq/core';
import { ArrowDownNarrowWideIcon, ArrowDownWideNarrowIcon } from 'lucide-react';
import type { Dispatch } from 'react';
import { Button } from '../components/ui/button.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu.js';
import { cn } from '../lib/utils.js';
import {
  ContentListStateActions,
  type ContentListState,
  type ContentListStateAction,
} from '../reducers/ContentListReducer.js';

export function EntityQueryOrderDropdownMenu({
  className,
  contentListState,
  dispatchContentList,
}: {
  className?: string;
  contentListState: ContentListState;
  dispatchContentList: Dispatch<ContentListStateAction>;
}) {
  const currentOrder = contentListState.query.order ?? EntityQueryOrder.updatedAt;
  const currentReverse = contentListState.query.reverse ?? false;
  const fieldDisplay = {
    name: 'Name',
    createdAt: 'Created',
    updatedAt: 'Updated',
  }[currentOrder];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={cn(className, 'min-w-32')} variant="outline" title="Change sort order">
          {currentReverse ? (
            <ArrowDownWideNarrowIcon className="mr-2 h-4 w-4" />
          ) : (
            <ArrowDownNarrowWideIcon className="mr-2 h-4 w-4" />
          )}
          {fieldDisplay}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-28" align="end">
        <DropdownMenuLabel>Sort order</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={currentOrder}
          onValueChange={(value) => {
            let newReverse = false;
            if (value === currentOrder) {
              newReverse = !currentReverse;
            } else if (
              value === EntityQueryOrder.updatedAt ||
              value === EntityQueryOrder.createdAt
            ) {
              // Default to descending order for dates
              newReverse = true;
            }
            dispatchContentList(
              new ContentListStateActions.SetQuery(
                { order: value as EntityQueryOrder, reverse: newReverse },
                { partial: true, resetPagingIfModifying: true },
              ),
            );
          }}
        >
          <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="createdAt">Created</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="updatedAt">Updated</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
