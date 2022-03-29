import { Card } from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import React from 'react';
import type {
  SchemaEditorStateAction,
  SchemaFieldDraft,
  SchemaTypeDraft,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';

interface Props {
  type: SchemaTypeDraft;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}

export function SchemaTypeEditor({ type, dispatchSchemaEditorState: _unused }: Props) {
  return (
    <>
      {type.fields.map((field) => (
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
