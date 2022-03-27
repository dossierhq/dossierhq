import type { Dispatch } from 'react';
import React from 'react';
import type {
  SchemaEditorState,
  SchemaEditorStateAction,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';
import { SchemaEntityTypeEditor } from '../SchemaEntityTypeEditor/SchemaEntityTypeEditor';

interface Props {
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}

export function SchemaEditor({ schemaEditorState, dispatchSchemaEditorState }: Props) {
  return (
    <>
      {schemaEditorState.entityTypes.map((entityType) => (
        <SchemaEntityTypeEditor
          key={entityType.name}
          entityType={entityType}
          dispatchSchemaEditorState={dispatchSchemaEditorState}
        />
      ))}
    </>
  );
}
