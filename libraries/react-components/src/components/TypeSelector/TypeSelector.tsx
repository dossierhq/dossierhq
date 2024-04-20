import type { Schema, PublishedSchema } from '@dossierhq/core';
import {
  DropdownSelector,
  MultipleSelectorStateActions,
  initializeMultipleSelectorState,
  reduceMultipleSelectorState,
  type DropdownSelectorProps,
  type MultipleSelectorItem,
  type MultipleSelectorReducer,
  type MultipleSelectorState,
  type MultipleSelectorStateAction,
} from '@dossierhq/design';
import { useEffect, type Dispatch } from 'react';

export interface TypeItem extends MultipleSelectorItem {
  name: string;
  kind: 'entity' | 'component';
}

export type TypeSelectorReducer = MultipleSelectorReducer<TypeItem>;
export type TypeSelectorInitArgs = { selectedIds?: string[] };
export type TypeSelectorState = MultipleSelectorState<TypeItem>;
export type TypeSelectorDispatch = Dispatch<MultipleSelectorStateAction<TypeItem>>;

type Props = Omit<DropdownSelectorProps<TypeItem>, 'renderItem'> & {
  schema: Schema | PublishedSchema | undefined;
};

export function initializeTypeSelectorState({
  selectedIds,
}: TypeSelectorInitArgs): MultipleSelectorState<TypeItem> {
  const items: TypeItem[] = [];
  return initializeMultipleSelectorState({ items, selectedIds });
}

export const reduceEntityTypeSelectorState: TypeSelectorReducer = reduceMultipleSelectorState;

export function TypeSelector({ schema, ...props }: Props): JSX.Element {
  const { dispatch } = props;

  useEffect(() => {
    if (schema) {
      const items = [
        ...schema.spec.entityTypes.map(
          (it): TypeItem => ({ id: it.name, name: it.name, kind: 'entity' }),
        ),
        ...schema.spec.componentTypes.map(
          (it): TypeItem => ({ id: it.name, name: it.name, kind: 'component' }),
        ),
      ];
      dispatch(new MultipleSelectorStateActions.UpdateItems(items));
    }
  }, [schema, dispatch]);

  // useDebugLogChangedValues('TypeSelector changed values', { schema, dispatch });

  return <DropdownSelector<TypeItem> {...props} renderItem={(item) => item.name} />;
}
