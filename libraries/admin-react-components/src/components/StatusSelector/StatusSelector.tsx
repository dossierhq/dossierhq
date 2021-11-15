import { EntityPublishState } from '@jonasb/datadata-core';
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
import React from 'react';
import { StatusTag } from '../..';

export type StatusItem = MultipleSelectorItem<EntityPublishState>;

export type StatusSelectorReducer = MultipleSelectorReducer<StatusItem, EntityPublishState>;
export type StatusSelectorInitArgs = { selectedIds?: EntityPublishState[] | undefined };
export type StatusSelectorState = MultipleSelectorState<StatusItem, EntityPublishState>;
export type StatusSelectorDispatch = Dispatch<
  MultipleSelectorStateAction<StatusItem, EntityPublishState>
>;

type Props = Omit<DropdownSelectorProps<StatusItem, EntityPublishState>, 'renderItem'>;

export function initializeStatusSelectorState({
  selectedIds,
}: StatusSelectorInitArgs): StatusSelectorState {
  const items: StatusItem[] = [
    { id: EntityPublishState.Draft },
    { id: EntityPublishState.Published },
    { id: EntityPublishState.Modified },
    { id: EntityPublishState.Withdrawn },
    { id: EntityPublishState.Archived },
  ];
  return initializeMultipleSelectorState<StatusItem, EntityPublishState>({
    items,
    selectedIds,
  });
}

export const reduceStatusSelectorState: StatusSelectorReducer = reduceMultipleSelectorState;

export function StatusSelector(props: Props): JSX.Element {
  return (
    <DropdownSelector<StatusItem, EntityPublishState>
      {...props}
      renderItem={(item) => <StatusTag status={item.id} />}
    />
  );
}
