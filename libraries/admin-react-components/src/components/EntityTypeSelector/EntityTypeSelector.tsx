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
  MultipleSelectorStateActions,
  reduceMultipleSelectorState,
} from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import React, { useContext, useEffect } from 'react';
import { DataDataContext } from '../..';

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
    items: [],
    selectedIds,
  });
}

export const reduceEntityTypeSelectorState: EntityTypeSelectorReducer = reduceMultipleSelectorState;

export function EntityTypeSelector(props: Props): JSX.Element {
  const { dispatch } = props;
  const { schema } = useContext(DataDataContext);

  useEffect(() => {
    const items = schema.spec.entityTypes.map((it) => ({ id: it.name, name: it.name }));
    dispatch(new MultipleSelectorStateActions.UpdateItems(items));
  }, [schema.spec.entityTypes, dispatch]);

  return <DropdownSelector<EntityTypeItem> {...props} renderItem={(item) => item.name} />;
}
