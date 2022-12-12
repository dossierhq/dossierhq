import type { Dispatch } from 'react';
import React from 'react';
import type { DropdownSelector2Props } from '../../components/DropdownSelector2/DropdownSelector2.js';
import { DropdownSelector2 } from '../../components/DropdownSelector2/DropdownSelector2.js';
import type {
  MultipleSelectorItem,
  MultipleSelectorReducer,
  MultipleSelectorState,
  MultipleSelectorStateAction,
} from '../../components/DropdownSelector/MultipleSelectorReducer.js';
import {
  initializeMultipleSelectorState,
  reduceMultipleSelectorState,
} from '../../components/DropdownSelector/MultipleSelectorReducer.js';

export interface EntityTypeItem extends MultipleSelectorItem {
  name: string;
}

export type EntityTypeSelectorReducer = MultipleSelectorReducer<EntityTypeItem>;
export type EntityTypeSelectorInitArgs = { selectedIds?: string[] };
export type EntityTypeSelectorState = MultipleSelectorState<EntityTypeItem>;
export type EntityTypeSelectorDispatch = Dispatch<MultipleSelectorStateAction<EntityTypeItem>>;

type Props = Omit<DropdownSelector2Props<EntityTypeItem>, 'renderItem'>;

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
  return <DropdownSelector2<EntityTypeItem> {...props} renderItem={(item) => item.name} />;
}
