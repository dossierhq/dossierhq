import React from 'react';
import { Field } from '../../components/Field/Field.js';
import { TagSelector } from '../../components/TagSelector/TagSelector.js';
import type { StatusSelectorDispatch, StatusSelectorState } from './StatusSelector.js';

export function StatusTagList({
  state,
  dispatch,
}: {
  state: StatusSelectorState;
  dispatch: StatusSelectorDispatch;
}) {
  if (state.selectedIds.length === 0) {
    return null;
  }

  return (
    <Field>
      <Field.Label size="small">Show entities with status</Field.Label>
      <Field.Control>
        <TagSelector
          clearLabel="Clear"
          itemTag={(item) => ({ tag: item.name, color: item.color })}
          state={state}
          dispatch={dispatch}
        />
      </Field.Control>
    </Field>
  );
}
