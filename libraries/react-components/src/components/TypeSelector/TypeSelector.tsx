import type { PublishedSchema, Schema } from '@dossierhq/core';
import {
  DropdownSelector,
  MultipleSelectorStateActions,
  type DropdownSelectorProps,
  type MultipleSelectorItem,
  type MultipleSelectorState,
  type MultipleSelectorStateAction,
} from '@dossierhq/design';
import { useEffect, type Dispatch, type JSX } from 'react';

export interface TypeItem extends MultipleSelectorItem {
  name: string;
  kind: 'entity' | 'component';
}

export type TypeSelectorState = MultipleSelectorState<TypeItem>;
export type TypeSelectorDispatch = Dispatch<MultipleSelectorStateAction<TypeItem>>;

type Props = Omit<DropdownSelectorProps<TypeItem>, 'renderItem'> & {
  schema: Schema | PublishedSchema | undefined;
};

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
