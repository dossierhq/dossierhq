import type { Dispatch } from 'react';
import React from 'react';
import { Tag } from 'react-bulma-components';
import type {
  DropdownSelectorProps,
  MultipleSelectorItem,
  MultipleSelectorReducer,
  MultipleSelectorState,
  MultipleSelectorStateAction,
} from '../..';
import { DropdownSelector, initializeMultipleSelectorState } from '../..';

export interface StatusItem extends MultipleSelectorItem {
  name: string;
  color: string;
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
      { id: 'draft', name: 'Draft', color: 'light' },
      { id: 'published', name: 'Published', color: 'success' },
      { id: 'modified', name: 'Modified', color: 'warning' },
      { id: 'withdrawn', name: 'Withdrawn', color: 'light' },
      { id: 'archived', name: 'Archived', color: 'danger' },
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
