import React from 'react';
import { IconButton } from '../../generic-components/IconButton/IconButton';
import { InputText } from '../../generic-components/InputText/InputText';
import type { LegacyEntityFieldEditorProps } from '../LegacyEntityFieldEditor/LegacyEntityFieldEditor';

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
