import type { Dispatch } from 'react';
import React from 'react';
import type {
  MultipleSelectorItem,
  MultipleSelectorReducer,
  MultipleSelectorState,
  MultipleSelectorStateAction,
} from '../../components';
import { DropdownSelector, initializeMultipleSelectorState } from '../../components';

export interface EntityTypeItem extends MultipleSelectorItem {
  name: string;
}

export type EntityTypeSelectorReducer = MultipleSelectorReducer<EntityTypeItem>;
export type EntityTypeSelectorInitArgs = { selectedIds?: string[] };
export type EntityTypeSelectorState = MultipleSelectorState<EntityTypeItem>;
export type EntityTypeSelectorDispatch = Dispatch<MultipleSelectorStateAction<EntityTypeItem>>;

interface Props {
  label: string;
  state: EntityTypeSelectorState;
  dispatch: EntityTypeSelectorDispatch;
}

export function initializeEntityTypeSelectorState({
  selectedIds,
}: EntityTypeSelectorInitArgs): MultipleSelectorState<EntityTypeItem> {
  return initializeMultipleSelectorState({
    items: [
      { id: 'foo', name: 'Foo' },
      { id: 'bar', name: 'Bar' },
    ],
    selectedIds,
  });
}

export function EntityTypeSelector({ label, state, dispatch }: Props): JSX.Element {
  return (
    <DropdownSelector
      label={label}
      state={state}
      dispatch={dispatch}
      renderItem={(item) => item.name}
    />
  );
}
