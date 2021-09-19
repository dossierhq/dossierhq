import type { Dispatch } from 'react';
import React from 'react';
import type {
  DropdownSelectorProps,
  MultipleSelectorItem,
  MultipleSelectorReducer,
  MultipleSelectorState,
  MultipleSelectorStateAction,
  StatusColor,
} from '../..';
import { DropdownSelector, initializeMultipleSelectorState, Tag } from '../..';

export interface StatusItem extends MultipleSelectorItem {
  name: string;
  color: keyof typeof StatusColor;
}

export type StatusSelectorReducer = MultipleSelectorReducer<StatusItem>;
export type StatusSelectorInitArgs = { selectedIds?: string[] };
export type StatusSelectorState = MultipleSelectorState<StatusItem>;
export type StatusSelectorDispatch = Dispatch<MultipleSelectorStateAction<StatusItem>>;

type Props = Omit<DropdownSelectorProps<StatusItem>, 'renderItem'>;

export function initializeStatusSelectorState({
  selectedIds,
}: StatusSelectorInitArgs): MultipleSelectorState<StatusItem> {
  return initializeMultipleSelectorState({
    items: [
      { id: 'draft', name: 'Draft', color: 'draft' },
      { id: 'published', name: 'Published', color: 'published' },
      { id: 'modified', name: 'Modified', color: 'modified' },
      { id: 'withdrawn', name: 'Withdrawn', color: 'withdrawn' },
      { id: 'archived', name: 'Archived', color: 'archived' },
    ],
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
