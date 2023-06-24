import { Field, TagSelector } from '@dossierhq/design';
import type { TypeSelectorDispatch, TypeSelectorState } from '../TypeSelector/TypeSelector.js';

interface Props {
  state: TypeSelectorState;
  dispatch: TypeSelectorDispatch;
}

export function TypeTagSelector({ state, dispatch }: Props) {
  if (state.selectedIds.length === 0) {
    return null;
  }

  return (
    <Field>
      <Field.Label size="small">Show types</Field.Label>
      <Field.Control>
        <TagSelector
          clearLabel="Clear"
          itemTag={(item) => ({ tag: item.name })}
          state={state}
          dispatch={dispatch}
        />
      </Field.Control>
    </Field>
  );
}
