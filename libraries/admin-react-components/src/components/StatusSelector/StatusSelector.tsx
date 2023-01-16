import { AdminEntityStatus } from '@dossierhq/core';
import type {
  DropdownSelectorProps,
  MultipleSelectorItem,
  MultipleSelectorReducer,
  MultipleSelectorState,
  MultipleSelectorStateAction,
} from '@jonasb/datadata-design';
import {
  DropdownSelector,
  initializeMultipleSelectorState,
  reduceMultipleSelectorState,
} from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import { StatusTag } from '../StatusTag/StatusTag.js';

export type StatusItem = MultipleSelectorItem<AdminEntityStatus>;

export type StatusSelectorReducer = MultipleSelectorReducer<StatusItem>;
export type StatusSelectorInitArgs = { selectedIds?: AdminEntityStatus[] | undefined };
export type StatusSelectorState = MultipleSelectorState<StatusItem>;
export type StatusSelectorDispatch = Dispatch<MultipleSelectorStateAction<StatusItem>>;

type Props = Omit<DropdownSelectorProps<StatusItem>, 'renderItem'>;

export function initializeStatusSelectorState({
  selectedIds,
}: StatusSelectorInitArgs): StatusSelectorState {
  const items: StatusItem[] = [
    { id: AdminEntityStatus.draft },
    { id: AdminEntityStatus.published },
    { id: AdminEntityStatus.modified },
    { id: AdminEntityStatus.withdrawn },
    { id: AdminEntityStatus.archived },
  ];
  return initializeMultipleSelectorState<StatusItem>({
    items,
    selectedIds,
  });
}

export const reduceStatusSelectorState: StatusSelectorReducer = reduceMultipleSelectorState;

export function StatusSelector(props: Props): JSX.Element {
  return (
    <DropdownSelector<StatusItem>
      {...props}
      renderItem={(item) => <StatusTag status={item.id} />}
    />
  );
}
