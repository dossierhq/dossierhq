import { Field, TagSelector } from '@jonasb/datadata-design';
import React from 'react';
import type { StatusSelectorDispatch, StatusSelectorState } from '../../index.js';
import { statusDisplay } from '../../utils/DisplayUtils.js';

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
          itemTag={(item) => ({ tag: statusDisplay(item.id), color: item.id })}
          state={state}
          dispatch={dispatch}
        />
      </Field.Control>
    </Field>
  );
}
