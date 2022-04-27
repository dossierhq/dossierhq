import React from 'react';
import type { LegacyEntityFieldEditorProps } from '../..';
import { IconButton, InputText } from '../..';

type Props = LegacyEntityFieldEditorProps<string>;

export function LegacyStringFieldEditor({ id, value, fieldSpec, onChange }: Props): JSX.Element {
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
