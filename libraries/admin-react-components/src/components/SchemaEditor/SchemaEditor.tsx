import type { Dispatch } from 'react';
import React from 'react';
import type {
  SchemaEditorState,
  SchemaEditorStateAction,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';
import { SchemaTypeEditor } from '../SchemaTypeEditor/SchemaTypeEditor';

interface Props {
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}

export function SchemaEditor({ schemaEditorState, dispatchSchemaEditorState }: Props) {
  return (
    <>
      {schemaEditorState.entityTypes.map((entityType) => (
        <SchemaTypeEditor
          key={entityType.name}
          entityType={entityType}
          dispatchSchemaEditorState={dispatchSchemaEditorState}
        />
      ))}
      {schemaEditorState.valueTypes.map((valueType) => (
        <SchemaTypeEditor
          key={valueType.name}
          entityType={valueType}
          dispatchSchemaEditorState={dispatchSchemaEditorState}
        />
      ))}
    </>
  );
}
