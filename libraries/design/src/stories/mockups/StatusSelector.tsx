import type { Dispatch } from 'react';
import React from 'react';
import type {
  DropdownSelectorProps,
  MultipleSelectorItem,
  MultipleSelectorReducer,
  MultipleSelectorState,
  MultipleSelectorStateAction,
  StatusColor,
} from '../../index.js';
import { DropdownSelector, initializeMultipleSelectorState, Tag } from '../../index.js';

export interface StatusItem extends MultipleSelectorItem {
  name: string;
  color: typeof StatusColor[keyof typeof StatusColor];
}

export type StatusSelectorReducer = MultipleSelectorReducer<StatusItem>;
export type StatusSelectorInitArgs = { selectedIds?: string[] };
export type StatusSelectorState = MultipleSelectorState<StatusItem>;
export type StatusSelectorDispatch = Dispatch<MultipleSelectorStateAction<StatusItem>>;

type Props = Omit<DropdownSelectorProps<StatusItem>, 'renderItem'>;

export function initializeStatusSelectorState({
  selectedIds,
}: StatusSelectorInitArgs): MultipleSelectorState<StatusItem> {
  const items: StatusItem[] = [
    { id: 'draft', name: 'Draft', color: 'draft' },
    { id: 'published', name: 'Published', color: 'published' },
    { id: 'modified', name: 'Modified', color: 'modified' },
    { id: 'withdrawn', name: 'Withdrawn', color: 'withdrawn' },
    { id: 'archived', name: 'Archived', color: 'archived' },
  ];
  return initializeMultipleSelectorState({
    items,
    selectedIds,
  });
}

export function StatusSelector(props: Props): JSX.Element {
  return (
    <DropdownSelector<StatusItem>
      {...props}
      renderItem={(item) => <Tag color={item.color}>{item.name}</Tag>}
    />
  );
}
