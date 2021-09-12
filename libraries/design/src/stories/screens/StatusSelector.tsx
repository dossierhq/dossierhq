import type { Dispatch } from 'react';
import React from 'react';
import { Tag } from 'react-bulma-components';
import type {
  MultipleSelectorItem,
  MultipleSelectorReducer,
  MultipleSelectorState,
  MultipleSelectorStateAction,
} from '../../components';
import { DropdownSelector, initializeMultipleSelectorState } from '../../components';

export interface StatusItem extends MultipleSelectorItem {
  name: string;
  color: string;
}

export type StatusSelectorReducer = MultipleSelectorReducer<StatusItem>;
export type StatusSelectorInitArgs = { selectedIds?: string[] };
export type StatusSelectorState = MultipleSelectorState<StatusItem>;
export type StatusSelectorDispatch = Dispatch<MultipleSelectorStateAction<StatusItem>>;

interface Props {
  label: string;
  state: StatusSelectorState;
  dispatch: StatusSelectorDispatch;
}

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

export function StatusSelector({ label, state, dispatch }: Props): JSX.Element {
  return (
    <DropdownSelector
      label={label}
      state={state}
      dispatch={dispatch}
      renderItem={(item) => <Tag color={item.color}>{item.name}</Tag>}
    />
  );
}
