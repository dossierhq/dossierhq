import type { Dispatch, JSX } from 'react';
import {
  DropdownSelector,
  type DropdownSelectorProps,
} from '../../components/DropdownSelector/DropdownSelector.js';
import {
  initializeMultipleSelectorState,
  reduceMultipleSelectorState,
  type MultipleSelectorItem,
  type MultipleSelectorReducer,
  type MultipleSelectorState,
  type MultipleSelectorStateAction,
} from '../../components/DropdownSelector/MultipleSelectorReducer.js';

interface EntityTypeItem extends MultipleSelectorItem {
  name: string;
}

type EntityTypeSelectorReducer = MultipleSelectorReducer<EntityTypeItem>;
type EntityTypeSelectorInitArgs = { selectedIds?: string[] };
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
