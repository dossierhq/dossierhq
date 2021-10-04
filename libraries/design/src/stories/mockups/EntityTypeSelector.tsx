import type { Dispatch } from 'react';
import React from 'react';
import type {
  DropdownSelectorProps,
  MultipleSelectorItem,
  MultipleSelectorReducer,
  MultipleSelectorState,
  MultipleSelectorStateAction,
} from '../../index.js';
import {
  DropdownSelector,
  initializeMultipleSelectorState,
  reduceMultipleSelectorState,
} from '../../index.js';

export interface EntityTypeItem extends MultipleSelectorItem {
  name: string;
}

export type EntityTypeSelectorReducer = MultipleSelectorReducer<EntityTypeItem>;
export type EntityTypeSelectorInitArgs = { selectedIds?: string[] };
export type EntityTypeSelectorState = MultipleSelectorState<EntityTypeItem>;
export type EntityTypeSelectorDispatch = Dispatch<MultipleSelectorStateAction<EntityTypeItem>>;

type Props = Omit<DropdownSelectorProps<EntityTypeItem>, 'renderItem'>;

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

export const reduceEntityTypeSelectorState: EntityTypeSelectorReducer = reduceMultipleSelectorState;

export function EntityTypeSelector(props: Props): JSX.Element {
  return <DropdownSelector<EntityTypeItem> {...props} renderItem={(item) => item.name} />;
}
