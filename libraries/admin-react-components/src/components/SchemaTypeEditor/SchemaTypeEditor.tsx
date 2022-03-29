import { Card, Text } from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import React from 'react';
import type {
  SchemaFieldDraft,
  SchemaEditorStateAction,
  SchemaTypeDraft,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';

interface Props {
  entityType: SchemaTypeDraft;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}

export function SchemaTypeEditor({ entityType, dispatchSchemaEditorState: _unused }: Props) {
  return (
    <>
      <Text textStyle="headline4">{entityType.name}</Text>
      {entityType.fields.map((field) => (
        <SchemaFieldEditor key={field.name} field={field} />
      ))}
    </>
  );
}

function SchemaFieldEditor({ field }: { field: SchemaFieldDraft }) {
  return (
    <Card>
      <Card.Header>{field.name}</Card.Header>
    </Card>
  );
}
