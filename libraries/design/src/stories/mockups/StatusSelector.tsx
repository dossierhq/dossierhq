import type { Dispatch } from 'react';
import React from 'react';
import type { DropdownSelectorProps } from '../../components/DropdownSelector/DropdownSelector.js';
import { DropdownSelector } from '../../components/DropdownSelector/DropdownSelector.js';
import type {
  MultipleSelectorItem,
  MultipleSelectorReducer,
  MultipleSelectorState,
  MultipleSelectorStateAction,
} from '../../components/DropdownSelector/MultipleSelectorReducer.js';
import { initializeMultipleSelectorState } from '../../components/DropdownSelector/MultipleSelectorReducer.js';
import { Tag } from '../../components/Tag/Tag.js';
import type { StatusColor } from '../../config/Colors.js';

export interface StatusItem extends MultipleSelectorItem {
  name: string;
  color: (typeof StatusColor)[keyof typeof StatusColor];
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
