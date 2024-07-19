'use client';

import type { EntityStatus } from '@dossierhq/core';
import type { Dispatch } from 'react';
import { MultiCombobox } from '../components/MultiCombobox.js';
import {
  ContentListStateActions,
  type ContentListState,
  type ContentListStateAction,
} from '../reducers/ContentListReducer.js';

interface Item {
  value: EntityStatus;
  label: string;
}

const ITEMS: Item[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'modified', label: 'Modified' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'archived', label: 'Archived' },
];

const EMPTY_LIST: EntityStatus[] = [];

export function EntityStatusSelector({
  contentListState,
  dispatchContentList,
}: {
  contentListState: ContentListState;
  dispatchContentList: Dispatch<ContentListStateAction>;
}) {
  const selected = (contentListState as ContentListState<'full'>).query.status ?? EMPTY_LIST;
  return (
    <MultiCombobox<Item>
      items={ITEMS}
      selected={selected}
      placeholder="Status"
      onSelect={(status) =>
        dispatchContentList(
          new ContentListStateActions.SetQuery(
            { status: [...selected, status] },
            { partial: true, resetPagingIfModifying: true },
          ),
        )
      }
      onUnselect={(status) =>
        dispatchContentList(
          new ContentListStateActions.SetQuery(
            { status: selected.filter((it) => it !== status) },
            { partial: true, resetPagingIfModifying: true },
          ),
        )
      }
    />
  );
}
