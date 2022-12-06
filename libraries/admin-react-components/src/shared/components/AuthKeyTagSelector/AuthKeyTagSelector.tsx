import { Field, TagSelector } from '@jonasb/datadata-design';
import type {
  AuthKeySelectorDispatch,
  AuthKeySelectorState,
} from '../AuthKeySelector/AuthKeySelector.js';

interface Props {
  state: AuthKeySelectorState;
  dispatch: AuthKeySelectorDispatch;
}

export function AuthKeyTagSelector({ state, dispatch }: Props) {
  if (state.selectedIds.length === 0) {
    return null;
  }

  return (
    <Field>
      <Field.Label size="small">Show entities with authorization key</Field.Label>
      <Field.Control>
        <TagSelector
          clearLabel="Clear"
          itemTag={(item) => ({ tag: item.displayName })}
          state={state}
          dispatch={dispatch}
        />
      </Field.Control>
    </Field>
  );
}
