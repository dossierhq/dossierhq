import { Field, TagSelector } from '@jonasb/datadata-design';
import React from 'react';
import type { EntityTypeSelectorDispatch, EntityTypeSelectorState } from '../..';

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
