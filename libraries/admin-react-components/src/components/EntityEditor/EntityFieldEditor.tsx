import { Card } from '@jonasb/datadata-design';
import React from 'react';
import type { FieldEditorState } from '../../reducers/EntityEditorReducer/EntityEditorReducer';

interface Props {
  field: FieldEditorState;
}

export function EntityFieldEditor({ field }: Props) {
  return (
    <Card>
      <Card.Header>
        <Card.HeaderTitle>{field.fieldSpec.name}</Card.HeaderTitle>
      </Card.Header>
      <Card.Content>
        <pre>{JSON.stringify(field.value, null, 2)}</pre>
      </Card.Content>
    </Card>
  );
}
