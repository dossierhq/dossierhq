import { Field, TagSelector } from '@dossierhq/design';
import type {
  EntityTypeSelectorDispatch,
  EntityTypeSelectorState,
} from '../EntityTypeSelector/EntityTypeSelector.js';

interface Props {
  state: EntityTypeSelectorState;
  dispatch: EntityTypeSelectorDispatch;
}

export function EntityTypeTagSelector({ state, dispatch }: Props) {
  if (state.selectedIds.length === 0) {
    return null;
  }

  return (
    <Field>
      <Field.Label size="small">Show entity types</Field.Label>
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
