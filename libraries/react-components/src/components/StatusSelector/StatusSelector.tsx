import { EntityStatus } from '@dossierhq/core';
import {
  DropdownSelector,
  initializeMultipleSelectorState,
  reduceMultipleSelectorState,
  type DropdownSelectorProps,
  type MultipleSelectorItem,
  type MultipleSelectorReducer,
  type MultipleSelectorState,
  type MultipleSelectorStateAction,
} from '@dossierhq/design';
import type { Dispatch, JSX } from 'react';
import { StatusTag } from '../StatusTag/StatusTag.js';

export type StatusItem = MultipleSelectorItem<EntityStatus>;

export type StatusSelectorReducer = MultipleSelectorReducer<StatusItem>;
export type StatusSelectorInitArgs = { selectedIds?: EntityStatus[] | undefined };
export type StatusSelectorState = MultipleSelectorState<StatusItem>;
export type StatusSelectorDispatch = Dispatch<MultipleSelectorStateAction<StatusItem>>;

type Props = Omit<DropdownSelectorProps<StatusItem>, 'renderItem'>;

export function initializeStatusSelectorState({
  selectedIds,
}: StatusSelectorInitArgs): StatusSelectorState {
  const items: StatusItem[] = [
    { id: EntityStatus.draft },
    { id: EntityStatus.published },
    { id: EntityStatus.modified },
    { id: EntityStatus.withdrawn },
    { id: EntityStatus.archived },
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
