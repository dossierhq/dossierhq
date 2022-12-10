import React from 'react';
import { Field } from '../../components/Field/Field.js';
import { TagSelector } from '../../components/TagSelector/TagSelector.js';
import type { AuthKeySelectorDispatch, AuthKeySelectorState } from './AuthKeySelector.js';

export function AuthKeyTagList({
  state,
  dispatch,
}: {
  state: AuthKeySelectorState;
  dispatch: AuthKeySelectorDispatch;
}) {
  if (state.selectedIds.length === 0) {
    return null;
  }

  return (
    <Field>
      <Field.Label size="small">Show entities with authorization key</Field.Label>
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
