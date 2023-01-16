import { Field, TagSelector } from '@dossierhq/design';
import type {
  StatusSelectorDispatch,
  StatusSelectorState,
} from '../StatusSelector/StatusSelector.js';

interface Props {
  state: StatusSelectorState;
  dispatch: StatusSelectorDispatch;
}

export function StatusTagSelector({ state, dispatch }: Props) {
  if (state.selectedIds.length === 0) {
    return null;
  }

  return (
    <Field>
      <Field.Label size="small">Show entities with status</Field.Label>
      <Field.Control>
        <TagSelector
          clearLabel="Clear"
          itemTag={(item) => ({ tag: item.id, color: item.id })}
          state={state}
          dispatch={dispatch}
        />
      </Field.Control>
    </Field>
  );
}
