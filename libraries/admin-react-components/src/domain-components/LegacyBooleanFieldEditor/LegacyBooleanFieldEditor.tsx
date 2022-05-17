import React from 'react';
import { Checkbox } from '../../generic-components/Checkbox/Checkbox';
import { IconButton } from '../../generic-components/IconButton/IconButton';
import type { LegacyEntityFieldEditorProps } from '../LegacyEntityFieldEditor/LegacyEntityFieldEditor';

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
