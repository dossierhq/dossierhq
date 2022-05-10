import type { AdminSchema, PublishedSchema } from '@jonasb/datadata-core';
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
import React, { useEffect } from 'react';

export interface EntityTypeItem extends MultipleSelectorItem {
  name: string;
}

export type EntityTypeSelectorReducer = MultipleSelectorReducer<EntityTypeItem>;
export type EntityTypeSelectorInitArgs = { selectedIds?: string[] };
export type EntityTypeSelectorState = MultipleSelectorState<EntityTypeItem>;
export type EntityTypeSelectorDispatch = Dispatch<MultipleSelectorStateAction<EntityTypeItem>>;

type Props = Omit<DropdownSelectorProps<EntityTypeItem>, 'renderItem'> & {
  schema: AdminSchema | PublishedSchema | undefined;
  restrictEntityTypes?: string[];
};

export function initializeEntityTypeSelectorState({
  selectedIds,
}: EntityTypeSelectorInitArgs): MultipleSelectorState<EntityTypeItem> {
  const items: EntityTypeItem[] = [];
  return initializeMultipleSelectorState({
    items,
    selectedIds,
  });
}

export const reduceEntityTypeSelectorState: EntityTypeSelectorReducer = reduceMultipleSelectorState;

export function EntityTypeSelector({ schema, restrictEntityTypes, ...props }: Props): JSX.Element {
  const { dispatch } = props;

  useEffect(() => {
    if (schema) {
      let entityTypes = schema.spec.entityTypes;
      if (restrictEntityTypes && restrictEntityTypes.length > 0) {
        entityTypes = entityTypes.filter((it) => restrictEntityTypes.includes(it.name));
      }
      const items = entityTypes.map((it) => ({ id: it.name, name: it.name }));
      dispatch(new MultipleSelectorStateActions.UpdateItems(items));
    }
  }, [schema, dispatch, restrictEntityTypes]);

  // useDebugLogChangedValues('EntityTypeSelector changed values', { schema, dispatch, restrictEntityTypes });

  return <DropdownSelector<EntityTypeItem> {...props} renderItem={(item) => item.name} />;
}
