import React from 'react';
import type { LegacyEntityFieldEditorProps } from '../..';
import { Checkbox, IconButton } from '../..';

type Props = LegacyEntityFieldEditorProps<boolean>;

export function LegacyBooleanFieldEditor({ id, value, fieldSpec, onChange }: Props): JSX.Element {
  return (
    <div>
      <Checkbox {...{ id, checked: value, onChange }} />
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
