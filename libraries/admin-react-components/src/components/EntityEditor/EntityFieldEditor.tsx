import { Card } from '@jonasb/datadata-design';
import React from 'react';
import type { FieldEditorState } from '../../reducers/EntityEditorReducer/EntityEditorReducer';
import { FieldEditor } from './FieldEditor';

interface Props {
  field: FieldEditorState;
  onValueChange: (value: unknown) => void;
}

export function EntityFieldEditor({ field, onValueChange }: Props) {
  return (
    <Card>
      <Card.Header>
        <Card.HeaderTitle>{field.fieldSpec.name}</Card.HeaderTitle>
      </Card.Header>
      <Card.Content>
        <FieldEditor fieldSpec={field.fieldSpec} value={field.value} onChange={onValueChange} />
      </Card.Content>
    </Card>
  );
}
