import type { AdminSchema, PublishedSchema } from '@dossierhq/core';
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
import { useEffect } from 'react';

export interface EntityTypeItem extends MultipleSelectorItem {
  name: string;
}

export type EntityTypeSelectorReducer = MultipleSelectorReducer<EntityTypeItem>;
export type EntityTypeSelectorInitArgs = { selectedIds?: string[] };
export type EntityTypeSelectorState = MultipleSelectorState<EntityTypeItem>;
export type EntityTypeSelectorDispatch = Dispatch<MultipleSelectorStateAction<EntityTypeItem>>;

type Props = Omit<DropdownSelectorProps<EntityTypeItem>, 'renderItem'> & {
  schema: AdminSchema | PublishedSchema | undefined;
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

export function EntityTypeSelector({ schema, ...props }: Props): JSX.Element {
  const { dispatch } = props;

  useEffect(() => {
    if (schema) {
      const items = schema.spec.entityTypes.map((it) => ({ id: it.name, name: it.name }));
      dispatch(new MultipleSelectorStateActions.UpdateItems(items));
    }
  }, [schema, dispatch]);

  // useDebugLogChangedValues('EntityTypeSelector changed values', { schema, dispatch });

  return <DropdownSelector<EntityTypeItem> {...props} renderItem={(item) => item.name} />;
}
