import React from 'react';
import type { EntityFieldEditorProps } from '..';
import { IconButton, InputText } from '..';

type Props = EntityFieldEditorProps<string>;

export function StringFieldEditor({ id, value, fieldSpec, onChange }: Props): JSX.Element {
  return (
    <div>
      <InputText {...{ id, value, onChange }} />
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
