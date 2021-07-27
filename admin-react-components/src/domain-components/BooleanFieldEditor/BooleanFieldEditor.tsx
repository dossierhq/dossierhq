import React from 'react';
import type { EntityFieldEditorProps } from '../..';
import { Checkbox, IconButton } from '../..';

type Props = EntityFieldEditorProps<boolean>;

export function BooleanFieldEditor({ id, value, fieldSpec, onChange }: Props): JSX.Element {
  return (
    <div>
      <Checkbox {...{ id, checked: value ?? undefined, onChange }} />
      {value !== null ? (
        <IconButton
          title={fieldSpec.list ? 'Remove item' : 'Clear'}
          icon="remove"
          onClick={() => onChange?.(null)}
        />
      ) : null}
    </div>
  );
}
